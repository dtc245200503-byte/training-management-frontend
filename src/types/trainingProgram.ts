import type { SubjectResponse } from './subject'

export interface AttachSubjectRequest {
  subject_id: number
  order_index?: number
  is_mandatory?: boolean
}

export interface AttachedSubjectResponse {
  id: number
  subject_id: number
  order_index: number
  is_mandatory: boolean
  subject: SubjectResponse
}

export interface TrainingProgramCreate {
  code: string
  name: string
  description?: string
  duration_hours?: number
  status?: string
}

export interface TrainingProgramUpdate {
  name?: string
  description?: string
  duration_hours?: number
  status?: string
}

export interface TrainingProgramResponse {
  id: number
  code: string
  name: string
  description?: string | null
  duration_hours: number
  status: string
  created_at: string
  updated_at: string
  program_subjects: AttachedSubjectResponse[]
}

export interface TrainingProgramListResponse {
  total: number
  items: TrainingProgramResponse[]
}

export interface ListProgramsParams {
  skip?: number
  limit?: number
  search?: string
  status?: string
}
