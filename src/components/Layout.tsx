import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'
import type { CurrentUser } from '../types/auth'


interface LayoutProps {
  user: CurrentUser
  onLogout: () => void
}


function Layout({
  user,
  onLogout,
}: LayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        onLogout={onLogout}
      />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}


export default Layout