from typing import List, Dict
from app.services.file_processor import FileProcessor
from app.services.llm_service import LLMService
from app.models import CVMatchResult
import os

class CVMatcher:
    """Service for matching CVs against requirements"""
    
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
        requirements: str
    ) -> List[CVMatchResult]:
        """
        Process multiple CV files and return match results
        file_paths: List of tuples (file_path, filename, extension)
        """
        results = []
        
        for file_path, filename, extension in file_paths:
            try:
                # Extract text from CV
                cv_text = await self.file_processor.extract_text(file_path, extension)
                
                if not cv_text or len(cv_text.strip()) < 50:
                    # If text extraction failed or too short, create a low-score result
                    results.append(CVMatchResult(
                        filename=filename,
                        match_percentage=0,
                        skills_match=0,
                        experience_match=0,
                        education_match=0,
                        overall_match=0,
                        summary="Could not extract sufficient text from CV",
                        strengths=[],
                        weaknesses=["Text extraction failed or insufficient content"]
                    ))
                    continue
                
                # Analyze with LLM
                analysis = await self.llm_service.analyze_cv_match(cv_text, requirements)
                
                # Create result object
                result = CVMatchResult(
                    filename=filename,
                    match_percentage=analysis.get("match_percentage", 0),
                    skills_match=analysis.get("skills_match", 0),
                    experience_match=analysis.get("experience_match", 0),
                    education_match=analysis.get("education_match", 0),
                    overall_match=analysis.get("overall_match", 0),
                    summary=analysis.get("summary", "No summary available"),
                    strengths=analysis.get("strengths", []),
                    weaknesses=analysis.get("weaknesses", [])
                )
                
                results.append(result)
                
            except Exception as e:
                # Handle errors for individual files
                results.append(CVMatchResult(
                    filename=filename,
                    match_percentage=0,
                    skills_match=0,
                    experience_match=0,
                    education_match=0,
                    overall_match=0,
                    summary=f"Error processing CV: {str(e)}",
                    strengths=[],
                    weaknesses=[f"Processing error: {str(e)}"]
                ))
        
        # Sort results by match_percentage (descending)
        results.sort(key=lambda x: x.match_percentage, reverse=True)
        
        return results

