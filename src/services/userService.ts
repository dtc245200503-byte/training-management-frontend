import { fetchWithAuth } from './authService'
import type {
  UserDetail,
  UserListResponse,
  UserCreateRequest,
  UserUpdateRequest,
  LockUserRequest,
  LockUserResponse,
  AssignRolesRequest,
  RoleActionResponse,
} from '../types/user'

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

export interface ListUsersParams {
  skip?: number
  limit?: number
  search?: string
  is_active?: boolean
  is_locked?: boolean
  role?: string
}

// ==========================================
// S1-08: USER ACCOUNT MANAGEMENT
// ==========================================

export async function listUsers(params?: ListUsersParams): Promise<UserListResponse> {
  const query = new URLSearchParams()
  if (params?.skip !== undefined) query.set('skip', params.skip.toString())
  if (params?.limit !== undefined) query.set('limit', params.limit.toString())
  if (params?.search) query.set('search', params.search.trim())
  if (params?.is_active !== undefined) query.set('is_active', String(params.is_active))
  if (params?.is_locked !== undefined) query.set('is_locked', String(params.is_locked))
  if (params?.role) query.set('role', params.role)

  const url = `${API_URL}/api/users${query.toString() ? `?${query.toString()}` : ''}`
  const response = await fetchWithAuth(url)
  return handleResponse<UserListResponse>(response, 'Không thể tải danh sách người dùng.')
}

export async function getUserById(userId: number): Promise<UserDetail> {
  const response = await fetchWithAuth(`${API_URL}/api/users/${userId}`)
  return handleResponse<UserDetail>(response, 'Không thể tải thông tin người dùng.')
}

export async function createUser(payload: UserCreateRequest): Promise<UserDetail> {
  const response = await fetchWithAuth(`${API_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<UserDetail>(response, 'Không thể tạo người dùng mới.')
}

export async function updateUser(userId: number, payload: UserUpdateRequest): Promise<UserDetail> {
  const response = await fetchWithAuth(`${API_URL}/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<UserDetail>(response, 'Không thể cập nhật thông tin người dùng.')
}

export async function deleteUser(userId: number): Promise<{ message?: string }> {
  const response = await fetchWithAuth(`${API_URL}/api/users/${userId}`, {
    method: 'DELETE',
  })
  return handleResponse<{ message?: string }>(response, 'Không thể xóa người dùng.')
}

// ==========================================
// S1-09: ASSIGN / REVOKE ROLE
// ==========================================

export async function assignRoles(userId: number, roles: string[]): Promise<RoleActionResponse> {
  const payload: AssignRolesRequest = { roles }
  const response = await fetchWithAuth(`${API_URL}/api/users/${userId}/roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<RoleActionResponse>(response, 'Không thể phân vai trò cho người dùng.')
}

export async function revokeRole(userId: number, roleName: string): Promise<RoleActionResponse> {
  const response = await fetchWithAuth(
    `${API_URL}/api/users/${userId}/roles/${encodeURIComponent(roleName)}`,
    {
      method: 'DELETE',
    }
  )
  return handleResponse<RoleActionResponse>(response, `Không thể thu hồi vai trò ${roleName}.`)
}

// ==========================================
// S1-10: LOCK / UNLOCK ACCOUNT
// ==========================================

export async function lockUser(userId: number, reason?: string): Promise<LockUserResponse> {
  const payload: LockUserRequest = { reason }
  const response = await fetchWithAuth(`${API_URL}/api/users/${userId}/lock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleResponse<LockUserResponse>(response, 'Không thể khóa tài khoản người dùng.')
}

export async function unlockUser(userId: number): Promise<LockUserResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/users/${userId}/unlock`, {
    method: 'POST',
  })
  return handleResponse<LockUserResponse>(response, 'Không thể mở khóa tài khoản người dùng.')
}
