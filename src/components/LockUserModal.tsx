import {
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import {
  lockUser,
} from '../services/userService'

import type {
  ClassNeedHandover,
  UserItem,
} from '../services/userService'


interface LockUserModalProps {
  user: UserItem
  onClose: () => void
  onLocked: () => void
}


function LockUserModal({
  user,
  onClose,
  onLocked,
}: LockUserModalProps) {
  const [lockReason, setLockReason] =
    useState('')

  const [
    classesNeedHandover,
    setClassesNeedHandover,
  ] = useState<ClassNeedHandover[]>([])

  const [error, setError] = useState('')
  const [loading, setLoading] =
    useState(false)

  const [locked, setLocked] =
    useState(false)


  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError('')

    if (!lockReason.trim()) {
      setError(
        'Bắt buộc nhập lý do khóa tài khoản.',
      )
      return
    }

    setLoading(true)

    try {
      const result = await lockUser(
        user.user_id,
        lockReason.trim(),
      )

      setClassesNeedHandover(
        result.classes_need_handover,
      )

      setLocked(true)

      if (
        result.classes_need_handover.length === 0
      ) {
        onLocked()
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(
          'Không thể khóa tài khoản.',
        )
      }
    } finally {
      setLoading(false)
    }
  }


  if (locked) {
    return (
      <div className="modal-overlay">
        <div className="user-modal">
          <div className="modal-header">
            <div>
              <h2>Đã khóa tài khoản</h2>

              <p>
                Tài khoản của{' '}
                <strong>
                  {user.full_name}
                </strong>{' '}
                đã được khóa.
              </p>
            </div>
          </div>


          <div className="handover-warning">
            <strong>
              Cảnh báo cần bàn giao lớp học
            </strong>

            <p>
              Người dùng này đang phụ trách
              các lớp sau:
            </p>

            <ul>
              {classesNeedHandover.map(
                (item) => (
                  <li key={item.class_id}>
                    {item.class_name}
                  </li>
                ),
              )}
            </ul>

            <p>
              Cần bàn giao các lớp trên cho
              giảng viên khác.
            </p>
          </div>


          <div className="modal-actions">
            <button
              type="button"
              className="primary-button"
              onClick={onLocked}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="modal-overlay">
      <div className="user-modal">
        <div className="modal-header">
          <div>
            <h2>Khóa tài khoản</h2>

            <p>
              Bạn đang khóa tài khoản của{' '}
              <strong>
                {user.full_name}
              </strong>.
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
          <div className="lock-account-warning">
            Sau khi khóa, người dùng sẽ không
            thể tiếp tục truy cập hệ thống và
            các phiên đăng nhập hiện tại sẽ bị
            thu hồi.
          </div>


          <div className="modal-form-field">
            <label htmlFor="lock-reason">
              Lý do khóa
            </label>

            <textarea
              id="lock-reason"
              value={lockReason}
              onChange={(event) =>
                setLockReason(
                  event.target.value,
                )
              }
              placeholder="Nhập lý do khóa tài khoản"
              maxLength={255}
              rows={4}
              required
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
              className="lock-user-button"
              disabled={loading}
            >
              {loading
                ? 'Đang khóa...'
                : 'Khóa tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


export default LockUserModal