import { useState, type FormEvent, type ChangeEvent } from 'react'
import { login } from '../services/authService'
import type { LoginResponse } from '../types/auth'

interface LoginPageProps {
  onLoginSuccess: (authData: LoginResponse) => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [loading, setLoading] = useState(false)

  const validateEmail = (val: string): string => {
    const trimmed = val.trim()
    if (!trimmed) {
      return 'Email là bắt buộc.'
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      return 'Email không đúng định dạng (ví dụ: user@example.com).'
    }
    return ''
  }

  const validatePassword = (val: string): string => {
    if (!val) {
      return 'Mật khẩu là bắt buộc.'
    }
    return ''
  }

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (emailError) {
      setEmailError(validateEmail(e.target.value))
    }
    if (generalError) {
      setGeneralError('')
    }
  }

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (passwordError) {
      setPasswordError(validatePassword(e.target.value))
    }
    if (generalError) {
      setGeneralError('')
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const errEmail = validateEmail(email)
    const errPassword = validatePassword(password)

    setEmailError(errEmail)
    setPasswordError(errPassword)
    setGeneralError('')

    if (errEmail || errPassword) {
      return
    }

    setLoading(true)

    try {
      const result = await login({
        email: email.trim(),
        password,
      })

      onLoginSuccess(result)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setGeneralError(err.message)
      } else {
        setGeneralError('Đã xảy ra lỗi không xác định. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <main className="login-card" role="main">
        <header className="login-header">
          <div className="login-badge">ICTU × CodeGym Việt Nam</div>
          <h1 className="login-title">HỆ THỐNG QUẢN LÝ ĐÀO TẠO</h1>
          <p className="login-subtitle">Đăng nhập tài khoản để tiếp tục</p>
        </header>

        {generalError && (
          <div
            id="login-general-error"
            className="login-alert login-alert-error"
            role="alert"
            aria-live="polite"
          >
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Email <span className="required-mark" aria-hidden="true">*</span>
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              className={`form-input ${emailError ? 'input-error' : ''}`}
              placeholder="name@example.com"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => setEmailError(validateEmail(email))}
              disabled={loading}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'email-error-text' : undefined}
            />
            {emailError && (
              <span id="email-error-text" className="field-error" role="alert">
                {emailError}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              Mật khẩu <span className="required-mark" aria-hidden="true">*</span>
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              className={`form-input ${passwordError ? 'input-error' : ''}`}
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => setPasswordError(validatePassword(password))}
              disabled={loading}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? 'password-error-text' : undefined}
            />
            {passwordError && (
              <span id="password-error-text" className="field-error" role="alert">
                {passwordError}
              </span>
            )}
          </div>

          <button
            type="submit"
            id="btn-login-submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading-content">
                <span className="spinner" aria-hidden="true" />
                <span>Đang đăng nhập...</span>
              </span>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
