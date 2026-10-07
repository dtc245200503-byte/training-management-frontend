import { useAuth } from '../context/useAuth'

interface DashboardViewProps {
  onNavigate: (path: string) => void
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const { user, roles, permissions, hasPermission } = useAuth()

  if (!user) return null

  const canManageUsers = hasPermission('user:read')
  const canManageRoles = hasPermission('role:assign')

  return (
    <div className="dashboard-content">
      <div className="welcome-banner">
        <div className="welcome-avatar" aria-hidden="true">
          {(user.full_name || user.email).charAt(0).toUpperCase()}
        </div>
        <div className="welcome-info">
          <h2 className="welcome-title">Xin chào, {user.full_name || user.email}!</h2>
          <p className="welcome-subtitle">
            Chào mừng bạn quay trở lại Hệ thống Quản lý Đào tạo (ICTU × CodeGym).
          </p>
          <div className="welcome-badges">
            {roles.map((r) => (
              <span key={r} className={`role-badge role-${r.toLowerCase()}`}>
                {r}
              </span>
            ))}
            <span className={`status-pill ${user.is_active ? 'pill-active' : 'pill-inactive'}`}>
              {user.is_active ? 'Đang hoạt động' : 'Tạm khóa'}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Card thông tin tài khoản */}
        <div className="dashboard-card">
          <h3 className="card-title">Thông tin tài khoản</h3>
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">Mã định danh (ID):</span>
              <span className="info-value font-mono">#{user.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Họ và tên:</span>
              <span className="info-value">{user.full_name || 'Chưa cập nhật'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Trạng thái khóa:</span>
              <span className="info-value">
                {user.is_locked ? '🔒 Đã bị khóa' : '✓ Bình thường'}
              </span>
            </div>
          </div>
        </div>

        {/* Card phân quyền RBAC */}
        <div className="dashboard-card">
          <h3 className="card-title">Quyền hạn hệ thống (RBAC)</h3>
          <p className="card-desc">
            Các quyền được cấp dựa trên vai trò của bạn ({roles.join(', ') || 'Chưa có vai trò'}):
          </p>
          <div className="permissions-cloud">
            {permissions && permissions.length > 0 ? (
              permissions.map((p) => (
                <span key={p} className="permission-tag" title={p}>
                  {p}
                </span>
              ))
            ) : (
              <span className="text-muted">Không có quyền hạn đặc biệt.</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick shortcuts for role */}
      {canManageUsers && (
        <div className="quick-actions-card">
          <h3 className="card-title">Lối tắt quản trị</h3>
          <div className="shortcut-buttons">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate('/users')}
            >
              👥 Quản lý người dùng
            </button>
            {canManageRoles && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => onNavigate('/roles')}
              >
                🛡️ Phân quyền vai trò
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
