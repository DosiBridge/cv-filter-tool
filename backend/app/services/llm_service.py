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
        Analyze CV against requirements using LLM
        Returns a dictionary with match scores and analysis
        """
        prompt = f"""
You are an expert HR recruiter analyzing a CV against job requirements.

JOB REQUIREMENTS:
{requirements}

CV CONTENT:
{cv_text}

Please analyze this CV and provide a detailed match assessment. Return your response as a JSON object with the following structure:
{{
    "match_percentage": <0-100>,
    "skills_match": <0-100>,
    "experience_match": <0-100>,
    "education_match": <0-100>,
    "overall_match": <0-100>,
    "summary": "<brief 2-3 sentence summary>",
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2"]
}}

Consider:
- Skills: How well the candidate's skills match the requirements
- Experience: Relevance and depth of work experience
- Education: Educational background alignment
- Overall: Comprehensive match considering all factors

Be honest and critical in your assessment. Return ONLY the JSON object, no additional text.
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert HR recruiter. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            content = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()
            
            result = json.loads(content)
            
            # Validate and ensure all required fields
            required_fields = [
                "match_percentage", "skills_match", "experience_match",
                "education_match", "overall_match", "summary",
                "strengths", "weaknesses"
            ]
            
            for field in required_fields:
                if field not in result:
                    if field.endswith("_match"):
                        result[field] = 0
                    elif field == "summary":
                        result[field] = "No summary available"
                    elif field in ["strengths", "weaknesses"]:
                        result[field] = []
            
            return result
            
        except json.JSONDecodeError as e:
            # Fallback if JSON parsing fails
            return {
                "match_percentage": 50,
                "skills_match": 50,
                "experience_match": 50,
                "education_match": 50,
                "overall_match": 50,
                "summary": "Error parsing LLM response. Manual review recommended.",
                "strengths": [],
                "weaknesses": ["Could not complete automated analysis"]
            }
        except Exception as e:
            raise Exception(f"Error calling LLM service: {str(e)}")

