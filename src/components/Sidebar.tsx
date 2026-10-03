import {
  useState,
  type ReactNode,
} from 'react'

import { NavLink } from 'react-router-dom'

import { menuItems } from '../data/menuItems'
import type { CurrentUser } from '../types/auth'


interface SidebarProps {
  user: CurrentUser
  onLogout: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}


const menuIcons: Record<string, ReactNode> = {
  '/': (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),

  '/users': (
    <svg viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),

  '/roles': (
    <svg viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),

  '/courses': (
    <svg viewBox="0 0 24 24">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),

  '/classes': (
    <svg viewBox="0 0 24 24">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
    </svg>
  ),

  '/grades': (
    <svg viewBox="0 0 24 24">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),

  '/tuition': (
    <svg viewBox="0 0 24 24">
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2"
      />
      <path d="M2 10h20" />
      <path d="M6 15h2" />
    </svg>
  ),

  '/attendance': (
    <svg viewBox="0 0 24 24">
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2"
      />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
      <path d="M8 15l2 2 4-4" />
    </svg>
  ),
}


function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l8-8" />
      <path d="M17 6l2 2" />
      <path d="M15 8l2 2" />
    </svg>
  )
}


function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}


function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  )
}


function Sidebar({
  user,
  onLogout,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const [
    showLogoutConfirm,
    setShowLogoutConfirm,
  ] = useState(false)


  const visibleMenuItems = menuItems.filter(
    (item) => {
      if (!item.permission) {
        return true
      }

      return user.permissions.includes(
        item.permission,
      )
    },
  )


  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false)
    onMobileClose()
    onLogout()
  }


  return (
    <>
      <aside
        className={
          mobileOpen
            ? 'sidebar mobile-open'
            : 'sidebar'
        }
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <svg viewBox="0 0 24 24">
                <path d="M2 10l10-5 10 5-10 5L2 10z" />
                <path d="M6 12v5c3 2 9 2 12 0v-5" />
              </svg>
            </div>

            <div>
              <strong>
                EDUCATE
              </strong>

              <span>
                Quản lý đào tạo
              </span>
            </div>
          </div>

          <button
            type="button"
            className="mobile-sidebar-close"
            aria-label="Đóng menu điều hướng"
            onClick={onMobileClose}
          >
            <CloseIcon />
          </button>
        </div>


        <nav className="sidebar-menu">
          <span className="sidebar-section-title">
            MENU CHÍNH
          </span>

          {visibleMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onMobileClose}
              className={({ isActive }) =>
                isActive
                  ? 'menu-item active'
                  : 'menu-item'
              }
            >
              <span className="menu-icon">
                {menuIcons[item.path]}
              </span>

              <span className="menu-label">
                {item.name}
              </span>

              <span className="menu-arrow">
                ›
              </span>
            </NavLink>
          ))}


          <div className="sidebar-menu-divider" />


          <NavLink
            to="/change-password"
            onClick={onMobileClose}
            className={({ isActive }) =>
              isActive
                ? 'menu-item active'
                : 'menu-item'
            }
          >
            <span className="menu-icon">
              <KeyIcon />
            </span>

            <span className="menu-label">
              Đổi mật khẩu
            </span>

            <span className="menu-arrow">
              ›
            </span>
          </NavLink>


          <button
            type="button"
            className="menu-item sidebar-logout-menu"
            onClick={() => {
              onMobileClose()
              setShowLogoutConfirm(true)
            }}
          >
            <span className="menu-icon">
              <LogoutIcon />
            </span>

            <span className="menu-label">
              Đăng xuất
            </span>
          </button>
        </nav>
      </aside>


      {showLogoutConfirm && (
        <div
          className="logout-confirm-overlay"
          onMouseDown={(event) => {
            if (
              event.target
              === event.currentTarget
            ) {
              setShowLogoutConfirm(false)
            }
          }}
        >
          <div
            className="logout-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
          >
            <div className="logout-confirm-icon">
              <LogoutIcon />
            </div>

            <h2 id="logout-confirm-title">
              Xác nhận đăng xuất
            </h2>

            <p>
              Bạn có chắc chắn muốn đăng xuất
              khỏi hệ thống không?
            </p>

            <div className="logout-confirm-actions">
              <button
                type="button"
                className="logout-cancel-button"
                onClick={() =>
                  setShowLogoutConfirm(false)
                }
              >
                Hủy
              </button>

              <button
                type="button"
                className="logout-confirm-button"
                onClick={handleConfirmLogout}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


export default Sidebar