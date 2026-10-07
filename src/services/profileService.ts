import { refreshAccessToken } from './authService'
import type { CurrentUser } from '../types/auth'

const API_URL = `${window.location.protocol}//${window.location.hostname}:8000`

export interface UpdateProfileData {
  full_name: string
  phone: string | null
  date_of_birth: string | null
  address: string | null
}

export class ProfileSessionError extends Error {}

const fieldErrors: Record<string, string> = {
  full_name: 'Vui lòng nhập họ và tên hợp lệ, tối đa 100 ký tự.',
  phone: 'Số điện thoại Việt Nam không hợp lệ. Ví dụ: 0912345678 hoặc +84912345678.',
  date_of_birth: 'Ngày sinh không hợp lệ hoặc ở tương lai.',
  address: 'Địa chỉ không được vượt quá 255 ký tự.',
}

async function requestProfile(method: 'GET' | 'PUT' | 'DELETE', data?: UpdateProfileData | FormData, path = ''): Promise<CurrentUser> {
  let token = localStorage.getItem('access_token')
  const send = () => fetch(`${API_URL}/api/me${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(data && !(data instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(data ? { body: data instanceof FormData ? data : JSON.stringify(data) } : {}),
  })

  if (!token) {
    try {
      token = (await refreshAccessToken()).access_token
    } catch {
      throw new ProfileSessionError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }
  }

  let response = await send()
  if (response.status === 401) {
    try {
      token = (await refreshAccessToken()).access_token
    } catch {
      throw new ProfileSessionError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }
    response = await send()
  }
  if (response.status === 401 || response.status === 423) {
    throw new ProfileSessionError('Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.')
  }
  if (!response.ok) {
    if (path === '/avatar' && (response.status === 400 || response.status === 413)) {
      const result = await response.json()
      throw new Error(typeof result.detail === 'string' ? result.detail : 'Ảnh đại diện không hợp lệ.')
    }
    if (response.status === 422) {
      const result = await response.json()
      const fields = (Array.isArray(result.detail) ? result.detail : [])
        .map((item: { loc?: string[] }) => item.loc?.[1])
      const messages = [...new Set(fields.map((field: string) => fieldErrors[field]
        || 'Bạn chỉ được sửa họ tên, số điện thoại, ngày sinh và địa chỉ của chính mình.'))]
      throw new Error(messages.join(' ') || 'Thông tin hồ sơ không hợp lệ.')
    }
    throw new Error(method === 'GET'
      ? 'Không thể tải hồ sơ cá nhân. Vui lòng thử lại.'
      : 'Không thể lưu hồ sơ cá nhân. Vui lòng thử lại.')
  }
  return response.json()
}

export const getProfile = () => requestProfile('GET')
export const updateProfile = (data: UpdateProfileData) => requestProfile('PUT', data)

export const uploadAvatar = (file: File) => {
  const data = new FormData()
  data.append('file', file)
  return requestProfile('PUT', data, '/avatar')
}

export const removeAvatar = () => requestProfile('DELETE', undefined, '/avatar')
