import { useState, useEffect, useCallback, type FormEvent } from 'react'
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  assignRoles,
  revokeRole,
  lockUser,
  unlockUser,
} from '../services/userService'
import { getRoles } from '../services/roleService'
import type { UserDetail, UserCreateRequest, UserUpdateRequest } from '../types/user'
import type { RoleItem } from '../types/role'
import { useAuth } from '../context/useAuth'
import { useNotification } from '../context/useNotification'

const PAGE_SIZE = 10
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function UserManagement() {
  const { user: currentUser, hasPermission } = useAuth()
  const { showSuccess, showError } = useNotification()

  // Data states
  const [users, setUsers] = useState<UserDetail[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [availableRoles, setAvailableRoles] = useState<RoleItem[]>([])

  // Filter states
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all')
  const [lockFilter, setLockFilter] = useState<'all' | 'true' | 'false'>('all')

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isLockModalOpen, setIsLockModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Selected user for modals
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)

  // Form states - Create User
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createFullName, setCreateFullName] = useState('')
  const [createRoles, setCreateRoles] = useState<string[]>(['TRAINEE'])
  const [createIsActive, setCreateIsActive] = useState(true)
  const [createFormError, setCreateFormError] = useState('')
  const [createSubmitting, setCreateSubmitting] = useState(false)

  // Form states - Edit User
  const [editEmail, setEditEmail] = useState('')
  const [editFullName, setEditFullName] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editFormError, setEditFormError] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Form states - Role Assign
  const [targetRoles, setTargetRoles] = useState<string[]>([])
  const [roleSubmitting, setRoleSubmitting] = useState(false)

  // Form states - Lock User
  const [lockReason, setLockReason] = useState('')
  const [lockSubmitting, setLockSubmitting] = useState(false)

  // Check permissions
  const canCreate = hasPermission('user:create')
  const canUpdate = hasPermission('user:update')
  const canDelete = hasPermission('user:delete')
  const canLock = hasPermission('user:lock')
  const canAssignRole = hasPermission('role:assign')

  // Fetch users list for manual event handlers
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const skip = (page - 1) * PAGE_SIZE
      const res = await listUsers({
        skip,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        is_active: activeFilter === 'all' ? undefined : activeFilter === 'true',
        is_locked: lockFilter === 'all' ? undefined : lockFilter === 'true',
      })
      setUsers(res.items)
      setTotal(res.total)
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Không thể tải danh sách người dùng.')
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter, activeFilter, lockFilter, showError])

  // Fetch available roles once
  useEffect(() => {
    let cancelled = false
    getRoles()
      .then((res) => {
        if (!cancelled) setAvailableRoles(res.items || [])
      })
      .catch((err) => {
        console.warn('Could not load roles:', err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const skip = (page - 1) * PAGE_SIZE
    listUsers({
      skip,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      role: roleFilter || undefined,
      is_active: activeFilter === 'all' ? undefined : activeFilter === 'true',
      is_locked: lockFilter === 'all' ? undefined : lockFilter === 'true',
    })
      .then((res) => {
        if (!cancelled) {
          setUsers(res.items)
          setTotal(res.total)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          showError(err instanceof Error ? err.message : 'Không thể tải danh sách người dùng.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [page, search, roleFilter, activeFilter, lockFilter, showError])

  // Handle Search submit
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    setPage(1)
    void fetchUsers()
  }

  // CREATE USER
  const openCreateModal = () => {
    setCreateEmail('')
    setCreatePassword('')
    setCreateFullName('')
    setCreateRoles(['TRAINEE'])
    setCreateIsActive(true)
    setCreateFormError('')
    setIsCreateModalOpen(true)
  }

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setCreateFormError('')

    if (!createEmail.trim()) {
      setCreateFormError('Email là bắt buộc.')
      return
    }
    if (!EMAIL_REGEX.test(createEmail.trim())) {
      setCreateFormError('Email không đúng định dạng.')
      return
    }
    if (!createPassword || createPassword.length < 6) {
      setCreateFormError('Mật khẩu phải có tối thiểu 6 ký tự.')
      return
    }

    setCreateSubmitting(true)
    try {
      const payload: UserCreateRequest = {
        email: createEmail.trim(),
        password: createPassword,
        full_name: createFullName.trim() || undefined,
        roles: createRoles,
        is_active: createIsActive,
      }
      await createUser(payload)
      showSuccess(`Tạo tài khoản ${createEmail} thành công.`)
      setIsCreateModalOpen(false)
      void fetchUsers()
    } catch (err: unknown) {
      setCreateFormError(err instanceof Error ? err.message : 'Tạo người dùng thất bại.')
    } finally {
      setCreateSubmitting(false)
    }
  }

  // EDIT USER
  const openEditModal = (u: UserDetail) => {
    setSelectedUser(u)
    setEditEmail(u.email)
    setEditFullName(u.full_name || '')
    setEditIsActive(u.is_active)
    setEditFormError('')
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setEditFormError('')

    if (editEmail && !EMAIL_REGEX.test(editEmail.trim())) {
      setEditFormError('Email không đúng định dạng.')
      return
    }

    setEditSubmitting(true)
    try {
      const payload: UserUpdateRequest = {
        full_name: editFullName.trim() || undefined,
        email: editEmail.trim() !== selectedUser.email ? editEmail.trim() : undefined,
        is_active: editIsActive,
      }
      await updateUser(selectedUser.id, payload)
      showSuccess(`Cập nhật thông tin tài khoản ${selectedUser.email} thành công.`)
      setIsEditModalOpen(false)
      void fetchUsers()
    } catch (err: unknown) {
      setEditFormError(err instanceof Error ? err.message : 'Cập nhật người dùng thất bại.')
    } finally {
      setEditSubmitting(false)
    }
  }

  // DELETE USER
  const openDeleteModal = (u: UserDetail) => {
    setSelectedUser(u)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return
    try {
      await deleteUser(selectedUser.id)
      showSuccess(`Đã xóa tài khoản ${selectedUser.email}.`)
      setIsDeleteModalOpen(false)
      void fetchUsers()
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Không thể xóa tài khoản người dùng.')
    }
  }

  // S1-09: ASSIGN & REVOKE ROLES
  const openRoleModal = (u: UserDetail) => {
    setSelectedUser(u)
    setTargetRoles([...u.roles])
    setIsRoleModalOpen(true)
  }

  const toggleRole = (roleName: string) => {
    setTargetRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    )
  }

  const handleRoleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    if (targetRoles.length === 0) {
      showError('Người dùng phải có ít nhất một vai trò.')
      return
    }

    setRoleSubmitting(true)
    try {
      await assignRoles(selectedUser.id, targetRoles)
      showSuccess(`Cập nhật vai trò cho ${selectedUser.email} thành công.`)
      setIsRoleModalOpen(false)
      void fetchUsers()
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Phân vai trò thất bại.')
    } finally {
      setRoleSubmitting(false)
    }
  }

  const handleQuickRevokeRole = async (userItem: UserDetail, roleName: string) => {
    if (userItem.roles.length <= 1) {
      showError('Không thể thu hồi vai trò duy nhất của người dùng.')
      return
    }
    if (!confirm(`Bạn có chắc muốn thu hồi vai trò ${roleName} từ tài khoản ${userItem.email}?`)) {
      return
    }

    try {
      await revokeRole(userItem.id, roleName)
      showSuccess(`Đã thu hồi vai trò ${roleName} từ ${userItem.email}.`)
      void fetchUsers()
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Thu hồi vai trò thất bại.')
    }
  }

  // S1-10: LOCK & UNLOCK ACCOUNT
  const openLockModal = (u: UserDetail) => {
    setSelectedUser(u)
    setLockReason('')
    setIsLockModalOpen(true)
  }

  const handleLockSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setLockSubmitting(true)
    try {
      await lockUser(selectedUser.id, lockReason.trim() || undefined)
      showSuccess(`Đã khóa tài khoản ${selectedUser.email}. Tất cả phiên đăng nhập đã bị thu hồi.`)
      setIsLockModalOpen(false)
      void fetchUsers()
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Không thể khóa tài khoản.')
    } finally {
      setLockSubmitting(false)
    }
  }

  const handleUnlockUser = async (u: UserDetail) => {
    if (!confirm(`Bạn có chắc muốn mở khóa cho tài khoản ${u.email}?`)) {
      return
    }

    try {
      await unlockUser(u.id)
      showSuccess(`Đã mở khóa tài khoản ${u.email}. Người dùng có thể đăng nhập lại.`)
      void fetchUsers()
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Không thể mở khóa tài khoản.')
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  return (
    <div className="management-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Quản lý tài khoản người dùng</h2>
          <p className="page-subtitle">
            Xem, tìm kiếm, tạo mới, chỉnh sửa thông tin, phân quyền và khóa/mở khóa tài khoản.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            id="btn-create-user"
            className="btn btn-primary"
            onClick={openCreateModal}
          >
            + Thêm người dùng mới
          </button>
        )}
      </header>

      {/* FILTER & SEARCH BAR */}
      <section className="filter-card">
        <form onSubmit={handleSearchSubmit} className="filter-form">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-input search-input"
              placeholder="Tìm theo email hoặc họ tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-search">
              Tìm kiếm
            </button>
          </div>

          <div className="filter-controls">
            <div className="filter-item">
              <label htmlFor="role-select" className="filter-label">
                Vai trò:
              </label>
              <select
                id="role-select"
                className="form-select"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">Tất cả vai trò</option>
                <option value="ADMIN">ADMIN</option>
                <option value="TRAINER">TRAINER</option>
                <option value="TRAINEE">TRAINEE</option>
              </select>
            </div>

            <div className="filter-item">
              <label htmlFor="active-select" className="filter-label">
                Kích hoạt:
              </label>
              <select
                id="active-select"
                className="form-select"
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value as 'all' | 'true' | 'false')
                  setPage(1)
                }}
              >
                <option value="all">Tất cả</option>
                <option value="true">Đang kích hoạt</option>
                <option value="false">Tạm dừng</option>
              </select>
            </div>

            <div className="filter-item">
              <label htmlFor="lock-select" className="filter-label">
                Khóa tài khoản:
              </label>
              <select
                id="lock-select"
                className="form-select"
                value={lockFilter}
                onChange={(e) => {
                  setLockFilter(e.target.value as 'all' | 'true' | 'false')
                  setPage(1)
                }}
              >
                <option value="all">Tất cả</option>
                <option value="false">Bình thường</option>
                <option value="true">Đã khóa</option>
              </select>
            </div>
          </div>
        </form>
      </section>

      {/* USER TABLE */}
      <section className="table-card">
        {loading ? (
          <div className="table-loading">
            <span className="spinner" />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="table-empty">
            <p>Không tìm thấy người dùng nào phù hợp với điều kiện tìm kiếm.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table" aria-label="Danh sách tài khoản người dùng">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '60px' }}>ID</th>
                  <th scope="col">Email</th>
                  <th scope="col">Họ và tên</th>
                  <th scope="col">Vai trò</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Khóa tài khoản</th>
                  <th scope="col">Ngày tạo</th>
                  <th scope="col" className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id
                  return (
                    <tr key={u.id} className={u.is_locked ? 'row-locked' : ''}>
                      <td className="font-mono text-muted">{u.id}</td>
                      <td>
                        <strong>{u.email}</strong>
                        {isSelf && <span className="self-badge">Bạn</span>}
                      </td>
                      <td>{u.full_name || '—'}</td>
                      <td>
                        <div className="tags-list">
                          {u.roles.map((r) => (
                            <span key={r} className={`role-badge role-${r.toLowerCase()}`}>
                              {r}
                              {canAssignRole && u.roles.length > 1 && (
                                <button
                                  type="button"
                                  className="tag-remove-btn"
                                  onClick={() => handleQuickRevokeRole(u, r)}
                                  title={`Thu hồi vai trò ${r}`}
                                  aria-label={`Thu hồi vai trò ${r}`}
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${u.is_active ? 'pill-active' : 'pill-inactive'}`}>
                          {u.is_active ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td>
                        {u.is_locked ? (
                          <div className="lock-indicator locked" title={u.lock_reason ? `Lý do: ${u.lock_reason}` : 'Đã bị khóa'}>
                            <span className="lock-tag">🔒 Đã khóa</span>
                            {u.lock_reason && <span className="lock-reason-text">({u.lock_reason})</span>}
                          </div>
                        ) : (
                          <span className="lock-indicator unlocked">✓ Bình thường</span>
                        )}
                      </td>
                      <td className="text-muted text-sm">
                        {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="table-actions text-right">
                        {/* Edit */}
                        {canUpdate && (
                          <button
                            type="button"
                            className="action-btn action-edit"
                            onClick={() => openEditModal(u)}
                            title="Chỉnh sửa thông tin"
                          >
                            Sửa
                          </button>
                        )}

                        {/* Assign Role */}
                        {canAssignRole && (
                          <button
                            type="button"
                            className="action-btn action-role"
                            onClick={() => openRoleModal(u)}
                            title="Phân vai trò"
                          >
                            Vai trò
                          </button>
                        )}

                        {/* Lock / Unlock */}
                        {canLock && (
                          u.is_locked ? (
                            <button
                              type="button"
                              className="action-btn action-unlock"
                              onClick={() => handleUnlockUser(u)}
                              title="Mở khóa tài khoản"
                            >
                              Mở khóa
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="action-btn action-lock"
                              onClick={() => openLockModal(u)}
                              disabled={isSelf}
                              title={isSelf ? 'Không thể tự khóa tài khoản của chính mình' : 'Khóa tài khoản'}
                            >
                              Khóa
                            </button>
                          )
                        )}

                        {/* Delete */}
                        {canDelete && (
                          <button
                            type="button"
                            className="action-btn action-delete"
                            onClick={() => openDeleteModal(u)}
                            disabled={isSelf}
                            title={isSelf ? 'Không thể tự xóa tài khoản của chính mình' : 'Xóa tài khoản'}
                          >
                            Xóa
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        <div className="table-footer">
          <div className="pagination-info">
            Tổng số: <strong>{total}</strong> tài khoản — Trang {page} / {totalPages}
          </div>
          <div className="pagination-controls">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              « Trước
            </button>
            <span className="page-number">{page}</span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              Sau »
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          MODAL: CREATE USER
          ======================================================== */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
          <div className="modal-card">
            <header className="modal-header">
              <h2 id="create-user-title" className="modal-title">Tạo tài khoản người dùng mới</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
              >
                ×
              </button>
            </header>

            <form onSubmit={handleCreateSubmit} className="modal-form" noValidate>
              {createFormError && (
                <div className="login-alert login-alert-error" role="alert">
                  {createFormError}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="create-email" className="form-label">
                  Email đăng nhập <span className="required-mark">*</span>
                </label>
                <input
                  id="create-email"
                  type="email"
                  className="form-input"
                  placeholder="user@example.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  disabled={createSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="create-password" className="form-label">
                  Mật khẩu khởi tạo (tối thiểu 6 ký tự) <span className="required-mark">*</span>
                </label>
                <input
                  id="create-password"
                  type="password"
                  className="form-input"
                  placeholder="Mật khẩu ít nhất 6 ký tự"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  disabled={createSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="create-fullname" className="form-label">Họ và tên</label>
                <input
                  id="create-fullname"
                  type="text"
                  className="form-input"
                  placeholder="Nguyễn Văn A"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  disabled={createSubmitting}
                />
              </div>

              <div className="form-group">
                <span className="form-label">Vai trò gán cho tài khoản:</span>
                <div className="checkbox-group">
                  {['TRAINEE', 'TRAINER', 'ADMIN'].map((rName) => (
                    <label key={rName} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={createRoles.includes(rName)}
                        onChange={() => {
                          setCreateRoles((prev) =>
                            prev.includes(rName)
                              ? prev.filter((r) => r !== rName)
                              : [...prev, rName]
                          )
                        }}
                      />
                      <span>{rName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={createIsActive}
                    onChange={(e) => setCreateIsActive(e.target.checked)}
                  />
                  <span>Kích hoạt tài khoản ngay khi tạo</span>
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  id="btn-submit-create-user"
                  className="btn btn-primary"
                  disabled={createSubmitting}
                >
                  {createSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT USER
          ======================================================== */}
      {isEditModalOpen && selectedUser && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
          <div className="modal-card">
            <header className="modal-header">
              <h2 id="edit-user-title" className="modal-title">
                Chỉnh sửa tài khoản #{selectedUser.id}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                ×
              </button>
            </header>

            <form onSubmit={handleEditSubmit} className="modal-form" noValidate>
              {editFormError && (
                <div className="login-alert login-alert-error" role="alert">
                  {editFormError}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="edit-email" className="form-label">Email tài khoản</label>
                <input
                  id="edit-email"
                  type="email"
                  className="form-input"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  disabled={editSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-fullname" className="form-label">Họ và tên</label>
                <input
                  id="edit-fullname"
                  type="text"
                  className="form-input"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  disabled={editSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                  />
                  <span>Tài khoản đang hoạt động (Active)</span>
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  id="btn-submit-edit-user"
                  className="btn btn-primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: S1-09 ASSIGN / REVOKE ROLES
          ======================================================== */}
      {isRoleModalOpen && selectedUser && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="role-modal-title">
          <div className="modal-card">
            <header className="modal-header">
              <h2 id="role-modal-title" className="modal-title">
                Phân quyền vai trò: {selectedUser.email}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsRoleModalOpen(false)}
              >
                ×
              </button>
            </header>

            <form onSubmit={handleRoleSubmit} className="modal-form">
              <p className="modal-instruction">
                Chọn các vai trò áp dụng cho người dùng này. Người dùng có vai trò ADMIN sẽ sở hữu
                toàn quyền quản trị hệ thống.
              </p>

              <div className="roles-checklist">
                {(availableRoles.length > 0
                  ? availableRoles.map((r) => r.name)
                  : ['ADMIN', 'TRAINER', 'TRAINEE']
                ).map((roleName) => {
                  const isChecked = targetRoles.includes(roleName)
                  return (
                    <label key={roleName} className="role-checkbox-item">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRole(roleName)}
                      />
                      <div className="role-item-info">
                        <span className={`role-badge role-${roleName.toLowerCase()}`}>
                          {roleName}
                        </span>
                        <span className="role-desc-text">
                          {roleName === 'ADMIN' && 'Toàn quyền quản trị hệ thống, người dùng và dữ liệu.'}
                          {roleName === 'TRAINER' && 'Giảng viên/Chuyên viên phụ trách đào tạo, khóa học.'}
                          {roleName === 'TRAINEE' && 'Học viên tham gia học tập và xem khóa học của tôi.'}
                        </span>
                      </div>
                    </label>
                  )
                })}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRoleModalOpen(false)}
                  disabled={roleSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  id="btn-submit-roles"
                  className="btn btn-primary"
                  disabled={roleSubmitting}
                >
                  {roleSubmitting ? 'Đang lưu...' : 'Lưu phân quyền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: S1-10 LOCK ACCOUNT
          ======================================================== */}
      {isLockModalOpen && selectedUser && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="lock-modal-title">
          <div className="modal-card">
            <header className="modal-header">
              <h2 id="lock-modal-title" className="modal-title">
                Khóa tài khoản: {selectedUser.email}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsLockModalOpen(false)}
              >
                ×
              </button>
            </header>

            <form onSubmit={handleLockSubmit} className="modal-form">
              <div className="warning-banner">
                <strong>Cảnh báo bảo mật:</strong> Sau khi khóa, toàn bộ các phiên làm việc và
                refresh token của tài khoản này sẽ bị thu hồi ngay lập tức. Người dùng sẽ không thể
                tiếp tục đăng nhập.
              </div>

              <div className="form-group">
                <label htmlFor="lock-reason" className="form-label">
                  Lý do khóa tài khoản (tùy chọn)
                </label>
                <textarea
                  id="lock-reason"
                  className="form-input form-textarea"
                  rows={3}
                  placeholder="Ví dụ: Vi phạm chính sách đào tạo, tạm nghỉ việc..."
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  disabled={lockSubmitting}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsLockModalOpen(false)}
                  disabled={lockSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  id="btn-confirm-lock-user"
                  className="btn btn-danger"
                  disabled={lockSubmitting}
                >
                  {lockSubmitting ? 'Đang khóa...' : 'Xác nhận khóa tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: DELETE CONFIRMATION
          ======================================================== */}
      {isDeleteModalOpen && selectedUser && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="modal-card">
            <header className="modal-header">
              <h2 id="delete-modal-title" className="modal-title">
                Xác nhận xóa tài khoản
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                ×
              </button>
            </header>

            <div className="modal-body">
              <p>
                Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản{' '}
                <strong>{selectedUser.email}</strong> (#{selectedUser.id}) khỏi hệ thống? Thao tác
                này không thể hoàn tác.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                id="btn-confirm-delete-user"
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
              >
                Xóa người dùng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
