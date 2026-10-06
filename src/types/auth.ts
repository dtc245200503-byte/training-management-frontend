export interface LoginRequest {
  email: string
  password: string
}

export interface AuthUser {
  id: number
  email: string
  full_name?: string | null
  is_active: boolean
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
