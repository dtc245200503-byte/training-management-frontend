import { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import type { AuthUser, LoginResponse } from './types/auth'
import {
  getStoredUser,
  getAccessToken,
  getRefreshToken,
  setSession,
  clearSession,
  logout,
  onAuthFailure,
} from './services/authService'

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = getStoredUser()
    const accessToken = getAccessToken()
    const refreshToken = getRefreshToken()

    if (storedUser && accessToken && refreshToken) {
      return storedUser
    }

    clearSession()
    return null
  })

  const [loggingOut, setLoggingOut] = useState(false)

  // Tự động chuyển về trang Login khi refresh token thất bại hoặc bị thu hồi
  useEffect(() => {
    const unsubscribe = onAuthFailure(() => {
      setUser(null)
    })
    return unsubscribe
  }, [])

  const handleLoginSuccess = (authData: LoginResponse) => {
    setSession({
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
      user: authData.user,
    })
    setUser(authData.user)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setUser(null)
      setLoggingOut(false)
    }
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="home-dashboard">
      <header className="home-header">
        <div className="home-badge">ICTU × CodeGym Việt Nam</div>
        <h1>HỆ THỐNG QUẢN LÝ ĐÀO TẠO</h1>
      </header>
      <main className="home-card">
        <h2>Xin chào, {user.full_name || user.email}!</h2>
        <p>Bạn đã đăng nhập thành công vào hệ thống.</p>
        <div className="user-info-box">
          <p><strong>Mã định danh (ID):</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Trạng thái:</strong> {user.is_active ? 'Đang hoạt động' : 'Tạm khóa'}</p>
        </div>
        <div className="dashboard-actions">
          <button
            type="button"
            id="btn-logout"
            className="logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
          </button>
        </div>
      </main>
    </div>
  )
}
