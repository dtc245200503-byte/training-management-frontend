import {
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import {
  updateUser,
} from '../services/userService'

import type {
  UserItem,
} from '../services/userService'


interface EditUserModalProps {
  user: UserItem
  onClose: () => void
  onUpdated: () => void
}


function EditUserModal({
  user,
  onClose,
  onUpdated,
}: EditUserModalProps) {
  const [fullName, setFullName] = useState(
    user.full_name,
  )

  const [email, setEmail] = useState(
    user.email,
  )

  const [phone, setPhone] = useState(
    user.phone || '',
  )

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)


  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      await updateUser(
        user.user_id,
        {
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
        },
      )

      onUpdated()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(
          'Không thể cập nhật tài khoản.',
        )
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="modal-overlay">
      <div className="user-modal">
        <div className="modal-header">
          <div>
            <h2>Sửa tài khoản</h2>

            <p>
              Cập nhật thông tin tài khoản
              người dùng.
            </p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>


        <form onSubmit={handleSubmit}>
          <div className="modal-form-field">
            <label>
              Tên đăng nhập
            </label>

            <input
              type="text"
              value={user.username}
              disabled
            />
          </div>


          <div className="modal-form-field">
            <label htmlFor="edit-full-name">
              Họ và tên
            </label>

            <input
              id="edit-full-name"
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              required
            />
          </div>


          <div className="modal-form-field">
            <label htmlFor="edit-email">
              Email
            </label>

            <input
              id="edit-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />
          </div>


          <div className="modal-form-field">
            <label htmlFor="edit-phone">
              Số điện thoại
            </label>

            <input
              id="edit-phone"
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              placeholder="Nhập số điện thoại"
            />
          </div>


          {error && (
            <div className="user-error">
              {error}
            </div>
          )}


          <div className="modal-actions">
            <button
              type="button"
              className="modal-cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? 'Đang lưu...'
                : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


export default EditUserModal