import { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import DashboardView from './components/DashboardView'
import UserManagement from './components/UserManagement'
import ProtectedRoute from './components/ProtectedRoute'
import ModulePlaceholder from './components/ModulePlaceholder'
import ChangePasswordModal from './components/ChangePasswordModal'
import ForgotPasswordModal from './components/ForgotPasswordModal'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { NotificationProvider } from './context/NotificationContext'

function MainLayout() {
  const { user, loginSuccess } = useAuth()
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const hash = window.location.hash.replace(/^#/, '')
    return hash || '/dashboard'
  })

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)

  // S1-03: Khởi tạo reset token từ URL query parameter bằng lazy initializer (tránh cascading render)
  const [resetTokenFromUrl] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    const params = new URLSearchParams(window.location.search)
    return params.get('token') || params.get('reset_token') || ''
  })

  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const params = new URLSearchParams(window.location.search)
    return Boolean(params.get('token') || params.get('reset_token'))
  })

  // Đồng bộ URL hash khi navigate
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '')
      if (hash) {
        setCurrentPath(hash)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleNavigate = (path: string) => {
    setCurrentPath(path)
    window.location.hash = path
  }

  if (!user) {
    return (
      <>
        <LoginPage onLoginSuccess={loginSuccess} />
        {/* Hỗ trợ mở reset modal khi có token từ link email */}
        <ForgotPasswordModal
          isOpen={isResetModalOpen}
          initialToken={resetTokenFromUrl}
          onClose={() => setIsResetModalOpen(false)}
        />
      </>
    )
  }

  return (
    <div className="app-shell">
      <Navbar onOpenChangePassword={() => setIsChangePasswordOpen(true)} />

      <div className="app-body">
        <Sidebar currentPath={currentPath} onNavigate={handleNavigate} />

        <main className="app-main-content" role="main">
          {/* S1-05: RBAC Route Guards for Each Path */}
          {currentPath === '/' || currentPath === '/dashboard' ? (
            <DashboardView onNavigate={handleNavigate} />
          ) : currentPath === '/users' ? (
            <ProtectedRoute requiredPermission="user:read">
              <UserManagement />
            </ProtectedRoute>
          ) : currentPath === '/roles' ? (
            <ProtectedRoute requiredPermission="role:assign">
              <UserManagement />
            </ProtectedRoute>
          ) : currentPath === '/courses' ? (
            <ProtectedRoute requiredPermission="course:manage">
              <ModulePlaceholder
                title="Quản lý khóa học"
                description="Chức năng quản lý khóa học, bài học và lớp đào tạo dành cho Giảng viên & Quản trị viên."
                icon="📚"
              />
            </ProtectedRoute>
          ) : currentPath === '/my-courses' ? (
            <ProtectedRoute requiredPermission="course:read">
              <ModulePlaceholder
                title="Khóa học của tôi"
                description="Danh sách các khóa học và chương trình đào tạo bạn đang theo học."
                icon="🎓"
              />
            </ProtectedRoute>
          ) : currentPath === '/reports' ? (
            <ProtectedRoute requiredPermission="report:view">
              <ModulePlaceholder
                title="Báo cáo thống kê"
                description="Báo cáo số liệu học tập, tiến độ khóa học và thống kê quản lý đào tạo."
                icon="📊"
              />
            </ProtectedRoute>
          ) : currentPath === '/settings' ? (
            <ProtectedRoute requiredRole="ADMIN">
              <ModulePlaceholder
                title="Cài đặt hệ thống"
                description="Cấu hình tham số hệ thống và phân quyền dành cho Quản trị viên."
                icon="⚙️"
              />
            </ProtectedRoute>
          ) : (
            <div className="not-found-view">
              <h3>404 - Trang không tồn tại</h3>
              <p>Đường dẫn "{currentPath}" không có trong hệ thống.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleNavigate('/dashboard')}
              >
                Về Trang chủ
              </button>
            </div>
          )}
        </main>
      </div>

      {/* S1-04: Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  )
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </NotificationProvider>
  )
}
