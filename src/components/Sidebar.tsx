import { NavLink } from 'react-router-dom'

import { menuItems } from '../data/menuItems'
import type { CurrentUser } from '../types/auth'


interface SidebarProps {
  user: CurrentUser
  onLogout: () => void
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
          {user.roles.join(', ')}
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