export interface PermissionItem {
  id: number
  name: string
  code: string
  description?: string | null
  module?: string | null
  created_at?: string | null
}

export interface RoleItem {
  id: number
  name: string
  description?: string | null
  created_at?: string | null
  permissions: PermissionItem[]
}

export interface RoleListResponse {
  items: RoleItem[]
}
