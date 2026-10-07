import { useState, useEffect, useCallback, type FormEvent } from 'react'
import {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../services/subjectService'
import type {
  SubjectResponse,
  SubjectCreate,
  SubjectUpdate,
} from '../types/subject'
import { useAuth } from '../context/useAuth'
import { useNotification } from '../context/useNotification'

export default function SubjectsView() {
  const { hasPermission } = useAuth()
  const { showSuccess, showError } = useNotification()

  const canManage = hasPermission('subject:manage')

  // Subject list state
  const [subjects, setSubjects] = useState<SubjectResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<SubjectResponse | null>(null)
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formHours, setFormHours] = useState<number>(0)
  const [formStatus, setFormStatus] = useState('ACTIVE')
  const [submitting, setSubmitting] = useState(false)

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<SubjectResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchSubjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listSubjects({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      })
      setSubjects(res.items || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách môn học.'
      setError(msg)
      showError(msg)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, showError])

  useEffect(() => {
    let cancelled = false
    listSubjects({
      search: search.trim() || undefined,
      status: statusFilter || undefined,
    })
      .then((res) => {
        if (!cancelled) {
          setSubjects(res.items || [])
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Không thể tải danh sách môn học.'
          setError(msg)
          showError(msg)
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
  }, [search, statusFilter, showError])

  const handleOpenCreate = () => {
    setEditingSubject(null)
    setFormCode('')
    setFormName('')
    setFormDescription('')
    setFormHours(0)
    setFormStatus('ACTIVE')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (sub: SubjectResponse) => {
    setEditingSubject(sub)
    setFormCode(sub.code)
    setFormName(sub.name)
    setFormDescription(sub.description || '')
    setFormHours(sub.hours || 0)
    setFormStatus(sub.status)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      showError('Tên môn học không được để trống.')
      return
    }

    setSubmitting(true)
    try {
      if (editingSubject) {
        const payload: SubjectUpdate = {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          hours: Number(formHours),
          status: formStatus,
        }
        await updateSubject(editingSubject.id, payload)
        showSuccess(`Cập nhật môn học "${formName}" thành công!`)
      } else {
        if (!formCode.trim()) {
          showError('Mã môn học không được để trống.')
          setSubmitting(false)
          return
        }
        const payload: SubjectCreate = {
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          hours: Number(formHours),
          status: formStatus,
        }
        await createSubject(payload)
        showSuccess(`Tạo mới môn học "${formName}" thành công!`)
      }

      setIsModalOpen(false)
      void fetchSubjects()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lưu môn học thất bại.'
      showError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteSubject(deleteTarget.id)
      showSuccess(`Đã xóa môn học "${deleteTarget.name}".`)
      setDeleteTarget(null)
      void fetchSubjects()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa môn học thất bại.'
      showError(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="management-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Quản lý môn học</h2>
          <p className="page-subtitle">
            Danh mục các môn học, chuyên đề giảng dạy trong các chương trình đào tạo
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            id="btn-create-subject"
            className="btn btn-primary"
            onClick={handleOpenCreate}
          >
            + Thêm môn học mới
          </button>
        )}
      </header>

      {/* FILTER & SEARCH */}
      <section className="filter-card">
        <div className="filter-form">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-input search-input"
              placeholder="Tìm theo mã hoặc tên môn học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <div className="filter-item">
              <label htmlFor="sub-status-filter" className="filter-label">Trạng thái:</label>
              <select
                id="sub-status-filter"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="INACTIVE">Tạm dừng (INACTIVE)</option>
              </select>
            </div>

            {(search || statusFilter) && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('')
                }}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ERROR STATE */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <p>{error}</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => void fetchSubjects()}>
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="loading-state">
          <div className="spinner-border text-primary" role="status" />
          <p>Đang tải danh sách môn học...</p>
        </div>
      )}

      {/* TABLE DATA */}
      {!loading && !error && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Mã môn</th>
                <th>Tên môn học</th>
                <th style={{ width: '120px' }}>Thời lượng</th>
                <th style={{ width: '140px' }}>Trạng thái</th>
                {canManage && <th style={{ width: '150px', textAlign: 'center' }}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="text-center empty-cell">
                    <div className="empty-state-box">
                      <span className="empty-icon">📖</span>
                      <p>Không tìm thấy môn học nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                subjects.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <code className="code-badge">{sub.code}</code>
                    </td>
                    <td>
                      <div className="item-main-info">
                        <strong>{sub.name}</strong>
                        {sub.description && (
                          <span className="item-sub-desc">{sub.description}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong>{sub.hours}</strong> giờ
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          sub.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'
                        }`}
                      >
                        {sub.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    {canManage && (
                      <td>
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenEdit(sub)}
                            title="Chỉnh sửa thông tin"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteTarget(sub)}
                            title="Xóa môn học"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <header className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon-badge">📖</span>
                <h3 className="modal-title">
                  {editingSubject ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                ×
              </button>
            </header>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="sub-code" className="form-label">
                    Mã môn học <span className="text-danger">*</span>
                  </label>
                  <input
                    id="sub-code"
                    type="text"
                    className="form-input"
                    placeholder="VD: SUB-JS-01"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    disabled={Boolean(editingSubject) || submitting}
                    required
                  />
                  {editingSubject && (
                    <span className="form-hint">Mã môn học không thể sửa sau khi đã tạo.</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="sub-name" className="form-label">
                    Tên môn học <span className="text-danger">*</span>
                  </label>
                  <input
                    id="sub-name"
                    type="text"
                    className="form-input"
                    placeholder="VD: Javascript cơ bản & ES6+"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sub-hours" className="form-label">
                      Số giờ học
                    </label>
                    <input
                      id="sub-hours"
                      type="number"
                      min={0}
                      className="form-input"
                      value={formHours}
                      onChange={(e) => setFormHours(Number(e.target.value))}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="sub-status" className="form-label">
                      Trạng thái
                    </label>
                    <select
                      id="sub-status"
                      className="form-select"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      disabled={submitting}
                    >
                      <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                      <option value="INACTIVE">Tạm dừng (INACTIVE)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="sub-desc" className="form-label">
                    Mô tả môn học
                  </label>
                  <textarea
                    id="sub-desc"
                    className="form-textarea"
                    rows={3}
                    placeholder="Mô tả nội dung môn học và kiến thức trọng tâm..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <footer className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : editingSubject ? 'Lưu cập nhật' : 'Tạo môn học'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-sm">
            <header className="modal-header">
              <h3 className="modal-title text-danger">Xác nhận xóa môn học</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                ×
              </button>
            </header>
            <div className="modal-body">
              <p>
                Bạn có chắc chắn muốn xóa môn học <strong>{deleteTarget.name}</strong> (
                <code>{deleteTarget.code}</code>)? Thao tác này không thể hoàn tác.
              </p>
            </div>
            <footer className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
