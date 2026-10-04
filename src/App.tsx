import {
  useEffect,
  useState,
} from 'react'

import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom'

import ErrorPage from './components/ErrorPage'
import ForgotPasswordPage from './components/ForgotPasswordPage'
import Layout from './components/Layout'
import LoginPage from './components/LoginPage'
import PermissionPage from './components/PermissionPage'
import ResetPasswordPage from './components/ResetPasswordPage'
import {
  forgotPassword,
  getCurrentUser,
  login,
  resetPassword,
} from './services/authService'
import type { CurrentUser } from './types/auth'


function Page({
  title,
}: {
  title: string
}) {
  return (
    <div>
      <h1>{title}</h1>

      <p>
        Nội dung chức năng đang được phát triển.
      </p>
    </div>
  )
}


function App() {
  const [user, setUser] = useState<CurrentUser | null>(
    null,
  )

  const [loading, setLoading] = useState(true)

  const [showForgotPassword, setShowForgotPassword] =
    useState(false)

  const [resetToken, setResetToken] = useState<
    string | null
  >(null)


  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search,
    )

    const token = params.get('token')

    if (
      window.location.pathname === '/reset-password'
      && token
    ) {
      setResetToken(token)
      setLoading(false)
      return
    }


    const loadUser = async () => {
      const accessToken = localStorage.getItem(
        'access_token',
      )

      if (!accessToken) {
        setLoading(false)
        return
      }

      try {
        const currentUser = await getCurrentUser(
          accessToken,
        )

        setUser(currentUser)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])


  const handleLogin = async (
    email: string,
    password: string,
  ) => {
    const result = await login(
      email,
      password,
    )

    localStorage.setItem(
      'access_token',
      result.access_token,
    )

    localStorage.setItem(
      'refresh_token',
      result.refresh_token,
    )

    const currentUser = await getCurrentUser(
      result.access_token,
    )

    setUser(currentUser)
  }


  const handleForgotPassword = async (
    email: string,
  ) => {
    await forgotPassword(email)
  }


  const handleResetPassword = async (
    password: string,
  ) => {
    if (!resetToken) {
      throw new Error(
        'Liên kết đặt lại mật khẩu không hợp lệ.',
      )
    }

    await resetPassword(
      resetToken,
      password,
    )
  }


  const handleBackToLogin = () => {
    setResetToken(null)
    setShowForgotPassword(false)

    window.history.replaceState(
      {},
      '',
      '/',
    )
  }


  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    setUser(null)
    setShowForgotPassword(false)
  }


  if (loading) {
    return <p>Đang tải...</p>
  }


  if (resetToken) {
    return (
      <ResetPasswordPage
        onSubmit={handleResetPassword}
        onBack={handleBackToLogin}
      />
    )
  }


  if (!user) {
    if (showForgotPassword) {
      return (
        <ForgotPasswordPage
          onSubmit={handleForgotPassword}
          onBack={() =>
            setShowForgotPassword(false)
          }
        />
      )
    }

    return (
      <LoginPage
        onLogin={handleLogin}
        onForgotPassword={() =>
          setShowForgotPassword(true)
        }
      />
    )
  }


  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <Layout
              user={user}
              onLogout={handleLogout}
            />
          }
        >
          <Route
            path="/"
            element={
              <Page title="Trang chủ" />
            }
          />

          <Route
            path="/users"
            element={
              <PermissionPage
                user={user}
                permission="USER_MANAGE"
                title="Quản lý tài khoản"
              />
            }
          />

          <Route
            path="/roles"
            element={
              <PermissionPage
                user={user}
                permission="ROLE_MANAGE"
                title="Vai trò và phân quyền"
              />
            }
          />

          <Route
            path="/courses"
            element={
              <PermissionPage
                user={user}
                permission="COURSE_MANAGE"
                title="Khóa học"
              />
            }
          />

          <Route
            path="/classes"
            element={
              <PermissionPage
                user={user}
                permission="CLASS_MANAGE"
                title="Lớp học"
              />
            }
          />

          <Route
            path="/grades"
            element={
              <PermissionPage
                user={user}
                permission="GRADE_VIEW"
                title="Điểm"
              />
            }
          />

          <Route
            path="/tuition"
            element={
              <PermissionPage
                user={user}
                permission="TUITION_VIEW"
                title="Học phí"
              />
            }
          />

          <Route
            path="/attendance"
            element={
              <PermissionPage
                user={user}
                permission="ATTENDANCE_VIEW"
                title="Điểm danh"
              />
            }
          />

          <Route
            path="*"
            element={
              <ErrorPage
                statusCode={404}
                title="Không tìm thấy trang"
                message={
                  'Trang bạn đang truy cập không tồn tại.'
                }
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}


export default App