export interface CurrentUser {
  user_id: number
  full_name: string
  email: string
  roles: string[]
  permissions: string[]
}

export interface MenuItem {
  name: string
  path: string
  permission?: string
}