import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  LogoutResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyResetTokenRequest,
  VerifyResetTokenResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UserProfileResponse,
  MenuResponse,
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

function parseErrorMessage(data: BackendResponse, fallback: string): string {
  if (typeof data.detail === 'string') {
    return data.detail
  }
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    const firstErr = data.detail[0]
    return firstErr.msg || fallback
  }
  return data.message || fallback
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

export function updateStoredUser(user: AuthUser): void {
  try {
    localStorage.setItem('user', JSON.stringify(user))
  } catch (err) {
    console.error('Failed to update stored user:', err)
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
// AUTH EVENTS / LISTENERS (SESSION EXPIRED/LOGOUT & FORBIDDEN)
// ==========================================

type AuthFailureListener = () => void
type ForbiddenListener = (detail: string) => void

const authFailureListeners = new Set<AuthFailureListener>()
const forbiddenListeners = new Set<ForbiddenListener>()

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

export function onForbidden(listener: ForbiddenListener): () => void {
  forbiddenListeners.add(listener)
  return () => {
    forbiddenListeners.delete(listener)
  }
}

export function notifyForbidden(detail?: string): void {
  const msg = detail || 'Bạn không có quyền thực hiện thao tác này (403 Forbidden).'
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:forbidden', { detail: msg }))
  }
  for (const listener of forbiddenListeners) {
    try {
      listener(msg)
    } catch (err) {
      console.error('Error in forbidden listener:', err)
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

    const detailMsg = parseErrorMessage(data, 'Đăng nhập thất bại. Vui lòng thử lại.')
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
    clearSession()
    notifyAuthFailure()
  }

  return result
}

// ==========================================
// S1-02 & S1-07: FETCH WRAPPER WITH AUTO REFRESH & ERROR HANDLING
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

  let response: Response
  try {
    response = await fetch(input, {
      ...init,
      headers,
    })
  } catch (networkError: unknown) {
    console.error('Network request failed:', networkError)
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.', { cause: networkError })
  }

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

  // S1-07: 403 Forbidden - KHÔNG ĐƯỢC refresh token vô ích
  if (response.status === 403) {
    let detailMsg = 'Bạn không có quyền thực hiện thao tác này.'
    try {
      const clone = response.clone()
      const data = (await clone.json()) as BackendResponse
      if (typeof data.detail === 'string') {
        detailMsg = data.detail
      }
    } catch {
      /* ignore non-json error responses */
    }
    notifyForbidden(detailMsg)
    return response
  }

  // S1-02: 401 Unauthorized - Thử refresh token
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

// ==========================================
// S1-03: FORGOT & RESET PASSWORD
// ==========================================

export async function forgotPassword(
  payload: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
  const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: payload.email.trim(),
    }),
  })

  const data = (await response.json()) as BackendResponse
  if (!response.ok) {
    throw new Error(parseErrorMessage(data, 'Không thể gửi yêu cầu đặt lại mật khẩu.'))
  }

  return data as ForgotPasswordResponse
}

export async function verifyResetToken(
  payload: VerifyResetTokenRequest
): Promise<VerifyResetTokenResponse> {
  const response = await fetch(`${API_URL}/api/auth/verify-reset-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: payload.token.trim(),
    }),
  })

  const data = (await response.json()) as VerifyResetTokenResponse & BackendResponse
  if (!response.ok) {
    throw new Error(parseErrorMessage(data, 'Mã xác nhận không hợp lệ hoặc đã hết hạn.'))
  }

  return data
}

export async function resetPassword(
  payload: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  const response = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: payload.token.trim(),
      new_password: payload.new_password,
      confirm_password: payload.confirm_password,
    }),
  })

  const data = (await response.json()) as BackendResponse
  if (!response.ok) {
    throw new Error(parseErrorMessage(data, 'Đặt lại mật khẩu thất bại.'))
  }

  return data as ResetPasswordResponse
}

// ==========================================
// S1-04: CHANGE PASSWORD
// ==========================================

export async function changePassword(
  payload: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      old_password: payload.old_password,
      new_password: payload.new_password,
      confirm_password: payload.confirm_password,
    }),
  })

  const data = (await response.json()) as BackendResponse
  if (!response.ok) {
    throw new Error(parseErrorMessage(data, 'Đổi mật khẩu thất bại.'))
  }

  // Backend revokes all sessions on password change
  clearSession()

  return data as ChangePasswordResponse
}

// ==========================================
// S1-05: CURRENT USER PROFILE (RBAC)
// ==========================================

export async function getCurrentUserProfile(): Promise<UserProfileResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/auth/me`)

  if (!response.ok) {
    const data = (await response.json()) as BackendResponse
    throw new Error(parseErrorMessage(data, 'Không thể lấy thông tin người dùng.'))
  }

  const userProfile = (await response.json()) as UserProfileResponse

  // Đồng bộ hóa thông tin user vào localStorage
  const currentUser = getStoredUser()
  if (currentUser) {
    updateStoredUser({
      ...currentUser,
      full_name: userProfile.full_name,
      is_active: userProfile.is_active,
      is_locked: userProfile.is_locked,
      roles: userProfile.roles,
      permissions: userProfile.permissions,
    })
  }

  return userProfile
}

// ==========================================
// S1-06: MENU BY PERMISSION
// ==========================================

export async function getMenu(): Promise<MenuResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/auth/menu`)

  if (!response.ok) {
    const data = (await response.json()) as BackendResponse
    throw new Error(parseErrorMessage(data, 'Không thể tải cấu trúc menu.'))
  }

  return (await response.json()) as MenuResponse
}
