export interface User {
  id: string
  username: string
  display_name: string
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface DashboardData {
  resume_completeness: number
  recruitment_count: number
  targeted_resume_count: number
  open_gap_count: number
  recent_matches: MatchingProject[]
}

export interface WorkExperience {
  id: string
  company: string
  role: string
  start_date: string
  end_date: string
  is_current: boolean
  description: string
  achievements: string[]
  technologies: string[]
  version: number
}

export interface ProjectExperience {
  id: string
  name: string
  role: string
  start_date: string
  end_date: string
  background: string
  responsibilities: string[]
  achievements: string[]
  technologies: string[]
  metrics: string[]
  version: number
}

export interface Skill {
  id: string
  name: string
  category: string
  level: number
  evidence: string
  version: number
}

export interface Resume {
  id: string
  title: string
  kind: 'master' | 'targeted' | 'reference'
  status: string
  summary: string
  content: Record<string, unknown>
  source_resume_id?: string
  source_matching_id?: string
  version: number
  updated_at: string
}

export interface ResumeVersion {
  id: string
  resume_id: string
  version_no: number
  note: string
  snapshot: Record<string, unknown>
  created_at: string
}

export interface Company {
  id: string
  name: string
  industry: string
  description: string
  source_url: string
}

export interface JobPosting {
  id: string
  company_id?: string
  title: string
  job_family: string
  level: string
  location: string
  source_url: string
  source_text: string
  status: string
  version: number
  updated_at: string
}

export interface JobRequirement {
  id: string
  job_posting_id: string
  kind: string
  skill: string
  description: string
  importance: number
}

export interface MatchingProject {
  id: string
  job_posting_id: string
  resume_version_id: string
  status: string
  total_score: number
  score_breakdown: Array<Record<string, unknown>>
  updated_at: string
}

export interface FileAsset {
  id: string
  original_name: string
  mime_type: string
  size: number
  status: string
  extracted_text: string
  updated_at: string
}

export interface ProcessingTask {
  id: string
  task_type: string
  status: string
  progress: number
  input_data?: Record<string, unknown>
  result_data?: Record<string, unknown>
  error_code?: string
  error_message: string
  updated_at: string
}

export interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string
  details: Record<string, unknown>
  created_at: string
}

export interface SkillInsights {
  skill_frequency: Array<{ skill: string; count: number }>
  open_gap_count: number
  recommendations: string[]
}

export interface AIProvider {
  id: string
  name: string
  base_url: string
  model: string
  api_key_env: string
  api_key_configured: boolean
  timeout_seconds: number
  max_retries: number
  temperature: number
  max_tokens: number
  is_enabled: boolean
  is_default: boolean
}

export interface ReferenceSkill {
  name: string
  category: string
  level: number
  count: number
  evidence: string
}

export interface InterviewLevel {
  level: string
  label: string
  questions: string[]
}

export interface InterviewRoadmapItem {
  skill: string
  category: string
  levels: InterviewLevel[]
}

export interface ReferenceAnalysis {
  skills: ReferenceSkill[]
  interview_roadmap: InterviewRoadmapItem[]
  work_experiences: Array<Record<string, unknown>>
  project_experiences: Array<Record<string, unknown>>
  highlights: string[]
  mode: string
}

export interface SkillImportResult {
  created: string[]
  skipped: string[]
}
