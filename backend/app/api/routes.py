from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import List
import os
import uuid
import aiofiles
from app.services.cv_matcher import CVMatcher
from app.models import FilterResponse, CVMatchResult, ErrorResponse

router = APIRouter()

# Create upload directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=FilterResponse)
async def upload_and_filter_cvs(
    requirements: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    Upload multiple CV files and filter them against requirements
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    if not requirements or not requirements.strip():
        raise HTTPException(status_code=400, detail="Requirements cannot be empty")
    
    # Validate file types
    # Note: Legacy .doc files are not fully supported - recommend .docx
    allowed_extensions = ['.pdf', '.docx']
    file_paths = []
    
    try:
        # Save uploaded files temporarily
        for file in files:
            # Check file extension
            file_extension = os.path.splitext(file.filename)[1].lower()
            if file_extension not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {file_extension}. Allowed types: {', '.join(allowed_extensions)}. Note: Legacy .doc files are not supported. Please convert to .docx format."
                )
            
            # Generate unique filename
            unique_id = str(uuid.uuid4())
            file_path = os.path.join(UPLOAD_DIR, f"{unique_id}_{file.filename}")
            
            # Save file
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
                pass  # Ignore cleanup errors
        
        return FilterResponse(
            results=results,
            total_cvs=len(results)
        )
        
    except HTTPException:
        # Clean up on error
        for file_path, _, _ in file_paths:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass
        raise
    except Exception as e:
        # Clean up on error
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

