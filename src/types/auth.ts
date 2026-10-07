export interface CurrentUser {
  user_id: number
  full_name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  address: string | null
  avatar_url: string | null
  avatar_thumbnail_url: string | null
  roles: string[]
  permissions: string[]
}

export interface MenuItem {
  name: string
  path: string
  permission?: string
}
