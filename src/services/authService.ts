import type { LoginRequest, LoginResponse } from '../types/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

interface ErrorDetailItem {
  loc?: (string | number)[]
  msg?: string
  type?: string
}

interface BackendResponse {
  detail?: string | ErrorDetailItem[]
  message?: string
  access_token?: string
  refresh_token?: string
  token_type?: string
  user?: LoginResponse['user']
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  let response: Response

  try {
    response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: payload.email.trim(),
        password: payload.password,
      }),
    })
  } catch (error: unknown) {
    console.error('Fetch error:', error)
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại.', { cause: error })
  }

  let data: BackendResponse
  try {
    data = (await response.json()) as BackendResponse
  } catch (parseError: unknown) {
    throw new Error('Đã xảy ra lỗi không xác định từ máy chủ.', { cause: parseError })
  }

  if (!response.ok) {
    if (response.status === 401) {
      const msg = typeof data.detail === 'string' ? data.detail : 'Email hoặc mật khẩu không chính xác.'
      throw new Error(msg)
    }

    if (response.status === 422) {
      if (Array.isArray(data.detail) && data.detail.length > 0) {
        const firstErr = data.detail[0]
        const fieldName = firstErr.loc ? firstErr.loc[firstErr.loc.length - 1] : ''
        if (fieldName === 'email') {
          throw new Error('Email không đúng định dạng.')
        }
        if (fieldName === 'password') {
          throw new Error('Mật khẩu không được để trống.')
        }
        throw new Error(firstErr.msg || 'Dữ liệu không hợp lệ.')
      }
      throw new Error('Dữ liệu biểu mẫu không hợp lệ.')
    }

    const detailMsg = typeof data.detail === 'string' ? data.detail : 'Đăng nhập thất bại. Vui lòng thử lại.'
    throw new Error(detailMsg)
  }

  return data as LoginResponse
}
