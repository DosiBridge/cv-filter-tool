from pydantic import BaseModel
from typing import List, Optional, Dict

class SkillMatch(BaseModel):
    skill_name: str
    match_percentage: float
    level: str  # "expert", "proficient", "intermediate", "beginner", "missing"
    relevance: str  # "high", "medium", "low"

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
    # Granular breakdowns
    skill_breakdown: List[SkillMatch]
    required_skills_missing: List[str]
    years_of_experience: Optional[float] = None
    education_level: Optional[str] = None
    certifications: List[str] = []
    languages: List[str] = []
    technical_skills_score: float = 0.0
    soft_skills_score: float = 0.0
    leadership_score: float = 0.0
    communication_score: float = 0.0

class ProgressUpdate(BaseModel):
    filename: str
    status: str  # "processing", "analyzing", "completed", "error"
    progress: float  # 0-100
    current_step: str

class FilterResponse(BaseModel):
    results: List[CVMatchResult]
    total_cvs: int

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None

