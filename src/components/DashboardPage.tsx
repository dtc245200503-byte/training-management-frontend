import { Link } from 'react-router-dom'

import type { CurrentUser } from '../types/auth'


interface DashboardPageProps {
  user: CurrentUser
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


interface QuickAction {
  title: string
  description: string
  path: string
  permission?: string
  icon: React.ReactNode
}


const quickActions: QuickAction[] = [
  {
    title: 'Quản lý người dùng',
    description: 'Quản lý tài khoản và thông tin người dùng.',
    path: '/users',
    permission: 'USER_MANAGE',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Vai trò & quyền',
    description: 'Phân quyền và quản lý vai trò hệ thống.',
    path: '/roles',
    permission: 'ROLE_MANAGE',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Khóa học',
    description: 'Theo dõi và quản lý các khóa học.',
    path: '/courses',
    permission: 'COURSE_MANAGE',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    title: 'Lớp học',
    description: 'Quản lý lớp học và hoạt động đào tạo.',
    path: '/classes',
    permission: 'CLASS_MANAGE',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    title: 'Điểm',
    description: 'Xem và quản lý kết quả học tập.',
    path: '/grades',
    permission: 'GRADE_VIEW',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    title: 'Học phí',
    description: 'Theo dõi thông tin và tình trạng học phí.',
    path: '/tuition',
    permission: 'TUITION_VIEW',
    icon: (
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
  },
  {
    title: 'Điểm danh',
    description: 'Theo dõi và quản lý thông tin điểm danh.',
    path: '/attendance',
    permission: 'ATTENDANCE_VIEW',
    icon: (
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
  },
]


function DashboardPage({
  user,
}: DashboardPageProps) {
  const displayedRoles = user.roles
    .map((role) => roleNames[role] || role)
    .join(', ')


  const visibleActions = quickActions.filter(
    (action) => {
      if (!action.permission) {
        return true
      }

      return user.permissions.includes(
        action.permission
      )
    },
  )


  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome-card">
        <div className="dashboard-welcome-content">
          <span className="dashboard-welcome-label">
            TRANG CHỦ
          </span>

          <h1>
            Xin chào, {user.full_name}
          </h1>

          <p>
            Chào mừng bạn quay trở lại Hệ thống
            quản lý đào tạo.
          </p>

          <div className="dashboard-role">
            <span>Vai trò</span>

            <strong>
              {displayedRoles}
            </strong>
          </div>
        </div>

        <div className="dashboard-welcome-icon">
          <svg viewBox="0 0 24 24">
            <path d="M2 10l10-5 10 5-10 5L2 10z" />
            <path d="M6 12v5c3 2 9 2 12 0v-5" />
          </svg>
        </div>
      </section>


      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>
              Truy cập nhanh
            </h2>

            <p>
              Chọn chức năng bạn muốn sử dụng.
            </p>
          </div>
        </div>


        <div className="dashboard-action-grid">
          {visibleActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="dashboard-action-card"
            >
              <div className="dashboard-action-icon">
                {action.icon}
              </div>

              <div className="dashboard-action-content">
                <h3>
                  {action.title}
                </h3>

                <p>
                  {action.description}
                </p>
              </div>

              <span className="dashboard-action-arrow">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>


      <section className="dashboard-info-card">
        <div className="dashboard-info-icon">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" />
            <path d="M12 8h.01" />
          </svg>
        </div>

        <div>
          <h3>
            Hệ thống quản lý đào tạo
          </h3>

          <p>
            Các chức năng hiển thị trên trang chủ
            được tự động điều chỉnh theo quyền của
            tài khoản đang đăng nhập.
          </p>
        </div>
      </section>
    </div>
  )
}


export default DashboardPage