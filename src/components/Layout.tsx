import {
  Outlet,
  useLocation,
} from 'react-router-dom'

import Sidebar from './Sidebar'
import type { CurrentUser } from '../types/auth'


interface LayoutProps {
  user: CurrentUser
  onLogout: () => void
}


const roleNames: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  INSTRUCTOR: 'Giảng viên',
  STUDENT: 'Học viên',
  ACCOUNTANT: 'Kế toán',
  TRAINING_MANAGER: 'Quản lý đào tạo',
  ADMISSIONS: 'Tuyển sinh',
  ACADEMIC_AFFAIRS: 'Giáo vụ',
  MANAGEMENT: 'Ban quản lý',
}


function Layout({
  user,
  onLogout,
}: LayoutProps) {
  const location = useLocation()


  const displayedRoles = user.roles
    .map((role) => roleNames[role] || role)
    .join(', ')


  const avatarLetter = user.full_name
    .trim()
    .charAt(0)
    .toUpperCase()


  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        onLogout={onLogout}
      />

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-title">
            <span className="topbar-welcome">
              Hệ thống quản lý đào tạo
            </span>

            <span className="topbar-description">
              Quản lý và theo dõi hoạt động đào tạo
            </span>
          </div>

          <div className="topbar-user">
            <div className="topbar-avatar">
              {avatarLetter}
            </div>

            <div className="topbar-user-info">
              <strong>
                {user.full_name}
              </strong>

              <span>
                {displayedRoles}
              </span>
            </div>
          </div>
        </header>

        <main className="main-content">
          <div
            key={location.pathname}
            className="page-transition"
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}


export default Layout