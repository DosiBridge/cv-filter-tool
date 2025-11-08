from typing import List, Dict, Callable, Optional
from app.services.file_processor import FileProcessor
from app.services.llm_service import LLMService
from app.models import CVMatchResult, SkillMatch
import os

class CVMatcher:
    """Service for matching CVs against requirements with progress tracking"""
    
    def __init__(self):
        self.file_processor = FileProcessor()
        self._llm_service = None
    
    @property
    def llm_service(self):
        """Lazy initialization of LLM service"""
        if self._llm_service is None:
            self._llm_service = LLMService()
        return self._llm_service
    
    async def process_cv_files(
        self, 
        file_paths: List[tuple], 
        requirements: str,
        progress_callback: Optional[Callable[[str, str, float, str], None]] = None
    ) -> List[CVMatchResult]:
        """
        Process multiple CV files and return match results with progress tracking
        file_paths: List of tuples (file_path, filename, extension)
        progress_callback: Optional callback function (filename, status, progress, step)
        """
        results = []
        total_files = len(file_paths)
        
        for index, (file_path, filename, extension) in enumerate(file_paths):
            try:
                # Progress: Starting file processing
                if progress_callback:
                    progress_callback(filename, "processing", (index / total_files) * 100, f"Processing {filename}...")
                
                # Extract text from CV (30% of progress)
                if progress_callback:
                    progress_callback(filename, "processing", (index / total_files) * 100 + 5, f"Extracting text from {filename}...")
                
                cv_text = await self.file_processor.extract_text(file_path, extension)
                
                if not cv_text or len(cv_text.strip()) < 50:
                    # If text extraction failed or too short, create a low-score result
                    if progress_callback:
                        progress_callback(filename, "error", (index / total_files) * 100 + 30, "Text extraction failed")
                    
                    results.append(CVMatchResult(
                        filename=filename,
                        match_percentage=0,
                        skills_match=0,
                        experience_match=0,
                        education_match=0,
                        overall_match=0,
                        summary="Could not extract sufficient text from CV",
                        strengths=[],
                        weaknesses=["Text extraction failed or insufficient content"],
                        skill_breakdown=[],
                        required_skills_missing=[],
                        technical_skills_score=0.0,
                        soft_skills_score=0.0,
                        leadership_score=0.0,
                        communication_score=0.0
                    ))
                    continue
                
                # Progress: Analyzing with LLM (30-90% of file progress)
                if progress_callback:
                    progress_callback(filename, "analyzing", (index / total_files) * 100 + 30, f"Analyzing {filename} with AI...")
                
                # Analyze with LLM
                analysis = await self.llm_service.analyze_cv_match(cv_text, requirements)
                
                # Progress: Processing results
                if progress_callback:
                    progress_callback(filename, "analyzing", (index / total_files) * 100 + 85, "Processing analysis results...")
                
                # Convert skill_breakdown to SkillMatch objects
                skill_breakdown = []
                for skill in analysis.get("skill_breakdown", []):
                    if isinstance(skill, dict):
                        skill_breakdown.append(SkillMatch(
                            skill_name=skill.get("skill_name", "Unknown"),
                            match_percentage=float(skill.get("match_percentage", 0)),
                            level=skill.get("level", "missing"),
                            relevance=skill.get("relevance", "low")
                        ))
                
                # Create result object with all new fields
                result = CVMatchResult(
                    filename=filename,
                    match_percentage=analysis.get("match_percentage", 0),
                    skills_match=analysis.get("skills_match", 0),
                    experience_match=analysis.get("experience_match", 0),
                    education_match=analysis.get("education_match", 0),
                    overall_match=analysis.get("overall_match", 0),
                    summary=analysis.get("summary", "No summary available"),
                    strengths=analysis.get("strengths", []),
                    weaknesses=analysis.get("weaknesses", []),
                    skill_breakdown=skill_breakdown,
                    required_skills_missing=analysis.get("required_skills_missing", []),
                    years_of_experience=analysis.get("years_of_experience"),
                    education_level=analysis.get("education_level"),
                    certifications=analysis.get("certifications", []),
                    languages=analysis.get("languages", []),
                    technical_skills_score=analysis.get("technical_skills_score", 0.0),
                    soft_skills_score=analysis.get("soft_skills_score", 0.0),
                    leadership_score=analysis.get("leadership_score", 0.0),
                    communication_score=analysis.get("communication_score", 0.0)
                )
                
                results.append(result)
                
                # Progress: Completed
                if progress_callback:
                    progress_callback(filename, "completed", ((index + 1) / total_files) * 100, f"Completed analysis of {filename}")
                
            except Exception as e:
                # Handle errors for individual files
                if progress_callback:
                    progress_callback(filename, "error", (index / total_files) * 100 + 50, f"Error: {str(e)}")
                
                results.append(CVMatchResult(
                    filename=filename,
                    match_percentage=0,
                    skills_match=0,
                    experience_match=0,
                    education_match=0,
                    overall_match=0,
                    summary=f"Error processing CV: {str(e)}",
                    strengths=[],
                    weaknesses=[f"Processing error: {str(e)}"],
                    skill_breakdown=[],
                    required_skills_missing=[],
                    technical_skills_score=0.0,
                    soft_skills_score=0.0,
                    leadership_score=0.0,
                    communication_score=0.0
                ))
        
        # Sort results by match_percentage (descending)
        results.sort(key=lambda x: x.match_percentage, reverse=True)
        
        return results

