export interface PublicConsultationCreate {
  full_name: string
  email: string
  phone: string
  program_id?: number | null
  notes?: string | null
  honeypot?: string | null
}

export interface PublicConsultationResponse {
  message: string
  id: number
}

export interface LeadUpdate {
  status?: string
  admin_notes?: string | null
  notes?: string | null
}

export interface LeadAssignRequest {
  user_id: number
}

export interface LeadResponse {
  id: number
  full_name: string
  email: string
  phone: string
  program_id?: number | null
  program_name?: string | null
  notes?: string | null
  status: string
  assigned_to_id?: number | null
  assigned_to_name?: string | null
  assigned_at?: string | null
  admin_notes?: string | null
  created_at: string
  updated_at: string
}

export interface LeadListResponse {
  total: number
  skip: number
  limit: number
  items: LeadResponse[]
}

export interface ListLeadsParams {
  skip?: number
  limit?: number
  search?: string
  status?: string
  program_id?: number
  assigned_to_id?: number
}
