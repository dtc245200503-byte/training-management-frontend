import {
  useEffect,
  useState,
} from 'react'

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
  MANAGER: 'Quản lý đào tạo',
  INSTRUCTOR: 'Giảng viên',
  STUDENT: 'Học viên',
  ACCOUNTANT: 'Kế toán',
  TRAINING_MANAGER: 'Quản lý đào tạo',
  ADMISSIONS: 'Tuyển sinh',
  ACADEMIC_AFFAIRS: 'Giáo vụ',
  MANAGEMENT: 'Ban quản lý',
}


function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  )
}


function Layout({
  user,
  onLogout,
}: LayoutProps) {
  const location = useLocation()

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false)


  const displayedRoles = user.roles
    .map((role) => roleNames[role] || 'Vai trò khác')
    .join(', ')


  const avatarLetter = user.full_name
    .trim()
    .charAt(0)
    .toUpperCase()


  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])


  useEffect(() => {
    if (!mobileMenuOpen) {
      return
    }

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener(
      'keydown',
      handleEscape,
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [mobileMenuOpen])


  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        onLogout={onLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() =>
          setMobileMenuOpen(false)
        }
      />

      {mobileMenuOpen && (
        <button
          type="button"
          className="mobile-sidebar-overlay"
          aria-label="Đóng menu điều hướng"
          onClick={() =>
            setMobileMenuOpen(false)
          }
        />
      )}

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              aria-label="Mở menu điều hướng"
              aria-expanded={mobileMenuOpen}
              onClick={() =>
                setMobileMenuOpen(true)
              }
            >
              <MenuIcon />
            </button>

            <div className="topbar-title">
              <span className="topbar-welcome">
                Hệ thống quản lý đào tạo
              </span>

              <span className="topbar-description">
                Quản lý và theo dõi hoạt động đào tạo
              </span>
            </div>
          </div>

          <div className="topbar-user">
            <div className="topbar-avatar">
              {user.avatar_thumbnail_url || user.avatar_url
                ? <img src={user.avatar_thumbnail_url || user.avatar_url || ''} alt="Ảnh đại diện của bạn" />
                : avatarLetter}
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
