import { createContext } from 'react'
import type { AuthUser, LoginResponse, MenuItem } from '../types/auth'

export interface AuthContextValue {
  user: AuthUser | null
  roles: string[]
  permissions: string[]
  menuItems: MenuItem[]
  loading: boolean
  isLoggingOut: boolean
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  loginSuccess: (authData: LoginResponse) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateUser: (updatedFields: Partial<AuthUser>) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
