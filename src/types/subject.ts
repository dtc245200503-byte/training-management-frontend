export interface SubjectCreate {
  code: string
  name: string
  description?: string
  hours?: number
  status?: string
}

export interface SubjectUpdate {
  name?: string
  description?: string
  hours?: number
  status?: string
}

export interface SubjectResponse {
  id: number
  code: string
  name: string
  description?: string | null
  hours: number
  status: string
  created_at: string
  updated_at: string
}

export interface SubjectListResponse {
  total: number
  items: SubjectResponse[]
}

export interface ListSubjectsParams {
  skip?: number
  limit?: number
  search?: string
  status?: string
}
