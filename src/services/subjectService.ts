import { fetchWithAuth } from './authService'
import type {
  SubjectCreate,
  SubjectUpdate,
  SubjectResponse,
  SubjectListResponse,
  ListSubjectsParams,
} from '../types/subject'

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

// S2-05: List Subjects
export async function listSubjects(params?: ListSubjectsParams): Promise<SubjectListResponse> {
  const query = new URLSearchParams()
  if (params?.skip !== undefined) query.set('skip', params.skip.toString())
  if (params?.limit !== undefined) query.set('limit', params.limit.toString())
  if (params?.search) query.set('search', params.search.trim())
  if (params?.status) query.set('status', params.status)

  const url = `${API_URL}/api/subjects${query.toString() ? `?${query.toString()}` : ''}`
  const response = await fetchWithAuth(url)
  return handleResponse<SubjectListResponse>(response, 'Không thể tải danh sách môn học.')
}

// S2-05: Get Subject Detail
export async function getSubjectById(subjectId: number): Promise<SubjectResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/subjects/${subjectId}`)
  return handleResponse<SubjectResponse>(response, 'Không thể tải thông tin môn học.')
}

// S2-05: Create Subject
export async function createSubject(payload: SubjectCreate): Promise<SubjectResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/subjects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<SubjectResponse>(response, 'Không thể tạo môn học mới.')
}

// S2-05: Update Subject
export async function updateSubject(
  subjectId: number,
  payload: SubjectUpdate
): Promise<SubjectResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/subjects/${subjectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<SubjectResponse>(response, 'Không thể cập nhật môn học.')
}

// S2-05: Delete Subject
export async function deleteSubject(subjectId: number): Promise<{ message?: string }> {
  const response = await fetchWithAuth(`${API_URL}/api/subjects/${subjectId}`, {
    method: 'DELETE',
  })
  return handleResponse<{ message?: string }>(response, 'Không thể xóa môn học.')
}
