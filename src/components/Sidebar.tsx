import { useAuth } from '../context/useAuth'
import type { MenuItem } from '../types/auth'

interface SidebarProps {
  currentPath: string
  onNavigate: (path: string) => void
}

function renderMenuIcon(iconName?: string | null) {
  switch (iconName) {
    case 'dashboard':
      return (
        <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      )
    case 'users':
    case 'user-list':
      return (
        <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'shield-check':
      return (
        <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      )
    case 'book':
    case 'academic-cap':
      return (
        <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    case 'chart':
      return (
        <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    case 'cog':
      return (
        <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    default:
      return (
        <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="2" />
        </svg>
      )
  }
}

export default function Sidebar({ currentPath, onNavigate }: SidebarProps) {
  const { menuItems, roles } = useAuth()

  // Fallback nếu chưa tải được menu từ backend
  const displayItems: MenuItem[] =
    menuItems.length > 0
      ? menuItems
      : [
          {
            key: 'dashboard',
            title: 'Trang chủ',
            path: '/dashboard',
            icon: 'dashboard',
          },
          ...(roles.includes('ADMIN')
            ? [
                {
                  key: 'users',
                  title: 'Quản lý người dùng',
                  path: '/users',
                  icon: 'users',
                },
              ]
            : []),
        ]

  return (
    <aside className="app-sidebar" aria-label="Menu điều hướng chính">
      <div className="sidebar-section-title">CHỨC NĂNG HỆ THỐNG</div>
      <nav className="sidebar-nav">
        <ul className="menu-list">
          {displayItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0
            const isActive =
              currentPath === item.path ||
              (hasChildren && item.children?.some((child) => child.path === currentPath))

            return (
              <li key={item.key} className="menu-item-group">
                <button
                  type="button"
                  className={`menu-link ${isActive ? 'active' : ''}`}
                  onClick={() => onNavigate(item.path)}
                >
                  {renderMenuIcon(item.icon)}
                  <span className="menu-title">{item.title}</span>
                </button>

                {hasChildren && (
                  <ul className="sub-menu-list">
                    {item.children!.map((child) => {
                      const isChildActive = currentPath === child.path
                      return (
                        <li key={child.key}>
                          <button
                            type="button"
                            className={`sub-menu-link ${isChildActive ? 'active' : ''}`}
                            onClick={() => onNavigate(child.path)}
                          >
                            {renderMenuIcon(child.icon)}
                            <span>{child.title}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
