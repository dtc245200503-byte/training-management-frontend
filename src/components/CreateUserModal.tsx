import ChoiceSelect from './ChoiceSelect'
import {
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import {
  createUser,
} from '../services/userService'


interface CreateUserModalProps {
  onClose: () => void
  onCreated: () => void
}


function CreateUserModal({
  onClose,
  onCreated,
}: CreateUserModalProps) {
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [roleId, setRoleId] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)


  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError('')

    if (!roleId) {
      setError('Vui lòng chọn vai trò.')
      return
    }

    setLoading(true)

    try {
      await createUser({
        username: username.trim(),
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role_id: Number(roleId),
      })

      onCreated()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(
          'Không thể tạo tài khoản.',
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
            <h2>Tạo tài khoản</h2>

            <p>
              Tạo tài khoản mới cho người dùng.
              Mật khẩu tạm sẽ được gửi qua email.
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
            <label htmlFor="create-username">
              Tên đăng nhập
            </label>

            <input
              id="create-username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>


          <div className="modal-form-field">
            <label htmlFor="create-full-name">
              Họ và tên
            </label>

            <input
              id="create-full-name"
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              placeholder="Nhập họ và tên"
              required
            />
          </div>


          <div className="modal-form-field">
            <label htmlFor="create-email">
              Email
            </label>

            <input
              id="create-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Nhập địa chỉ email"
              required
            />
          </div>


          <div className="modal-form-field">
            <label htmlFor="create-phone">
              Số điện thoại
            </label>

            <input
              id="create-phone"
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              placeholder="Nhập số điện thoại"
            />
          </div>


          <div className="modal-form-field">
            <label htmlFor="create-role">
              Vai trò
            </label>

            <ChoiceSelect
              id="create-role"
              value={roleId}
              onChange={(event) =>
                setRoleId(event.target.value)
              }
              required
            >
              <option value="">
                -- Chọn vai trò --
              </option>

              <option value="1">
                Quản trị viên
              </option>

              <option value="2">
                Giảng viên
              </option>

              <option value="3">
                Học viên
              </option>

              <option value="4">
                Kế toán
              </option>

              <option value="5">
                Quản lý đào tạo
              </option>

              <option value="6">
                Tuyển sinh
              </option>

              <option value="7">
                Giáo vụ
              </option>

              <option value="8">
                Ban quản lý
              </option>
            </ChoiceSelect>
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
                ? 'Đang tạo...'
                : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


export default CreateUserModal