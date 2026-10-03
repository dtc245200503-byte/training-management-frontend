import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

import ChangePasswordPage from './components/ChangePasswordPage'
import DashboardPage from './components/DashboardPage'
import ErrorPage from './components/ErrorPage'
import ForgotPasswordPage from './components/ForgotPasswordPage'
import Layout from './components/Layout'
import LoginPage from './components/LoginPage'
import PermissionPage from './components/PermissionPage'
import ResetPasswordPage from './components/ResetPasswordPage'
import RolePermissionPage from './components/RolePermissionPage'
import Toast from './components/Toast'
import UserManagementPage from './components/UserManagementPage'

import {
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  resetPassword,
} from './services/authService'

import type {
  CurrentUser,
} from './types/auth'


type ToastType = 'success' | 'warning'


interface ToastState {
  message: string
  type: ToastType
}


interface AuthenticatedAppProps {
  user: CurrentUser

  onUserUpdated: (
    user: CurrentUser,
  ) => void

  onLogout: (
    message?: string,
  ) => void

  onShowSuccess: (
    message: string,
  ) => void
}


function AuthenticatedApp({
  user,
  onUserUpdated,
  onLogout,
  onShowSuccess,
}: AuthenticatedAppProps) {
  const location = useLocation()


  useEffect(() => {
    const refreshCurrentUser = async () => {
      let accessToken =
        localStorage.getItem(
          'access_token',
        )

      if (!accessToken) {
        sessionStorage.setItem(
          'return_path',
          location.pathname,
        )

        onLogout(
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        )

        return
      }

      try {
        const currentUser =
          await getCurrentUser(
            accessToken,
          )

        onUserUpdated(currentUser)
      } catch {
        try {
          const result =
            await refreshAccessToken()

          accessToken =
            result.access_token

          const currentUser =
            await getCurrentUser(
              accessToken,
            )

          onUserUpdated(currentUser)
        } catch {
          sessionStorage.setItem(
            'return_path',
            location.pathname,
          )

          onLogout(
            'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          )
        }
      }
    }

    refreshCurrentUser()
  }, [location.pathname])


  useEffect(() => {
    let lastActivity = Date.now()

    const updateActivity = () => {
      lastActivity = Date.now()
    }

    const activityEvents = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
    ]

    activityEvents.forEach((eventName) => {
      window.addEventListener(
        eventName,
        updateActivity,
      )
    })


    const refreshInterval =
      window.setInterval(
        async () => {
          const activeRecently =
            Date.now() - lastActivity
            < 10 * 60 * 1000

          if (!activeRecently) {
            return
          }

          try {
            await refreshAccessToken()
          } catch {
            sessionStorage.setItem(
              'return_path',
              location.pathname,
            )

            onLogout(
              'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
            )
          }
        },
        10 * 60 * 1000,
      )


    return () => {
      activityEvents.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            updateActivity,
          )
        },
      )

      window.clearInterval(
        refreshInterval,
      )
    }
  }, [location.pathname])


  return (
    <Routes>
      <Route
        element={
          <Layout
            user={user}
            onLogout={() =>
              onLogout()
            }
          />
        }
      >
        <Route
          path="/"
          element={
            <DashboardPage
              user={user}
            />
          }
        />

        <Route
          path="/users"
          element={
            <UserManagementPage
              user={user}
            />
          }
        />

        <Route
          path="/roles"
          element={
            <RolePermissionPage
              user={user}
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
          path="/change-password"
          element={
            <ChangePasswordPage
              onSuccess={onShowSuccess}
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
  )
}


function App() {
  const [user, setUser] =
    useState<CurrentUser | null>(
      null,
    )

  const [loading, setLoading] =
    useState(true)

  const [
    showForgotPassword,
    setShowForgotPassword,
  ] = useState(false)

  const [resetToken, setResetToken] =
    useState<string | null>(null)

  const [toast, setToast] =
    useState<ToastState | null>(
      null,
    )


  const closeToast = useCallback(
    () => {
      setToast(null)
    },
    [],
  )


  const showToast = (
    message: string,
    type: ToastType,
  ) => {
    setToast({
      message,
      type,
    })
  }


  const clearSession = (
    message = '',
  ) => {
    localStorage.removeItem(
      'access_token',
    )

    localStorage.removeItem(
      'refresh_token',
    )

    setUser(null)
    setShowForgotPassword(false)

    if (message) {
      showToast(
        message,
        'warning',
      )
    }
  }


  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search,
    )

    const token = params.get('token')

    if (
      window.location.pathname
        === '/reset-password'
      && token
    ) {
      setResetToken(token)
      setLoading(false)
      return
    }


    const loadUser = async () => {
      let accessToken =
        localStorage.getItem(
          'access_token',
        )

      const refreshToken =
        localStorage.getItem(
          'refresh_token',
        )

      if (
        !accessToken
        && !refreshToken
      ) {
        setLoading(false)
        return
      }

      try {
        if (!accessToken) {
          const result =
            await refreshAccessToken()

          accessToken =
            result.access_token
        }

        try {
          const currentUser =
            await getCurrentUser(
              accessToken,
            )

          setUser(currentUser)
        } catch {
          const result =
            await refreshAccessToken()

          const currentUser =
            await getCurrentUser(
              result.access_token,
            )

          setUser(currentUser)
        }
      } catch {
        sessionStorage.setItem(
          'return_path',
          window.location.pathname,
        )

        clearSession(
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        )
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

    const currentUser =
      await getCurrentUser(
        result.access_token,
      )

    setUser(currentUser)

    const returnPath =
      sessionStorage.getItem(
        'return_path',
      )

    if (returnPath) {
      sessionStorage.removeItem(
        'return_path',
      )

      window.history.replaceState(
        {},
        '',
        returnPath,
      )
    }

    showToast(
      'Đăng nhập thành công.',
      'success',
    )
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


  const handleLogout = async (
    message = '',
  ) => {
    if (message) {
      clearSession(message)
      return
    }

    sessionStorage.removeItem(
      'return_path',
    )

    try {
      await logout()
    } catch {
      // Vẫn xóa phiên trên trình duyệt
      // nếu server không phản hồi.
    }

    clearSession()

    window.history.replaceState(
      {},
      '',
      '/',
    )

    showToast(
      'Đăng xuất thành công.',
      'success',
    )
  }


  const toastElement = toast ? (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={closeToast}
    />
  ) : null


  if (loading) {
    return <p>Đang tải...</p>
  }


  if (resetToken) {
    return (
      <>
        <ResetPasswordPage
          onSubmit={handleResetPassword}
          onBack={handleBackToLogin}
        />

        {toastElement}
      </>
    )
  }


  if (!user) {
    if (showForgotPassword) {
      return (
        <>
          <ForgotPasswordPage
            onSubmit={
              handleForgotPassword
            }
            onBack={() =>
              setShowForgotPassword(
                false,
              )
            }
          />

          {toastElement}
        </>
      )
    }

    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onForgotPassword={() =>
            setShowForgotPassword(
              true,
            )
          }
        />

        {toastElement}
      </>
    )
  }


  return (
    <>
      <BrowserRouter>
        <AuthenticatedApp
          user={user}
          onUserUpdated={setUser}
          onLogout={handleLogout}
          onShowSuccess={(message) =>
            showToast(
              message,
              'success',
            )
          }
        />
      </BrowserRouter>

      {toastElement}
    </>
  )
}


export default App