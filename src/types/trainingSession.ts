export interface TrainingSessionCreate {
  code: string
  name: string
  program_id?: number | null
  subject_id?: number | null
  trainer_id?: number | null
  start_date: string
  end_date: string
  location?: string | null
  max_trainees?: number
  status?: string
}

export interface TrainingSessionUpdate {
  name?: string
  program_id?: number | null
  subject_id?: number | null
  trainer_id?: number | null
  start_date?: string
  end_date?: string
  location?: string | null
  max_trainees?: number
  status?: string
}

export interface TrainingSessionResponse {
  id: number
  code: string
  name: string
  program_id?: number | null
  program_name?: string | null
  subject_id?: number | null
  subject_name?: string | null
  trainer_id?: number | null
  trainer_name?: string | null
  start_date: string
  end_date: string
  location?: string | null
  max_trainees: number
  status: string
  created_at: string
  updated_at: string
}

export interface TrainingSessionListResponse {
  total: number
  items: TrainingSessionResponse[]
}

export interface ListSessionsParams {
  skip?: number
  limit?: number
  search?: string
  status?: string
  program_id?: number
  subject_id?: number
  trainer_id?: number
}
