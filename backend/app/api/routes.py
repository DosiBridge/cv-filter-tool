from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List
import os
import uuid
import aiofiles
import asyncio
import json
from app.services.cv_matcher import CVMatcher
from app.models import FilterResponse, CVMatchResult, ErrorResponse, ProgressUpdate

router = APIRouter()

# Create upload directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
        
        try:
            # Save uploaded files temporarily
            for file in files:
                file_extension = os.path.splitext(file.filename)[1].lower()
                if file_extension not in allowed_extensions:
                    error = f"Unsupported file type: {file_extension}"
                    yield f"data: {json.dumps({'type': 'error', 'message': error})}\n\n"
                    return
                
                unique_id = str(uuid.uuid4())
                file_path = os.path.join(UPLOAD_DIR, f"{unique_id}_{file.filename}")
                
                async with aiofiles.open(file_path, 'wb') as f:
                    content = await file.read()
                    await f.write(content)
                
                file_paths.append((file_path, file.filename, file_extension))
            
            # Start processing in background
            processing_task = asyncio.create_task(
                process_with_progress(file_paths, requirements, progress_queue)
            )
            
            # Stream progress updates
            while True:
                try:
                    # Get progress update with timeout
                    update = await asyncio.wait_for(progress_queue.get(), timeout=0.1)
                    yield f"data: {json.dumps({'type': 'progress', 'data': update.dict()})}\n\n"
                    
                    if update.status == "completed" and update.progress >= 100:
                        break
                except asyncio.TimeoutError:
                    # Check if processing is done
                    if processing_task.done():
                        break
                    continue
            
            # Get final results
            results = await processing_task
            
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
            # Clean up uploaded files
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
    
    try:
        # Save uploaded files temporarily
        for file in files:
            file_extension = os.path.splitext(file.filename)[1].lower()
            if file_extension not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {file_extension}. Allowed types: {', '.join(allowed_extensions)}"
                )
            
            unique_id = str(uuid.uuid4())
            file_path = os.path.join(UPLOAD_DIR, f"{unique_id}_{file.filename}")
            
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            file_paths.append((file_path, file.filename, file_extension))
        
        # Process CVs
        matcher = CVMatcher()
        results = await matcher.process_cv_files(file_paths, requirements)
        
        # Clean up uploaded files
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

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

