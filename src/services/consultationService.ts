import { fetchWithAuth } from './authService'
import type {
  PublicConsultationCreate,
  PublicConsultationResponse,
  LeadUpdate,
  LeadAssignRequest,
  LeadResponse,
  LeadListResponse,
  ListLeadsParams,
} from '../types/consultation'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

interface BackendErrorResponse {
  detail?: string | { msg?: string }[]
  message?: string
}

async function handleResponse<T>(response: Response, defaultErrorMsg: string): Promise<T> {
  let data: unknown
  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new Error(defaultErrorMsg)
    }
    return {} as T
  }

  if (!response.ok) {
    const err = data as BackendErrorResponse
    if (typeof err.detail === 'string') {
      throw new Error(err.detail)
    }
    if (Array.isArray(err.detail) && err.detail.length > 0) {
      throw new Error(err.detail[0].msg || defaultErrorMsg)
    }
    throw new Error(err.message || defaultErrorMsg)
  }

  return data as T
}

// ==========================================
// S2-08: PUBLIC CONSULTATION FORM
// ==========================================

export async function submitPublicConsultation(
  payload: PublicConsultationCreate
): Promise<PublicConsultationResponse> {
  const response = await fetch(`${API_URL}/api/public/consultations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return handleResponse<PublicConsultationResponse>(
    response,
    'Gửi yêu cầu tư vấn thất bại. Vui lòng kiểm tra lại thông tin.'
  )
}

// ==========================================
// S2-09 & S2-11: LEADS MANAGEMENT & SEARCH/FILTER
// ==========================================

export async function listLeads(params?: ListLeadsParams): Promise<LeadListResponse> {
  const query = new URLSearchParams()
  if (params?.skip !== undefined) query.set('skip', params.skip.toString())
  if (params?.limit !== undefined) query.set('limit', params.limit.toString())
  if (params?.search) query.set('search', params.search.trim())
  if (params?.status) query.set('status', params.status)
  if (params?.program_id !== undefined) query.set('program_id', params.program_id.toString())
  if (params?.assigned_to_id !== undefined) query.set('assigned_to_id', params.assigned_to_id.toString())

  const url = `${API_URL}/api/leads${query.toString() ? `?${query.toString()}` : ''}`
  const response = await fetchWithAuth(url)
  return handleResponse<LeadListResponse>(response, 'Không thể tải danh sách yêu cầu tư vấn.')
}

export async function getLeadById(leadId: number): Promise<LeadResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/leads/${leadId}`)
  return handleResponse<LeadResponse>(response, 'Không thể tải chi tiết yêu cầu tư vấn.')
}

export async function updateLead(leadId: number, payload: LeadUpdate): Promise<LeadResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/leads/${leadId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<LeadResponse>(response, 'Không thể cập nhật yêu cầu tư vấn.')
}

export async function deleteLead(leadId: number): Promise<{ message?: string }> {
  const response = await fetchWithAuth(`${API_URL}/api/leads/${leadId}`, {
    method: 'DELETE',
  })
  return handleResponse<{ message?: string }>(response, 'Không thể xóa yêu cầu tư vấn.')
}

// ==========================================
// S2-10: ASSIGN LEAD
// ==========================================

export async function assignLead(
  leadId: number,
  payload: LeadAssignRequest
): Promise<LeadResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/leads/${leadId}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<LeadResponse>(response, 'Không thể phân công yêu cầu tư vấn.')
}
