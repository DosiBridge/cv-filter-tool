from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from typing import List, Dict
import os
import uuid
import aiofiles
import asyncio
import json
import shutil
from datetime import datetime, timedelta
from app.services.cv_matcher import CVMatcher
from app.models import FilterResponse, CVMatchResult, ErrorResponse, ProgressUpdate

router = APIRouter()

# Create upload directory if it doesn't exist
UPLOAD_DIR = "uploads"
STORAGE_DIR = "file_storage"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STORAGE_DIR, exist_ok=True)

# Store file mappings (file_id -> file_path)
file_storage: Dict[str, Dict[str, any]] = {}

async def process_with_progress(file_paths, requirements, progress_queue):
    """Process CVs and send progress updates via queue"""
    matcher = CVMatcher()
    
    def progress_callback(filename, status, progress, step):
        """Callback to send progress updates"""
        update = ProgressUpdate(
            filename=filename,
            status=status,
            progress=progress,
            current_step=step
        )
        progress_queue.put_nowait(update)
    
    try:
        results = await matcher.process_cv_files(
            file_paths, 
            requirements,
            progress_callback=progress_callback
        )
        return results
    except Exception as e:
        raise e

@router.post("/upload")
async def upload_and_filter_cvs(
    requirements: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    Upload multiple CV files and filter them against requirements
    Returns Server-Sent Events (SSE) stream with progress updates and final results
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    if not requirements or not requirements.strip():
        raise HTTPException(status_code=400, detail="Requirements cannot be empty")
    
    # Validate file types
    allowed_extensions = ['.pdf', '.docx']
    file_paths = []
    
    async def generate():
        """Generate SSE stream with progress updates"""
        progress_queue = asyncio.Queue()
        results = None
        error = None
        file_id_mapping: Dict[str, str] = {}  # filename -> file_id
        
        try:
            # Save uploaded files and store them for download/preview
            for file in files:
                file_extension = os.path.splitext(file.filename)[1].lower()
                if file_extension not in allowed_extensions:
                    error = f"Unsupported file type: {file_extension}"
                    yield f"data: {json.dumps({'type': 'error', 'message': error})}\n\n"
                    return
                
                # Generate unique IDs
                upload_id = str(uuid.uuid4())
                file_id = str(uuid.uuid4())
                
                # Save to upload directory for processing
                upload_path = os.path.join(UPLOAD_DIR, f"{upload_id}_{file.filename}")
                
                async with aiofiles.open(upload_path, 'wb') as f:
                    content = await file.read()
                    await f.write(content)
                
                # Copy to storage directory for download/preview
                storage_path = os.path.join(STORAGE_DIR, f"{file_id}_{file.filename}")
                shutil.copy2(upload_path, storage_path)
                
                # Store file metadata
                file_storage[file_id] = {
                    'path': storage_path,
                    'filename': file.filename,
                    'uploaded_at': datetime.now(),
                    'file_id': file_id
                }
                
                file_id_mapping[file.filename] = file_id
                file_paths.append((upload_path, file.filename, file_extension))
            
            # Start processing in background
            processing_task = asyncio.create_task(
                process_with_progress(file_paths, requirements, progress_queue)
            )
            
            # Track completed/errored files to ensure we process all files
            completed_files = set()
            total_files = len(file_paths)
            
            # Send initial progress for all files (0% - queued)
            for _, filename, _ in file_paths:
                initial_update = ProgressUpdate(
                    filename=filename,
                    status="processing",
                    progress=0,
                    current_step=f"Queued for processing: {filename}..."
                )
                yield f"data: {json.dumps({'type': 'progress', 'data': initial_update.dict()})}\n\n"
                await asyncio.sleep(0.05)  # Small delay between initial updates
            
            # Stream progress updates until all files are processed
            while True:
                try:
                    # Get progress update with timeout
                    update = await asyncio.wait_for(progress_queue.get(), timeout=0.1)
                    yield f"data: {json.dumps({'type': 'progress', 'data': update.dict()})}\n\n"
                    
                    # Track completed or errored files
                    if (update.status == "completed" and update.progress >= 100) or update.status == "error":
                        completed_files.add(update.filename)
                    
                    # Check if all files are completed or errored
                    if len(completed_files) >= total_files:
                        # Wait a bit more to get any remaining updates
                        await asyncio.sleep(0.3)
                        # Try to get any remaining updates
                        try:
                            while True:
                                update = await asyncio.wait_for(progress_queue.get(), timeout=0.05)
                                yield f"data: {json.dumps({'type': 'progress', 'data': update.dict()})}\n\n"
                                if (update.status == "completed" and update.progress >= 100) or update.status == "error":
                                    completed_files.add(update.filename)
                        except asyncio.TimeoutError:
                            pass
                        break
                except asyncio.TimeoutError:
                    # Check if processing task is done
                    if processing_task.done():
                        # Get any remaining updates
                        await asyncio.sleep(0.2)
                        try:
                            while True:
                                update = await asyncio.wait_for(progress_queue.get(), timeout=0.05)
                                yield f"data: {json.dumps({'type': 'progress', 'data': update.dict()})}\n\n"
                                if (update.status == "completed" and update.progress >= 100) or update.status == "error":
                                    completed_files.add(update.filename)
                        except asyncio.TimeoutError:
                            pass
                        break
                    continue
            
            # Get final results
            results = await processing_task
            
            # Add file_id to each result
            for result in results:
                if result.filename in file_id_mapping:
                    result.file_id = file_id_mapping[result.filename]
            
            # Send final results
            response_data = {
                "type": "results",
                "data": {
                    "results": [result.dict() for result in results],
                    "total_cvs": len(results)
                }
            }
            yield f"data: {json.dumps(response_data)}\n\n"
            
        except Exception as e:
            error = str(e)
            yield f"data: {json.dumps({'type': 'error', 'message': error})}\n\n"
        finally:
            # Clean up uploaded files (but keep storage files for download/preview)
            for file_path, _, _ in file_paths:
                try:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except Exception:
                    pass
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/upload-sync", response_model=FilterResponse)
async def upload_and_filter_cvs_sync(
    requirements: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    Upload multiple CV files and filter them against requirements (synchronous version)
    Use this endpoint if SSE is not supported
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    if not requirements or not requirements.strip():
        raise HTTPException(status_code=400, detail="Requirements cannot be empty")
    
    allowed_extensions = ['.pdf', '.docx']
    file_paths = []
    
    file_id_mapping: Dict[str, str] = {}
    
    try:
        # Save uploaded files and store them for download/preview
        for file in files:
            file_extension = os.path.splitext(file.filename)[1].lower()
            if file_extension not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {file_extension}. Allowed types: {', '.join(allowed_extensions)}"
                )
            
            upload_id = str(uuid.uuid4())
            file_id = str(uuid.uuid4())
            
            # Save to upload directory for processing
            upload_path = os.path.join(UPLOAD_DIR, f"{upload_id}_{file.filename}")
            
            async with aiofiles.open(upload_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            # Copy to storage directory for download/preview
            storage_path = os.path.join(STORAGE_DIR, f"{file_id}_{file.filename}")
            shutil.copy2(upload_path, storage_path)
            
            # Store file metadata
            file_storage[file_id] = {
                'path': storage_path,
                'filename': file.filename,
                'uploaded_at': datetime.now(),
                'file_id': file_id
            }
            
            file_id_mapping[file.filename] = file_id
            file_paths.append((upload_path, file.filename, file_extension))
        
        # Process CVs
        matcher = CVMatcher()
        results = await matcher.process_cv_files(file_paths, requirements)
        
        # Add file_id to each result
        for result in results:
            if result.filename in file_id_mapping:
                result.file_id = file_id_mapping[result.filename]
        
        # Clean up uploaded files (but keep storage files)
        for file_path, _, _ in file_paths:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass
        
        return FilterResponse(
            results=results,
            total_cvs=len(results)
        )
        
    except HTTPException:
        for file_path, _, _ in file_paths:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass
        raise
    except Exception as e:
        for file_path, _, _ in file_paths:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"Error processing CVs: {str(e)}")

@router.get("/file/{file_id}")
async def get_file(file_id: str):
    """Get file for preview or download"""
    if file_id not in file_storage:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_info = file_storage[file_id]
    file_path = file_info['path']
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        file_path,
        media_type='application/pdf' if file_path.endswith('.pdf') else 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filename=file_info['filename']
    )

@router.get("/file/{file_id}/preview")
async def preview_file(file_id: str):
    """Preview file (same as get_file but with inline disposition)"""
    if file_id not in file_storage:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_info = file_storage[file_id]
    file_path = file_info['path']
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        file_path,
        media_type='application/pdf' if file_path.endswith('.pdf') else 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filename=file_info['filename'],
        headers={"Content-Disposition": f"inline; filename={file_info['filename']}"}
    )

@router.delete("/file/{file_id}")
async def delete_file(file_id: str):
    """Delete stored file"""
    if file_id not in file_storage:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_info = file_storage[file_id]
    file_path = file_info['path']
    
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
        del file_storage[file_id]
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

