import {
  useEffect,
  useState,
} from 'react'

import {
  getUsers,
} from '../services/userService'

import type {
  UserItem,
} from '../services/userService'

import type {
  CurrentUser,
} from '../types/auth'

import CreateUserModal from './CreateUserModal'
import EditUserModal from './EditUserModal'
import ErrorPage from './ErrorPage'


interface UserManagementPageProps {
  user: CurrentUser
}


function UserManagementPage({
  user,
}: UserManagementPageProps) {
  const [users, setUsers] = useState<UserItem[]>([])
  const [search, setSearch] = useState('')
  const [roleId, setRoleId] = useState('')
  const [status, setStatus] = useState('')

  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showCreateModal, setShowCreateModal] =
    useState(false)

  const [editingUser, setEditingUser] =
    useState<UserItem | null>(null)

  const [successMessage, setSuccessMessage] =
    useState('')

  const pageSize = 20


  const roleNames: Record<number, string> = {
    1: 'Quản trị viên',
    2: 'Giảng viên',
    3: 'Học viên',
    4: 'Kế toán',
    5: 'Quản lý đào tạo',
    6: 'Tuyển sinh',
    7: 'Giáo vụ',
    8: 'Ban quản lý',
  }


  const showSuccessToast = (
    message: string,
  ) => {
    setSuccessMessage(message)

    window.setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }


  const loadUsers = async (
    targetPage: number,
  ) => {
    setLoading(true)
    setError('')

    try {
      const result = await getUsers({
        search:
          search.trim() || undefined,

        role_id:
          roleId
            ? Number(roleId)
            : undefined,

        status:
          status || undefined,

        page: targetPage,
        page_size: pageSize,
      })

      setUsers(result.items)
      setTotal(result.total)
      setPage(result.page)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(
          'Không thể tải danh sách tài khoản.',
        )
      }
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadUsers(1)
  }, [])


  if (
    !user.permissions.includes('USER_MANAGE')
  ) {
    return (
      <ErrorPage
        statusCode={403}
        title="Không có quyền truy cập"
        message="Bạn không có quyền quản lý tài khoản."
      />
    )
  }


  const totalPages = Math.max(
    1,
    Math.ceil(total / pageSize),
  )


  const handleSearch = () => {
    setSuccessMessage('')
    loadUsers(1)
  }


  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Enter') {
      setSuccessMessage('')
      loadUsers(1)
    }
  }


  const handleCreated = async () => {
    setShowCreateModal(false)

    showSuccessToast(
      'Tạo tài khoản thành công. Mật khẩu tạm đã được gửi qua email.',
    )

    await loadUsers(1)
  }


  const handleUpdated = async () => {
    setEditingUser(null)

    showSuccessToast(
      'Cập nhật tài khoản thành công.',
    )

    await loadUsers(page)
  }


  return (
    <div className="user-management-page">
      <div className="user-page-header">
        <div>
          <h1>Quản lý tài khoản</h1>

          <p>
            Tạo, sửa và tìm kiếm tài khoản
            người dùng trong hệ thống.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setSuccessMessage('')
            setShowCreateModal(true)
          }}
        >
          + Tạo tài khoản
        </button>
      </div>


      {successMessage && (
        <div className="success-toast">
          <span className="success-toast-icon">
            ✓
          </span>

          <span>
            {successMessage}
          </span>
        </div>
      )}


      <div className="user-filters">
        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Tìm tên, email, số điện thoại..."
        />

        <select
          value={roleId}
          onChange={(event) =>
            setRoleId(event.target.value)
          }
        >
          <option value="">
            Tất cả vai trò
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
        </select>

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
        >
          <option value="">
            Tất cả trạng thái
          </option>

          <option value="active">
            Hoạt động
          </option>

          <option value="locked">
            Đã khóa
          </option>
        </select>

        <button
          type="button"
          className="search-button"
          onClick={handleSearch}
        >
          Tìm kiếm
        </button>
      </div>


      {error && (
        <div className="user-error">
          {error}
        </div>
      )}


      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="table-message"
                >
                  Đang tải...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="table-message"
                >
                  Không có tài khoản nào.
                </td>
              </tr>
            ) : (
              users.map((item) => (
                <tr key={item.user_id}>
                  <td>
                    {item.user_id}
                  </td>

                  <td>
                    {item.full_name}
                  </td>

                  <td>
                    {item.email}
                  </td>

                  <td>
                    {item.phone || '-'}
                  </td>

                  <td>
                    {roleNames[item.role_id]
                      || `Vai trò ${item.role_id}`}
                  </td>

                  <td>
                    <span
                      className={
                        item.status === 'active'
                          ? 'status-active'
                          : 'status-locked'
                      }
                    >
                      {item.status === 'active'
                        ? 'Hoạt động'
                        : 'Đã khóa'}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => {
                        setSuccessMessage('')
                        setEditingUser(item)
                      }}
                    >
                      Sửa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>


      <div className="pagination">
        <button
          type="button"
          disabled={
            page <= 1 || loading
          }
          onClick={() =>
            loadUsers(page - 1)
          }
        >
          ← Trước
        </button>

        <span>
          Trang {page} / {totalPages}
          {' '}
          ({total} tài khoản)
        </span>

        <button
          type="button"
          disabled={
            page >= totalPages || loading
          }
          onClick={() =>
            loadUsers(page + 1)
          }
        >
          Sau →
        </button>
      </div>


      {showCreateModal && (
        <CreateUserModal
          onClose={() =>
            setShowCreateModal(false)
          }
          onCreated={handleCreated}
        />
      )}


      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() =>
            setEditingUser(null)
          }
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}


export default UserManagementPage