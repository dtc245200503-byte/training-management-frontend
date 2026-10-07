import { fetchWithAuth } from './authService'
import type {
  UserProfileDetail,
  UserProfileUpdate,
  AvatarUploadResponse,
} from '../types/profile'

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

// S2-02: Get Current User Profile
export async function getProfile(): Promise<UserProfileDetail> {
  const response = await fetchWithAuth(`${API_URL}/api/profile`)
  return handleResponse<UserProfileDetail>(response, 'Không thể tải thông tin hồ sơ cá nhân.')
}

// S2-02: Update Current User Profile
export async function updateProfile(payload: UserProfileUpdate): Promise<UserProfileDetail> {
  const response = await fetchWithAuth(`${API_URL}/api/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<UserProfileDetail>(response, 'Không thể cập nhật hồ sơ cá nhân.')
}

// S2-03: Upload Avatar
export async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetchWithAuth(`${API_URL}/api/profile/avatar`, {
    method: 'POST',
    body: formData,
  })
  return handleResponse<AvatarUploadResponse>(response, 'Tải lên ảnh đại diện thất bại.')
}
