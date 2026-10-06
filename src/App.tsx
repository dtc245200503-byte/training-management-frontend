import { useState } from 'react'
import LoginPage from './components/LoginPage'
import type { AuthUser, LoginResponse } from './types/auth'

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const storedUser = localStorage.getItem('user')
      const accessToken = localStorage.getItem('access_token')

      if (storedUser && accessToken) {
        return JSON.parse(storedUser) as AuthUser
      }
    } catch {
      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
    return null
  })

  const handleLoginSuccess = (authData: LoginResponse) => {
    localStorage.setItem('access_token', authData.access_token)
    localStorage.setItem('refresh_token', authData.refresh_token)
    localStorage.setItem('user', JSON.stringify(authData.user))
    setUser(authData.user)
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
      </main>
    </div>
  )
}
