import os
from openai import OpenAI
from typing import Dict, List
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class LLMService:
    """Service for interacting with LLM for CV analysis"""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or api_key == "your_openai_api_key_here":
            raise ValueError(
                "OPENAI_API_KEY environment variable is not set. "
                "Please set it in the backend/.env file"
            )
        
        # Initialize OpenAI client
        # Use explicit httpx client configuration to avoid proxy issues
        try:
            import httpx
            # Create httpx client with timeout but no proxy configuration
            # Don't pass proxies parameter at all to avoid conflicts
            http_client = httpx.Client(timeout=60.0)
            
            # Initialize OpenAI with custom http_client
            # This ensures we have full control over the HTTP client configuration
            self.client = OpenAI(
                api_key=api_key,
                http_client=http_client
            )
        except (TypeError, AttributeError) as e:
            # If http_client parameter doesn't work with this OpenAI version, try without it
            # This handles different versions of the OpenAI library
            try:
                self.client = OpenAI(api_key=api_key)
            except Exception as init_error:
                raise ValueError(
                    f"Failed to initialize OpenAI client: {str(init_error)}. "
                    "Please check your OpenAI API key and library version. "
                    f"Original error: {str(e)}"
                )
        except Exception as e:
            raise ValueError(
                f"Failed to initialize OpenAI client: {str(e)}. "
                "Please check your OpenAI API key and library version."
            )
        
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    async def analyze_cv_match(
        self, 
        cv_text: str, 
        requirements: str
    ) -> Dict:
        """
        Analyze CV against requirements using LLM with granular skill-based analysis
        Returns a dictionary with detailed match scores and analysis
        """
        prompt = f"""
You are an expert HR recruiter analyzing a CV against job requirements. Provide a comprehensive, granular analysis.

JOB REQUIREMENTS:
{requirements}

CV CONTENT:
{cv_text}

Analyze this CV and provide a detailed match assessment. Return your response as a JSON object with the following structure:
{{
    "match_percentage": <0-100>,
    "skills_match": <0-100>,
    "experience_match": <0-100>,
    "education_match": <0-100>,
    "overall_match": <0-100>,
    "technical_skills_score": <0-100>,
    "soft_skills_score": <0-100>,
    "leadership_score": <0-100>,
    "communication_score": <0-100>,
    "summary": "<brief 2-3 sentence summary>",
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2"],
    "years_of_experience": <number or null>,
    "education_level": "<degree level or null>",
    "certifications": ["cert1", "cert2"],
    "languages": ["language1", "language2"],
    "skill_breakdown": [
        {{
            "skill_name": "<skill name>",
            "match_percentage": <0-100>,
            "level": "<expert|proficient|intermediate|beginner|missing>",
            "relevance": "<high|medium|low>"
        }}
    ],
    "required_skills_missing": ["skill1", "skill2"]
}}

Analysis Guidelines:
1. Extract ALL skills mentioned in requirements and assess each individually
2. For each skill, determine the candidate's proficiency level
3. Calculate match percentage based on skill overlap and proficiency
4. Identify missing critical skills
5. Assess years of experience from CV content
6. Extract education level, certifications, and languages
7. Evaluate technical skills (programming, tools, technologies)
8. Evaluate soft skills (communication, teamwork, leadership)
9. Be precise and granular in your assessment

Return ONLY the JSON object, no additional text or markdown.
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert HR recruiter specializing in technical recruitment. Always respond with valid JSON only. Be thorough and granular in your skill analysis."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()
            
            result = json.loads(content)
            
            # Validate and ensure all required fields with defaults
            defaults = {
                "match_percentage": 0,
                "skills_match": 0,
                "experience_match": 0,
                "education_match": 0,
                "overall_match": 0,
                "technical_skills_score": 0,
                "soft_skills_score": 0,
                "leadership_score": 0,
                "communication_score": 0,
                "summary": "No summary available",
                "strengths": [],
                "weaknesses": [],
                "skill_breakdown": [],
                "required_skills_missing": [],
                "years_of_experience": None,
                "education_level": None,
                "certifications": [],
                "languages": []
            }
            
            # Apply defaults for missing fields
            for key, default_value in defaults.items():
                if key not in result:
                    result[key] = default_value
            
            # Ensure skill_breakdown is a list of proper dictionaries
            if not isinstance(result.get("skill_breakdown"), list):
                result["skill_breakdown"] = []
            
            # Validate skill_breakdown items
            validated_skills = []
            for skill in result["skill_breakdown"]:
                if isinstance(skill, dict):
                    validated_skills.append({
                        "skill_name": skill.get("skill_name", "Unknown"),
                        "match_percentage": float(skill.get("match_percentage", 0)),
                        "level": skill.get("level", "missing"),
                        "relevance": skill.get("relevance", "low")
                    })
            result["skill_breakdown"] = validated_skills
            
            return result
            
        except json.JSONDecodeError as e:
            # Fallback if JSON parsing fails
            return {
                "match_percentage": 50,
                "skills_match": 50,
                "experience_match": 50,
                "education_match": 50,
                "overall_match": 50,
                "technical_skills_score": 50,
                "soft_skills_score": 50,
                "leadership_score": 50,
                "communication_score": 50,
                "summary": "Error parsing LLM response. Manual review recommended.",
                "strengths": [],
                "weaknesses": ["Could not complete automated analysis"],
                "skill_breakdown": [],
                "required_skills_missing": [],
                "years_of_experience": None,
                "education_level": None,
                "certifications": [],
                "languages": []
            }
        except Exception as e:
            raise Exception(f"Error calling LLM service: {str(e)}")

