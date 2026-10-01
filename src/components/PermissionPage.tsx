import ErrorPage from './ErrorPage'
import type { CurrentUser } from '../types/auth'


interface PermissionPageProps {
  user: CurrentUser
  permission: string
  title: string
}


function PermissionPage({
  user,
  permission,
  title,
}: PermissionPageProps) {
  const hasPermission = user.permissions.includes(
    permission,
  )

  if (!hasPermission) {
    return (
      <ErrorPage
        statusCode={403}
        title="Không có quyền truy cập"
        message={
          'Bạn không có quyền truy cập chức năng này.'
        }
      />
    )
  }

  return (
    <div>
      <h1>{title}</h1>

      <p>
        Nội dung chức năng đang được phát triển.
      </p>
    </div>
  )
}


export default PermissionPage