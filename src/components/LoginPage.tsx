import { useState } from 'react'
import type { FormEvent } from 'react'


interface LoginPageProps {
  onLogin: (
    email: string,
    password: string,
  ) => Promise<void>

  onForgotPassword: () => void
}


function LoginPage({
  onLogin,
  onForgotPassword,
}: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)


  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      await onLogin(email, password)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Đăng nhập thất bại.')
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Training Management System</h1>

        <p className="login-subtitle">
          Đăng nhập vào hệ thống
        </p>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Nhập email"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">
              Mật khẩu
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <div className="forgot-password-row">
            <button
              type="button"
              className="forgot-password-button"
              onClick={onForgotPassword}
            >
              Quên mật khẩu?
            </button>
          </div>

          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? 'Đang đăng nhập...'
              : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}


export default LoginPage