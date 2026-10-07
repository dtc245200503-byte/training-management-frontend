import { fetchWithAuth } from './authService'
import type {
  TrainingSessionCreate,
  TrainingSessionUpdate,
  TrainingSessionResponse,
  TrainingSessionListResponse,
  ListSessionsParams,
} from '../types/trainingSession'

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

// S2-07: List Training Sessions
export async function listSessions(params?: ListSessionsParams): Promise<TrainingSessionListResponse> {
  const query = new URLSearchParams()
  if (params?.skip !== undefined) query.set('skip', params.skip.toString())
  if (params?.limit !== undefined) query.set('limit', params.limit.toString())
  if (params?.search) query.set('search', params.search.trim())
  if (params?.status) query.set('status', params.status)
  if (params?.program_id !== undefined) query.set('program_id', params.program_id.toString())
  if (params?.subject_id !== undefined) query.set('subject_id', params.subject_id.toString())
  if (params?.trainer_id !== undefined) query.set('trainer_id', params.trainer_id.toString())

  const url = `${API_URL}/api/training-sessions${query.toString() ? `?${query.toString()}` : ''}`
  const response = await fetchWithAuth(url)
  return handleResponse<TrainingSessionListResponse>(response, 'Không thể tải danh sách lớp đào tạo.')
}

// S2-07: Get Session Detail
export async function getSessionById(sessionId: number): Promise<TrainingSessionResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/training-sessions/${sessionId}`)
  return handleResponse<TrainingSessionResponse>(response, 'Không thể tải thông tin lớp đào tạo.')
}

// S2-07: Create Session
export async function createSession(payload: TrainingSessionCreate): Promise<TrainingSessionResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/training-sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<TrainingSessionResponse>(response, 'Không thể tạo lớp đào tạo mới.')
}

// S2-07: Update Session
export async function updateSession(
  sessionId: number,
  payload: TrainingSessionUpdate
): Promise<TrainingSessionResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/training-sessions/${sessionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<TrainingSessionResponse>(response, 'Không thể cập nhật lớp đào tạo.')
}

// S2-07: Delete Session
export async function deleteSession(sessionId: number): Promise<{ message?: string }> {
  const response = await fetchWithAuth(`${API_URL}/api/training-sessions/${sessionId}`, {
    method: 'DELETE',
  })
  return handleResponse<{ message?: string }>(response, 'Không thể xóa lớp đào tạo.')
}
