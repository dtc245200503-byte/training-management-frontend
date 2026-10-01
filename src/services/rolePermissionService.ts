const API_URL = 'http://127.0.0.1:8000'


export interface PermissionItem {
  permission_id: number
  permission_name: string
  description: string | null
}


export interface RolePermissionItem {
  role_id: number
  role_name: string
  permission_ids: number[]
}


export interface RolePermissionsResponse {
  permissions: PermissionItem[]
  roles: RolePermissionItem[]
}


function getAccessToken(): string {
  const token = localStorage.getItem('access_token')

  if (!token) {
    throw new Error('Bạn chưa đăng nhập.')
  }

  return token
}


export async function getRolePermissions():
Promise<RolePermissionsResponse> {
  const response = await fetch(
    `${API_URL}/api/roles/permissions`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    },
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail
        || 'Không thể tải danh sách phân quyền.',
    )
  }

  return data
}


export async function updateRolePermissions(
  roleId: number,
  permissionIds: number[],
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/roles/${roleId}/permissions`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({
        permission_ids: permissionIds,
      }),
    },
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail
        || 'Không thể cập nhật phân quyền.',
    )
  }
}