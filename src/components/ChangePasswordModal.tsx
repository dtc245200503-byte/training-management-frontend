import { useState, type FormEvent, type ChangeEvent } from 'react'
import { changePassword } from '../services/authService'
import { useAuth } from '../context/useAuth'
import { useNotification } from '../context/useNotification'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { logout } = useAuth()
  const { showSuccess, showError } = useNotification()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [oldPasswordError, setOldPasswordError] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const validate = (): boolean => {
    let valid = true

    if (!oldPassword) {
      setOldPasswordError('Mật khẩu hiện tại là bắt buộc.')
      valid = false
    } else {
      setOldPasswordError('')
    }

    if (!newPassword) {
      setNewPasswordError('Mật khẩu mới là bắt buộc.')
      valid = false
    } else if (newPassword.length < 6) {
      setNewPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự.')
      valid = false
    } else if (newPassword === oldPassword) {
      setNewPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại.')
      valid = false
    } else {
      setNewPasswordError('')
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Vui lòng xác nhận lại mật khẩu mới.')
      valid = false
    } else if (confirmPassword !== newPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp.')
      valid = false
    } else {
      setConfirmPasswordError('')
    }

    return valid
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGeneralError('')

    if (!validate()) return

    setLoading(true)

    try {
      const res = await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })

      showSuccess(res.message || 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.')
      onClose()

      // Session revoked on backend contract -> logout on client
      await logout()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setGeneralError(err.message)
      } else {
        setGeneralError('Đổi mật khẩu thất bại. Vui lòng thử lại.')
      }
      showError(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="change-pwd-title">
      <div className="modal-card">
        <header className="modal-header">
          <h2 id="change-pwd-title" className="modal-title">
            Đổi mật khẩu tài khoản
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

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          <p className="modal-instruction">
            Nhập mật khẩu hiện tại và thiết lập mật khẩu mới (tối thiểu 6 ký tự). Sau khi đổi mật
            khẩu, các phiên đăng nhập khác sẽ được bảo mật đăng xuất.
          </p>

          {generalError && (
            <div className="login-alert login-alert-error" role="alert">
              {generalError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="current-password" className="form-label">
              Mật khẩu hiện tại <span className="required-mark">*</span>
            </label>
            <input
              id="current-password"
              type="password"
              className={`form-input ${oldPasswordError ? 'input-error' : ''}`}
              placeholder="Nhập mật khẩu hiện tại"
              value={oldPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setOldPassword(e.target.value)
                if (oldPasswordError) setOldPasswordError('')
                if (generalError) setGeneralError('')
              }}
              disabled={loading}
            />
            {oldPasswordError && <span className="field-error">{oldPasswordError}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="new-password" className="form-label">
              Mật khẩu mới (tối thiểu 6 ký tự) <span className="required-mark">*</span>
            </label>
            <input
              id="new-password"
              type="password"
              className={`form-input ${newPasswordError ? 'input-error' : ''}`}
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setNewPassword(e.target.value)
                if (newPasswordError) setNewPasswordError('')
                if (generalError) setGeneralError('')
              }}
              disabled={loading}
            />
            {newPasswordError && <span className="field-error">{newPasswordError}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirm-new-password" className="form-label">
              Xác nhận mật khẩu mới <span className="required-mark">*</span>
            </label>
            <input
              id="confirm-new-password"
              type="password"
              className={`form-input ${confirmPasswordError ? 'input-error' : ''}`}
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setConfirmPassword(e.target.value)
                if (confirmPasswordError) setConfirmPasswordError('')
                if (generalError) setGeneralError('')
              }}
              disabled={loading}
            />
            {confirmPasswordError && <span className="field-error">{confirmPasswordError}</span>}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              id="btn-change-password-submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading-content">
                  <span className="spinner" />
                  <span>Đang xử lý...</span>
                </span>
              ) : (
                'Cập nhật mật khẩu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
