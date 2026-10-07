export interface LoginRequest {
  email: string
  password: string
}

export interface AuthUser {
  id: number
  email: string
  full_name?: string | null
  is_active: boolean
  is_locked?: boolean
  roles?: string[]
  permissions?: string[]
}

export interface LoginResponse {
  message: string
  access_token: string
  refresh_token: string
  token_type: string
  user: AuthUser
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface RefreshTokenResponse {
  message: string
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LogoutRequest {
  refresh_token: string
}

export interface LogoutResponse {
  message: string
}

// S1-03: Forgot & Reset Password
export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
}

export interface VerifyResetTokenRequest {
  token: string
}

export interface VerifyResetTokenResponse {
  valid: boolean
  message: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
  confirm_password?: string
}

export interface ResetPasswordResponse {
  message: string
}

// S1-04: Change Password
export interface ChangePasswordRequest {
  old_password: string
  new_password: string
  confirm_password?: string
}

export interface ChangePasswordResponse {
  message: string
}

// S1-05: RBAC & User Profile
export interface UserProfileResponse {
  id: number
  email: string
  full_name?: string | null
  is_active: boolean
  is_locked: boolean
  roles: string[]
  permissions: string[]
}

// S1-06: Menu by Permission
export interface MenuItem {
  key: string
  title: string
  path: string
  icon?: string | null
  children?: MenuItem[]
}

export interface MenuResponse {
  items: MenuItem[]
}
