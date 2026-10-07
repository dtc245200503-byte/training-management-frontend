import { fetchWithAuth } from './authService'
import type {
  TrainingProgramCreate,
  TrainingProgramUpdate,
  TrainingProgramResponse,
  TrainingProgramListResponse,
  ListProgramsParams,
  AttachSubjectRequest,
  AttachedSubjectResponse,
} from '../types/trainingProgram'

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

// S2-04: List Training Programs
export async function listPrograms(params?: ListProgramsParams): Promise<TrainingProgramListResponse> {
  const query = new URLSearchParams()
  if (params?.skip !== undefined) query.set('skip', params.skip.toString())
  if (params?.limit !== undefined) query.set('limit', params.limit.toString())
  if (params?.search) query.set('search', params.search.trim())
  if (params?.status) query.set('status', params.status)

  const url = `${API_URL}/api/training-programs${query.toString() ? `?${query.toString()}` : ''}`
  const response = await fetchWithAuth(url)
  return handleResponse<TrainingProgramListResponse>(response, 'Không thể tải danh sách chương trình đào tạo.')
}

// S2-04: Get Program Detail
export async function getProgramById(programId: number): Promise<TrainingProgramResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/training-programs/${programId}`)
  return handleResponse<TrainingProgramResponse>(response, 'Không thể tải thông tin chương trình đào tạo.')
}

// S2-04: Create Program
export async function createProgram(payload: TrainingProgramCreate): Promise<TrainingProgramResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/training-programs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<TrainingProgramResponse>(response, 'Không thể tạo chương trình đào tạo mới.')
}

// S2-04: Update Program
export async function updateProgram(
  programId: number,
  payload: TrainingProgramUpdate
): Promise<TrainingProgramResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/training-programs/${programId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<TrainingProgramResponse>(response, 'Không thể cập nhật chương trình đào tạo.')
}

// S2-04: Delete Program
export async function deleteProgram(programId: number): Promise<{ message?: string }> {
  const response = await fetchWithAuth(`${API_URL}/api/training-programs/${programId}`, {
    method: 'DELETE',
  })
  return handleResponse<{ message?: string }>(response, 'Không thể xóa chương trình đào tạo.')
}

// ==========================================
// S2-06: ATTACH / DETACH SUBJECTS
// ==========================================

export async function listAttachedSubjects(programId: number): Promise<AttachedSubjectResponse[]> {
  const response = await fetchWithAuth(`${API_URL}/api/training-programs/${programId}/subjects`)
  return handleResponse<AttachedSubjectResponse[]>(response, 'Không thể tải danh sách môn học trong chương trình.')
}

export async function attachSubjectToProgram(
  programId: number,
  payload: AttachSubjectRequest
): Promise<AttachedSubjectResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/training-programs/${programId}/subjects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<AttachedSubjectResponse>(response, 'Không thể gắn môn học vào chương trình đào tạo.')
}

export async function detachSubjectFromProgram(
  programId: number,
  subjectId: number
): Promise<{ message?: string }> {
  const response = await fetchWithAuth(`${API_URL}/api/training-programs/${programId}/subjects/${subjectId}`, {
    method: 'DELETE',
  })
  return handleResponse<{ message?: string }>(response, 'Không thể gỡ môn học khỏi chương trình đào tạo.')
}
