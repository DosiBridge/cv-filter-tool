from typing import List, Dict, Callable, Optional
from app.services.file_processor import FileProcessor
from app.services.llm_service import LLMService
from app.models import CVMatchResult, SkillMatch
import os
import asyncio
import time

class CVMatcher:
    """Service for matching CVs against requirements with time-based progress tracking"""
    
    def __init__(self):
        self.file_processor = FileProcessor()
        self._llm_service = None
    
    @property
    def llm_service(self):
        """Lazy initialization of LLM service"""
        if self._llm_service is None:
            self._llm_service = LLMService()
        return self._llm_service
    
    async def _process_single_file(
        self,
        file_path: str,
        filename: str,
        extension: str,
        requirements: str,
        progress_callback: Optional[Callable[[str, str, float, str], None]] = None,
        estimated_time: float = 30.0
    ) -> CVMatchResult:
        """
        Process a single CV file with time-based progress tracking
        estimated_time: Estimated total processing time in seconds (default 30s)
        """
        start_time = time.time()
        
        # Helper function to calculate progress based on elapsed time
        def calculate_progress(elapsed: float, max_progress: float = 99.0) -> float:
            """Calculate progress percentage based on elapsed time"""
            progress = min((elapsed / estimated_time) * 100, max_progress)
            return max(0.0, progress)
        
        try:
            # Initialize progress
            if progress_callback:
                progress_callback(filename, "processing", 0, f"Initializing {filename}...")
            
            # Phase 1: File processing and text extraction (0-30% of estimated time)
            text_extraction_start = time.time()
            
            # Extract text from CV
            if progress_callback:
                elapsed = time.time() - start_time
                progress = calculate_progress(elapsed, 25.0)
                progress_callback(filename, "processing", progress, f"Extracting text from {filename}...")
            
            cv_text = await self.file_processor.extract_text(file_path, extension)
            
            text_extraction_time = time.time() - text_extraction_start
            # Update estimated time if text extraction took longer than expected
            if text_extraction_time > estimated_time * 0.3:
                estimated_time = text_extraction_time * 3.5  # Adjust estimate
            
            if progress_callback:
                elapsed = time.time() - start_time
                progress = calculate_progress(elapsed, 30.0)
                progress_callback(filename, "processing", progress, f"Text extraction complete for {filename}")
            
            if not cv_text or len(cv_text.strip()) < 50:
                # If text extraction failed
                if progress_callback:
                    progress_callback(filename, "error", 100, "Text extraction failed - insufficient content")
                
                return CVMatchResult(
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
                )
            
            # Phase 2: AI Analysis (30-95% of estimated time)
            analysis_start = time.time()
            
            if progress_callback:
                elapsed = time.time() - start_time
                progress = calculate_progress(elapsed, 35.0)
                progress_callback(filename, "analyzing", progress, f"Sending {filename} to AI for analysis...")
            
            # Start AI analysis task
            analysis_task = asyncio.create_task(
                self.llm_service.analyze_cv_match(cv_text, requirements)
            )
            
            # Monitor progress during AI analysis with smooth time-based updates
            last_progress_update = 30.0
            progress_update_interval = 0.2  # Update every 0.2 seconds for smoother progress
            last_update_time = time.time()
            
            while not analysis_task.done():
                elapsed = time.time() - start_time
                analysis_elapsed = time.time() - analysis_start
                
                # Estimate AI will take 70% of total estimated time
                ai_estimated_time = estimated_time * 0.7
                
                # Calculate progress based on elapsed time vs estimated time
                # Text extraction: 0-30% (takes ~10% of time)
                # AI analysis: 30-95% (takes ~70% of time)
                # Result processing: 95-99% (takes ~20% of time)
                
                if ai_estimated_time > 0 and analysis_elapsed < ai_estimated_time:
                    # Progress during AI analysis: 30% + (elapsed/estimated) * 65%
                    ai_progress_ratio = min(analysis_elapsed / ai_estimated_time, 1.0)
                    current_progress = 30.0 + (ai_progress_ratio * 65.0)
                elif analysis_elapsed >= ai_estimated_time:
                    # If AI is taking longer than estimated, continue progress smoothly
                    # Use exponential slowdown to approach 95%
                    extra_time = analysis_elapsed - ai_estimated_time
                    # Slow progress as we approach 95%
                    remaining_progress = 65.0 * (1.0 - (1.0 / (1.0 + extra_time / 5.0)))
                    current_progress = min(30.0 + remaining_progress, 95.0)
                else:
                    # Fallback: linear progress
                    current_progress = min(30.0 + (analysis_elapsed / max(ai_estimated_time, 20.0)) * 65, 95.0)
                
                # Update progress smoothly (every 0.2 seconds or if significant change)
                current_time = time.time()
                time_since_update = current_time - last_update_time
                
                if time_since_update >= progress_update_interval or current_progress - last_progress_update >= 0.5:
                    if progress_callback:
                        progress_callback(
                            filename,
                            "analyzing",
                            min(current_progress, 95.0),
                            f"AI is analyzing {filename}... ({int(min(current_progress, 95.0))}%)"
                        )
                    last_progress_update = current_progress
                    last_update_time = current_time
                
                await asyncio.sleep(0.1)  # Check more frequently for responsiveness
            
            # Get analysis result
            analysis = await analysis_task
            
            # Update estimated time based on actual AI analysis time
            actual_ai_time = time.time() - analysis_start
            if actual_ai_time > estimated_time * 0.7:
                # If AI took longer, adjust our understanding
                estimated_time = (time.time() - start_time) * 1.1
            
            # Phase 3: Result processing (95-99%)
            if progress_callback:
                elapsed = time.time() - start_time
                progress = calculate_progress(elapsed, 97.0)
                progress_callback(filename, "analyzing", progress, f"Processing analysis results for {filename}...")
            
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
                elapsed = time.time() - start_time
                progress = calculate_progress(elapsed, 99.0)
                progress_callback(filename, "analyzing", progress, f"Finalizing results for {filename}...")
            
            # Create result object
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
            
            # Complete (100%)
            if progress_callback:
                total_time = time.time() - start_time
                progress_callback(
                    filename,
                    "completed",
                    100,
                    f"Successfully completed analysis of {filename} (took {total_time:.1f}s)"
                )
            
            return result
            
        except Exception as e:
            # Handle errors
            if progress_callback:
                elapsed = time.time() - start_time
                progress_callback(filename, "error", 100, f"Error processing {filename}: {str(e)}")
            
            return CVMatchResult(
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
            )
    
    async def process_cv_files(
        self, 
        file_paths: List[tuple], 
        requirements: str,
        progress_callback: Optional[Callable[[str, str, float, str], None]] = None
    ) -> List[CVMatchResult]:
        """
        Process multiple CV files with time-based progress tracking
        file_paths: List of tuples (file_path, filename, extension)
        progress_callback: Optional callback function (filename, status, progress, step)
        """
        results = []
        total_files = len(file_paths)
        
        # Estimate processing time per file (default 30 seconds, can adjust based on file size)
        base_estimated_time = 30.0
        
        # Process files sequentially (one at a time) with individual time tracking
        for index, (file_path, filename, extension) in enumerate(file_paths):
            try:
                # Estimate time based on file size (larger files might take longer)
                file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
                # Adjust estimate: 20s base + 10s per MB (capped at 60s)
                estimated_time = min(base_estimated_time + (file_size / 1024 / 1024) * 10, 60.0)
                
                # Process single file with time-based progress
                result = await self._process_single_file(
                    file_path,
                    filename,
                    extension,
                    requirements,
                    progress_callback,
                    estimated_time
                )
                
                results.append(result)
                
                # Small delay before next file
                await asyncio.sleep(0.1)
                
            except Exception as e:
                # Handle file-level errors
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
