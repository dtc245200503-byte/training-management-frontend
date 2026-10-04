import React from 'react'
import ErrorPage from './ErrorPage'
import type { CurrentUser } from '../types/auth'

interface PermissionPageProps {
  user: CurrentUser
  permission: string
  title: string
  children?: React.ReactNode // Thêm children để bọc được component con (UserManagementPage)
}

function PermissionPage({
  user,
  permission,
  title,
  children,
}: PermissionPageProps) {
  const hasPermission = user.permissions.includes(permission)

  if (!hasPermission) {
    return (
      <ErrorPage
        statusCode={403}
        title="Không có quyền truy cập"
        message="Bạn không có quyền truy cập chức năng này."
      />
    )
  }

  return (
    <div>
      {/* Nếu truyền children vào thì render children, ngược lại hiển thị dòng chữ mặc định */}
      {children ? (
        children
      ) : (
        <>
          <h1>{title}</h1>
          <p>Nội dung chức năng đang được phát triển.</p>
        </>
      )}
    </div>
  )
}

export default PermissionPage