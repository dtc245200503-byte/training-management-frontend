import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  LogoutResponse,
} from '../types/auth'

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

// ==========================================
// SESSION PERSISTENCE & STORAGE HELPERS
// ==========================================

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem('access_token')
  } catch {
    return null
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem('refresh_token')
  } catch {
    return null
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    clearSession()
    return null
  }
}

export function setSession(data: {
  access_token: string
  refresh_token: string
  user?: AuthUser
}): void {
  try {
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user))
    }
  } catch (err) {
    console.error('Failed to save session to localStorage:', err)
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  } catch (err) {
    console.error('Failed to clear session from localStorage:', err)
  }
}

// ==========================================
// AUTH EVENTS / LISTENERS (SESSION EXPIRED/LOGOUT)
// ==========================================

type AuthFailureListener = () => void
const authFailureListeners = new Set<AuthFailureListener>()

export function onAuthFailure(listener: AuthFailureListener): () => void {
  authFailureListeners.add(listener)
  return () => {
    authFailureListeners.delete(listener)
  }
}

export function notifyAuthFailure(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
  }
  for (const listener of authFailureListeners) {
    try {
      listener()
    } catch (err) {
      console.error('Error in auth failure listener:', err)
    }
  }
}

// ==========================================
// S1-01: LOGIN
// ==========================================

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

// ==========================================
// S1-02: REFRESH TOKEN (CONCURRENCY SAFE MUTEX/PROMISE)
// ==========================================

let refreshPromise: Promise<string | null> | null = null

export async function refreshToken(): Promise<string | null> {
  const currentRefreshToken = getRefreshToken()
  if (!currentRefreshToken) {
    clearSession()
    notifyAuthFailure()
    return null
  }

  // Nếu đang có 1 request refresh đang chạy, chia sẻ chung Promise đó để tránh gọi nhiều lần đồng thời
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: currentRefreshToken,
        }),
      })

      if (!response.ok) {
        // Refresh token không hợp lệ, đã hết hạn hoặc bị revoke
        clearSession()
        notifyAuthFailure()
        return null
      }

      const data = (await response.json()) as RefreshTokenResponse
      localStorage.setItem('access_token', data.access_token)
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token)
      }
      return data.access_token
    } catch (error: unknown) {
      console.error('Refresh token request failed:', error)
      clearSession()
      notifyAuthFailure()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ==========================================
// S1-02: SECURE LOGOUT
// ==========================================

export async function logout(): Promise<LogoutResponse | null> {
  const currentRefreshToken = getRefreshToken()
  let result: LogoutResponse | null = null

  try {
    if (currentRefreshToken) {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: currentRefreshToken,
        }),
      })

      if (response.ok) {
        result = (await response.json()) as LogoutResponse
      }
    }
  } catch (error: unknown) {
    console.error('Logout error:', error)
  } finally {
    // Luôn luôn xóa access_token, refresh_token và user ở client và đưa về Login
    clearSession()
    notifyAuthFailure()
  }

  return result
}

// ==========================================
// S1-02: FETCH WRAPPER WITH AUTO REFRESH
// ==========================================

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = getAccessToken()
  const headers = new Headers(init?.headers)

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response = await fetch(input, {
    ...init,
    headers,
  })

  const urlString =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.href
      : input.url
  const isAuthEndpoint =
    urlString.includes('/api/auth/login') ||
    urlString.includes('/api/auth/refresh') ||
    urlString.includes('/api/auth/logout')

  if (response.status === 401 && !isAuthEndpoint) {
    const newAccessToken = await refreshToken()
    if (newAccessToken) {
      const retryHeaders = new Headers(init?.headers)
      retryHeaders.set('Authorization', `Bearer ${newAccessToken}`)
      response = await fetch(input, {
        ...init,
        headers: retryHeaders,
      })
    }
  }

  return response
}
