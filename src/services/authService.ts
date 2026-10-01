import type { CurrentUser } from '../types/auth'


const API_URL = 'http://127.0.0.1:8000'


interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}


export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_URL}/api/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    },
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Đăng nhập thất bại.',
    )
  }

  return data
}


export async function forgotPassword(
  email: string,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/auth/forgot-password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
      }),
    },
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail ||
        'Không thể gửi yêu cầu đặt lại mật khẩu.',
    )
  }
}


export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/auth/reset-password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        new_password: newPassword,
      }),
    },
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail ||
        'Không thể đặt lại mật khẩu.',
    )
  }
}


export async function getCurrentUser(
  accessToken: string,
): Promise<CurrentUser> {
  const response = await fetch(
    `${API_URL}/api/me`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(
      'Không thể lấy thông tin người dùng',
    )
  }

  return response.json()
}