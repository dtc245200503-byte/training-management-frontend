import { fetchWithAuth } from './authService'
import type { RoleListResponse, PermissionItem } from '../types/role'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function getRoles(): Promise<RoleListResponse> {
  const response = await fetchWithAuth(`${API_URL}/api/roles`)
  if (!response.ok) {
    throw new Error('Không thể tải danh sách vai trò.')
  }
  return (await response.json()) as RoleListResponse
}

export async function getPermissions(): Promise<PermissionItem[]> {
  const response = await fetchWithAuth(`${API_URL}/api/permissions`)
  if (!response.ok) {
    throw new Error('Không thể tải danh sách quyền hạn.')
  }
  return (await response.json()) as PermissionItem[]
}
