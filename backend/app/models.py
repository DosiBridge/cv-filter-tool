from pydantic import BaseModel
from typing import List, Optional

class CVUploadRequest(BaseModel):
    requirements: str

class CVMatchResult(BaseModel):
    filename: str
    match_percentage: float
    skills_match: float
    experience_match: float
    education_match: float
    overall_match: float
    summary: str
    strengths: List[str]
    weaknesses: List[str]

class FilterResponse(BaseModel):
    results: List[CVMatchResult]
    total_cvs: int

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None

