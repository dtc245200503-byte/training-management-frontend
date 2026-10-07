export interface UserDetail {
  id: number
  email: string
  full_name?: string | null
  is_active: boolean
  is_locked: boolean
  locked_at?: string | null
  lock_reason?: string | null
  roles: string[]
  permissions: string[]
  created_at: string
  updated_at: string
}

export interface UserListResponse {
  total: number
  skip: number
  limit: number
  items: UserDetail[]
}

export interface UserCreateRequest {
  email: string
  password: string
  full_name?: string
  roles?: string[]
  is_active?: boolean
}

export interface UserUpdateRequest {
  full_name?: string
  email?: string
  is_active?: boolean
}

export interface LockUserRequest {
  reason?: string
}

export interface LockUserResponse {
  message: string
  user_id: number
  is_locked: boolean
  locked_at?: string | null
  lock_reason?: string | null
}

export interface AssignRolesRequest {
  roles: string[]
}

export interface RoleActionResponse {
  message: string
  user_id: number
  roles: string[]
}

// S2-01: Import Users from Excel
export interface UserImportErrorDetail {
  row: number
  email?: string | null
  reason: string
}

export interface UserImportResult {
  total_rows: number
  imported_count: number
  skipped_count: number
  success_count?: number | null
  failed_count?: number | null
  errors: UserImportErrorDetail[]
  imported_users?: string[]
  imported_emails?: string[]
}
