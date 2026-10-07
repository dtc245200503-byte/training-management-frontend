import { type ReactNode } from 'react'
import { useAuth } from '../context/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string
  requiredPermission?: string
  requiredPermissions?: string[]
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  requiredPermissions,
}: ProtectedRouteProps) {
  const { user, loading, hasRole, hasPermission, hasAnyPermission } = useAuth()

  if (loading) {
    return (
      <div className="app-loading-screen" role="status">
        <div className="spinner" aria-hidden="true" />
        <span style={{ marginLeft: 8 }}>Đang kiểm tra quyền truy cập...</span>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // S1-05: RBAC Route Guard Checks
  let allowed = true
  let deniedReason = ''

  if (requiredRole && !hasRole(requiredRole)) {
    allowed = false
    deniedReason = `Yêu cầu vai trò: ${requiredRole}`
  }

  if (allowed && requiredPermission && !hasPermission(requiredPermission)) {
    allowed = false
    deniedReason = `Yêu cầu quyền hạn: ${requiredPermission}`
  }

  if (allowed && requiredPermissions && requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    allowed = false
    deniedReason = `Yêu cầu một trong các quyền: ${requiredPermissions.join(', ')}`
  }

  if (!allowed) {
    return (
      <div className="forbidden-screen" role="alert">
        <div className="forbidden-card">
          <div className="forbidden-icon" aria-hidden="true">
            🚫
          </div>
          <h2 className="forbidden-title">403 - Không có quyền truy cập</h2>
          <p className="forbidden-desc">
            Tài khoản của bạn không được cấp quyền để truy cập vào màn hình hoặc chức năng này.
          </p>
          {deniedReason && (
            <div className="forbidden-detail">
              <strong>Chi tiết kiểm tra:</strong> {deniedReason}
            </div>
          )}
          <div className="forbidden-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                window.location.hash = '#/'
              }}
            >
              Về Trang chủ
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
