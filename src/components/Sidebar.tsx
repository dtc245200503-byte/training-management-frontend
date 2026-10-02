import { NavLink } from 'react-router-dom'

import { menuItems } from '../data/menuItems'
import type { CurrentUser } from '../types/auth'


interface SidebarProps {
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


function Sidebar({
  user,
  onLogout,
}: SidebarProps) {
  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.permission) {
      return true
    }

    return user.permissions.includes(item.permission)
  })


  const displayedRoles = user.roles
    .map((role) => roleNames[role] || role)
    .join(', ')


  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Quản lý đào tạo</h2>
      </div>

      <nav className="sidebar-menu">
        {visibleMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? 'menu-item active'
                : 'menu-item'
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <strong>{user.full_name}</strong>

        <span>
          {displayedRoles}
        </span>

        <button
          type="button"
          className="logout-button"
          onClick={onLogout}
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}


export default Sidebar