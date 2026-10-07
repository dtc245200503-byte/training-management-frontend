export interface UserProfileUpdate {
  full_name?: string
  phone_number?: string
  bio?: string
  address?: string
  date_of_birth?: string
  gender?: string
}

export interface UserProfileDetail {
  id: number
  email: string
  full_name?: string | null
  phone_number?: string | null
  avatar_url?: string | null
  bio?: string | null
  address?: string | null
  date_of_birth?: string | null
  gender?: string | null
  is_active: boolean
  is_locked: boolean
  roles: string[]
  permissions: string[]
  created_at: string
  updated_at: string
}

export interface AvatarUploadResponse {
  message: string
  avatar_url: string
}
