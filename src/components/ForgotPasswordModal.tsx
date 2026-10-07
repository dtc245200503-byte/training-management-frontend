import { useState, type FormEvent, type ChangeEvent } from 'react'
import { forgotPassword, resetPassword, verifyResetToken } from '../services/authService'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  initialToken?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialToken = '',
}: ForgotPasswordModalProps) {
  const [mode, setMode] = useState<'request' | 'reset'>(initialToken ? 'reset' : 'request')

  // Request mode state
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState('')
  const [requestError, setRequestError] = useState('')

  // Reset mode state
  const [token, setToken] = useState(initialToken)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState('')
  const [resetError, setResetError] = useState('')

  if (!isOpen) return null

  const handleRequestSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setEmailError('Email là bắt buộc.')
      return
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError('Email không đúng định dạng.')
      return
    }

    setEmailError('')
    setRequestError('')
    setRequestSuccess('')
    setRequestLoading(true)

    try {
      const res = await forgotPassword({ email: trimmed })
      setRequestSuccess(res.message || 'Yêu cầu đặt lại mật khẩu đã được gửi đến email của bạn.')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRequestError(err.message)
      } else {
        setRequestError('Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại.')
      }
    } finally {
      setRequestLoading(false)
    }
  }

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault()
    let hasErr = false

    const cleanToken = token.trim()
    if (!cleanToken) {
      setTokenError('Mã đặt lại mật khẩu là bắt buộc.')
      hasErr = true
    } else {
      setTokenError('')
    }

    if (!newPassword) {
      setNewPasswordError('Mật khẩu mới là bắt buộc.')
      hasErr = true
    } else if (newPassword.length < 6) {
      setNewPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      hasErr = true
    } else {
      setNewPasswordError('')
    }

    if (confirmPassword !== newPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp.')
      hasErr = true
    } else {
      setConfirmPasswordError('')
    }

    if (hasErr) return

    setResetError('')
    setResetSuccess('')
    setResetLoading(true)

    try {
      // 1. Kiểm tra tính hợp lệ của token
      const verifyRes = await verifyResetToken({ token: cleanToken })
      if (!verifyRes.valid) {
        setTokenError(verifyRes.message || 'Mã xác nhận không hợp lệ hoặc đã hết hạn.')
        setResetLoading(false)
        return
      }

      // 2. Thực hiện đổi mật khẩu
      const res = await resetPassword({
        token: cleanToken,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })

      setResetSuccess(res.message || 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setResetError(err.message)
      } else {
        setResetError('Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại mã xác nhận.')
      }
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card">
        <header className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {mode === 'request' ? 'Quên mật khẩu' : 'Đặt lại mật khẩu mới'}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
          >
            ×
          </button>
        </header>

        {/* Tab switch */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${mode === 'request' ? 'active' : ''}`}
            onClick={() => {
              setMode('request')
              setRequestError('')
              setRequestSuccess('')
            }}
          >
            1. Gửi email xác nhận
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${mode === 'reset' ? 'active' : ''}`}
            onClick={() => {
              setMode('reset')
              setResetError('')
              setResetSuccess('')
            }}
          >
            2. Nhập mã & Đổi mật khẩu
          </button>
        </div>

        {mode === 'request' ? (
          <form onSubmit={handleRequestSubmit} className="modal-form" noValidate>
            <p className="modal-instruction">
              Nhập địa chỉ email đăng ký tài khoản của bạn. Hệ thống sẽ gửi mã xác nhận để bạn thiết
              lập mật khẩu mới.
            </p>

            {requestSuccess && (
              <div className="login-alert login-alert-success" role="alert">
                {requestSuccess}
              </div>
            )}

            {requestError && (
              <div className="login-alert login-alert-error" role="alert">
                {requestError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="forgot-email" className="form-label">
                Email tài khoản <span className="required-mark">*</span>
              </label>
              <input
                id="forgot-email"
                type="email"
                className={`form-input ${emailError ? 'input-error' : ''}`}
                placeholder="name@example.com"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError('')
                }}
                disabled={requestLoading}
              />
              {emailError && <span className="field-error">{emailError}</span>}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={requestLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                id="btn-forgot-password-submit"
                className="btn btn-primary"
                disabled={requestLoading}
              >
                {requestLoading ? (
                  <span className="btn-loading-content">
                    <span className="spinner" />
                    <span>Đang gửi...</span>
                  </span>
                ) : (
                  'Gửi yêu cầu'
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="modal-form" noValidate>
            <p className="modal-instruction">
              Nhập mã đặt lại mật khẩu (đã nhận qua email) cùng mật khẩu mới của bạn.
            </p>

            {resetSuccess && (
              <div className="login-alert login-alert-success" role="alert">
                {resetSuccess}
              </div>
            )}

            {resetError && (
              <div className="login-alert login-alert-error" role="alert">
                {resetError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="reset-token" className="form-label">
                Mã xác nhận (Reset Token) <span className="required-mark">*</span>
              </label>
              <input
                id="reset-token"
                type="text"
                className={`form-input ${tokenError ? 'input-error' : ''}`}
                placeholder="Dán mã reset token tại đây"
                value={token}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setToken(e.target.value)
                  if (tokenError) setTokenError('')
                }}
                disabled={resetLoading}
              />
              {tokenError && <span className="field-error">{tokenError}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reset-new-password" className="form-label">
                Mật khẩu mới (tối thiểu 6 ký tự) <span className="required-mark">*</span>
              </label>
              <input
                id="reset-new-password"
                type="password"
                className={`form-input ${newPasswordError ? 'input-error' : ''}`}
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setNewPassword(e.target.value)
                  if (newPasswordError) setNewPasswordError('')
                }}
                disabled={resetLoading}
              />
              {newPasswordError && <span className="field-error">{newPasswordError}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reset-confirm-password" className="form-label">
                Xác nhận mật khẩu mới <span className="required-mark">*</span>
              </label>
              <input
                id="reset-confirm-password"
                type="password"
                className={`form-input ${confirmPasswordError ? 'input-error' : ''}`}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setConfirmPassword(e.target.value)
                  if (confirmPasswordError) setConfirmPasswordError('')
                }}
                disabled={resetLoading}
              />
              {confirmPasswordError && <span className="field-error">{confirmPasswordError}</span>}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={resetLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                id="btn-reset-password-submit"
                className="btn btn-primary"
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <span className="btn-loading-content">
                    <span className="spinner" />
                    <span>Đang cập nhật...</span>
                  </span>
                ) : (
                  'Lưu mật khẩu mới'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
