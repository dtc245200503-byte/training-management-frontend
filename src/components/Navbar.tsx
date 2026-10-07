import { useAuth } from '../context/useAuth'
import { getFullAvatarUrl } from '../utils/avatar'

interface NavbarProps {
  onOpenChangePassword: () => void
  onNavigate?: (path: string) => void
}

export default function Navbar({ onOpenChangePassword, onNavigate }: NavbarProps) {
  const { user, roles, logout, isLoggingOut } = useAuth()
  const avatarSrc = getFullAvatarUrl(user?.avatar_url)

  return (
    <header className="app-navbar">
      <div
        className="navbar-brand"
        onClick={() => onNavigate?.('/dashboard')}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onNavigate?.('/dashboard')
          }
        }}
      >
        <div className="navbar-logo-badge">ICTU × CodeGym</div>
        <h1 className="navbar-title">HỆ THỐNG QUẢN LÝ ĐÀO TẠO</h1>
      </div>

      <div className="navbar-user-section">
        {user && (
          <div
            className="user-profile-badge"
            onClick={() => onNavigate?.('/profile')}
            style={{ cursor: 'pointer' }}
            title="Xem hồ sơ cá nhân"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onNavigate?.('/profile')
              }
            }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={user.full_name || user.email}
                className="user-avatar-image"
              />
            ) : (
              <span className="user-avatar-circle" aria-hidden="true">
                {(user.full_name || user.email).charAt(0).toUpperCase()}
              </span>
            )}
            <div className="user-details">
              <span className="user-name">{user.full_name || user.email}</span>
              <div className="user-roles">
                {roles.length > 0 ? (
                  roles.map((r) => (
                    <span key={r} className={`role-badge role-${r.toLowerCase()}`}>
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="role-badge role-default">Người dùng</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="navbar-actions">
          {onNavigate && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onNavigate('/profile')}
              title="Xem và chỉnh sửa hồ sơ cá nhân"
            >
              Hồ sơ
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onOpenChangePassword}
            title="Đổi mật khẩu tài khoản"
          >
            Đổi mật khẩu
          </button>
          <button
            type="button"
            id="btn-logout"
            className="btn btn-danger btn-sm"
            onClick={logout}
            disabled={isLoggingOut}
            title="Đăng xuất khỏi hệ thống"
          >
            {isLoggingOut ? 'Đang thoát...' : 'Đăng xuất'}
          </button>
        </div>
      </div>
    </header>
  )
}
