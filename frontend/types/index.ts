export interface CVMatchResult {
  filename: string
  match_percentage: number
  skills_match: number
  experience_match: number
  education_match: number
  overall_match: number
  summary: string
  strengths: string[]
  weaknesses: string[]
}

export interface FilterResponse {
  results: CVMatchResult[]
  total_cvs: number
}

