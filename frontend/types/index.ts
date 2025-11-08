export interface SkillMatch {
  skill_name: string
  match_percentage: number
  level: 'expert' | 'proficient' | 'intermediate' | 'beginner' | 'missing'
  relevance: 'high' | 'medium' | 'low'
}

export interface CVMatchResult {
  filename: string
  file_id?: string | null
  match_percentage: number
  skills_match: number
  experience_match: number
  education_match: number
  overall_match: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  skill_breakdown: SkillMatch[]
  required_skills_missing: string[]
  years_of_experience?: number | null
  education_level?: string | null
  certifications: string[]
  languages: string[]
  technical_skills_score: number
  soft_skills_score: number
  leadership_score: number
  communication_score: number
}

export interface FilterResponse {
  results: CVMatchResult[]
  total_cvs: number
}

export interface ProgressUpdate {
  filename: string
  status: 'processing' | 'analyzing' | 'completed' | 'error'
  progress: number
  current_step: string
}

