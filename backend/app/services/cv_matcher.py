from typing import List, Dict, Callable, Optional
from app.services.file_processor import FileProcessor
from app.services.llm_service import LLMService
from app.models import CVMatchResult, SkillMatch
import os
import asyncio

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
                # Progress: Starting file processing (1% for this file to show it's started)
                if progress_callback:
                    progress_callback(filename, "processing", 1, f"Starting processing {filename}...")
                
                await asyncio.sleep(0.1)  # Small delay for UI update
                
                # Extract text from CV (1-25% of this file's progress)
                if progress_callback:
                    progress_callback(filename, "processing", 5, f"Uploading {filename}...")
                
                await asyncio.sleep(0.1)  # Small delay for UI update
                
                if progress_callback:
                    progress_callback(filename, "processing", 10, f"Extracting text from {filename}...")
                
                cv_text = await self.file_processor.extract_text(file_path, extension)
                
                if progress_callback:
                    progress_callback(filename, "processing", 25, f"Text extracted from {filename}")
                
                await asyncio.sleep(0.1)  # Small delay for UI update
                
                if not cv_text or len(cv_text.strip()) < 50:
                    # If text extraction failed or too short, create a low-score result
                    if progress_callback:
                        progress_callback(filename, "error", 100, "Text extraction failed - insufficient content")
                    
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
                
                # Progress: Analyzing with LLM (25-95% of this file's progress)
                if progress_callback:
                    progress_callback(filename, "analyzing", 30, f"Preparing AI analysis for {filename}...")
                
                await asyncio.sleep(0.1)  # Small delay for UI update
                
                if progress_callback:
                    progress_callback(filename, "analyzing", 40, f"Sending {filename} to AI for analysis...")
                
                await asyncio.sleep(0.1)
                
                if progress_callback:
                    progress_callback(filename, "analyzing", 50, f"AI is analyzing {filename} (this may take a moment)...")
                
                # Analyze with LLM - this is the longest operation
                analysis = await self.llm_service.analyze_cv_match(cv_text, requirements)
                
                if progress_callback:
                    progress_callback(filename, "analyzing", 85, f"Processing analysis results for {filename}...")
                
                await asyncio.sleep(0.1)  # Small delay for UI update
                
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
                
                if progress_callback:
                    progress_callback(filename, "analyzing", 95, f"Finalizing results for {filename}...")
                
                await asyncio.sleep(0.1)  # Small delay for UI update
                
                # Create result object with all new fields
                result = CVMatchResult(
                    filename=filename,
                    file_id=None,  # Will be set by the route handler
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
                
                # Progress: Completed (100% for this file)
                if progress_callback:
                    progress_callback(filename, "completed", 100, f"Successfully completed analysis of {filename}")
                
                await asyncio.sleep(0.2)  # Small delay before next file
                
            except Exception as e:
                # Handle errors for individual files
                if progress_callback:
                    progress_callback(filename, "error", 100, f"Error processing {filename}: {str(e)}")
                
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

