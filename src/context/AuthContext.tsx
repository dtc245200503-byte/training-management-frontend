import {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { AuthUser, LoginResponse, MenuItem } from '../types/auth'
import {
  getStoredUser,
  updateStoredUser,
  getAccessToken,
  getRefreshToken,
  setSession,
  clearSession,
  logout as apiLogout,
  onAuthFailure,
  getCurrentUserProfile,
  getMenu,
} from '../services/authService'
import { AuthContext } from './authContextInstance'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = getStoredUser()
    const access = getAccessToken()
    const refresh = getRefreshToken()
    if (stored && access && refresh) {
      return stored
    }
    clearSession()
    return null
  })

  const [roles, setRoles] = useState<string[]>(() => user?.roles || [])
  const [permissions, setPermissions] = useState<string[]>(() => user?.permissions || [])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState<boolean>(() => Boolean(getAccessToken()))
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)

  const loadUserDataAndMenu = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setLoading(false)
      return
    }

    try {
      // S1-05 & S2-02 & S2-03: Lấy profile và danh sách roles/permissions mới nhất
      const profile = await getCurrentUserProfile()
      setUser((prev) => ({
        ...(prev || { id: profile.id, email: profile.email, is_active: profile.is_active }),
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        avatar_url: profile.avatar_url,
        is_active: profile.is_active,
        is_locked: profile.is_locked,
        roles: profile.roles,
        permissions: profile.permissions,
      }))
      setRoles(profile.roles || [])
      setPermissions(profile.permissions || [])

      // S1-06: Lấy menu tương ứng theo quyền hạn từ backend
      try {
        const menuData = await getMenu()
        setMenuItems(menuData.items || [])
      } catch (menuErr) {
        console.warn('Failed to load menu by permission:', menuErr)
      }
    } catch (err) {
      console.warn('Failed to fetch user profile:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // S1-02: Lắng nghe phiên làm việc hết hạn
  useEffect(() => {
    const unsubscribe = onAuthFailure(() => {
      setUser(null)
      setRoles([])
      setPermissions([])
      setMenuItems([])
    })
    return unsubscribe
  }, [])

  // Khi khởi động ứng dụng: nếu có token, đồng bộ profile và menu bất đồng bộ qua Promise
  useEffect(() => {
    let cancelled = false
    if (getAccessToken()) {
      getCurrentUserProfile()
        .then((profile) => {
          if (cancelled) return
          setUser((prev) => ({
            ...(prev || { id: profile.id, email: profile.email, is_active: profile.is_active }),
            full_name: profile.full_name,
            is_active: profile.is_active,
            is_locked: profile.is_locked,
            roles: profile.roles,
            permissions: profile.permissions,
          }))
          setRoles(profile.roles || [])
          setPermissions(profile.permissions || [])
          return getMenu()
        })
        .then((menuData) => {
          if (cancelled || !menuData) return
          setMenuItems(menuData.items || [])
        })
        .catch((err) => {
          console.warn('Initial auth sync error:', err)
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false)
          }
        })
    }

    return () => {
      cancelled = true
    }
  }, [])

  const loginSuccess = async (authData: LoginResponse) => {
    setSession({
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
      user: authData.user,
    })
    setUser(authData.user)
    setRoles(authData.user.roles || [])
    setPermissions(authData.user.permissions || [])

    // Tải thông tin RBAC và Menu đầy đủ từ backend
    await loadUserDataAndMenu()
  }

  const logout = async () => {
    setIsLoggingOut(true)
    try {
      await apiLogout()
    } finally {
      setUser(null)
      setRoles([])
      setPermissions([])
      setMenuItems([])
      setIsLoggingOut(false)
    }
  }

  const hasRole = (role: string): boolean => {
    if (roles.includes('ADMIN')) return true
    return roles.includes(role)
  }

  const hasPermission = (permission: string): boolean => {
    if (roles.includes('ADMIN')) return true
    return permissions.includes(permission)
  }

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    if (roles.includes('ADMIN')) return true
    return requiredPermissions.some((p) => permissions.includes(p))
  }

  const updateUser = (updatedFields: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null
      const nextUser = { ...prev, ...updatedFields }
      updateStoredUser(nextUser)
      return nextUser
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        permissions,
        menuItems,
        loading,
        isLoggingOut,
        hasRole,
        hasPermission,
        hasAnyPermission,
        loginSuccess,
        logout,
        refreshProfile: loadUserDataAndMenu,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
