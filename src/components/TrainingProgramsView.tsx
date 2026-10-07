import { useState, useEffect, useCallback, type FormEvent } from 'react'
import {
  listPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  listAttachedSubjects,
  attachSubjectToProgram,
  detachSubjectFromProgram,
} from '../services/trainingProgramService'
import { listSubjects } from '../services/subjectService'
import type {
  TrainingProgramResponse,
  TrainingProgramCreate,
  TrainingProgramUpdate,
  AttachedSubjectResponse,
} from '../types/trainingProgram'
import type { SubjectResponse } from '../types/subject'
import { useAuth } from '../context/useAuth'
import { useNotification } from '../context/useNotification'

export default function TrainingProgramsView() {
  const { hasPermission } = useAuth()
  const { showSuccess, showError } = useNotification()

  const canManage = hasPermission('program:manage')

  // Program list state
  const [programs, setPrograms] = useState<TrainingProgramResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<TrainingProgramResponse | null>(null)
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDuration, setFormDuration] = useState<number>(0)
  const [formStatus, setFormStatus] = useState('ACTIVE')
  const [submitting, setSubmitting] = useState(false)

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<TrainingProgramResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Attach subjects modal state (S2-06)
  const [attachModalProgram, setAttachModalProgram] = useState<TrainingProgramResponse | null>(null)
  const [attachedSubjects, setAttachedSubjects] = useState<AttachedSubjectResponse[]>([])
  const [allSubjects, setAllSubjects] = useState<SubjectResponse[]>([])
  const [loadingAttached, setLoadingAttached] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('')
  const [attachOrderIndex, setAttachOrderIndex] = useState<number>(0)
  const [attachIsMandatory, setAttachIsMandatory] = useState<boolean>(true)
  const [attaching, setAttaching] = useState(false)

  const fetchPrograms = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listPrograms({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      })
      setPrograms(res.items || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách chương trình đào tạo.'
      setError(msg)
      showError(msg)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, showError])

  useEffect(() => {
    let cancelled = false
    listPrograms({
      search: search.trim() || undefined,
      status: statusFilter || undefined,
    })
      .then((res) => {
        if (!cancelled) {
          setPrograms(res.items || [])
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Không thể tải danh sách chương trình đào tạo.'
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

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProgram(null)
    setFormCode('')
    setFormName('')
    setFormDescription('')
    setFormDuration(0)
    setFormStatus('ACTIVE')
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (prog: TrainingProgramResponse) => {
    setEditingProgram(prog)
    setFormCode(prog.code)
    setFormName(prog.name)
    setFormDescription(prog.description || '')
    setFormDuration(prog.duration_hours || 0)
    setFormStatus(prog.status)
    setIsModalOpen(true)
  }

  // Save Program (Create / Edit)
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      showError('Tên chương trình đào tạo không được để trống.')
      return
    }

    setSubmitting(true)
    try {
      if (editingProgram) {
        const payload: TrainingProgramUpdate = {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          duration_hours: Number(formDuration),
          status: formStatus,
        }
        await updateProgram(editingProgram.id, payload)
        showSuccess(`Cập nhật chương trình "${formName}" thành công!`)
      } else {
        if (!formCode.trim()) {
          showError('Mã chương trình đào tạo không được để trống.')
          setSubmitting(false)
          return
        }
        const payload: TrainingProgramCreate = {
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          duration_hours: Number(formDuration),
          status: formStatus,
        }
        await createProgram(payload)
        showSuccess(`Tạo mới chương trình "${formName}" thành công!`)
      }

      setIsModalOpen(false)
      void fetchPrograms()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lưu chương trình đào tạo thất bại.'
      showError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Program
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProgram(deleteTarget.id)
      showSuccess(`Đã xóa chương trình đào tạo "${deleteTarget.name}".`)
      setDeleteTarget(null)
      void fetchPrograms()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa chương trình thất bại.'
      showError(msg)
    } finally {
      setDeleting(false)
    }
  }

  // ==========================================
  // S2-06: ATTACH / DETACH SUBJECTS
  // ==========================================

  const handleOpenAttachModal = async (prog: TrainingProgramResponse) => {
    setAttachModalProgram(prog)
    setLoadingAttached(true)
    setSelectedSubjectId('')
    setAttachOrderIndex(0)
    setAttachIsMandatory(true)

    try {
      const [attachedData, allSubjectsData] = await Promise.all([
        listAttachedSubjects(prog.id),
        listSubjects({ limit: 100 }),
      ])
      setAttachedSubjects(attachedData || [])
      setAllSubjects(allSubjectsData.items || [])
      setAttachOrderIndex((attachedData?.length || 0) + 1)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách môn học của chương trình.'
      showError(msg)
    } finally {
      setLoadingAttached(false)
    }
  }

  const handleAttachSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!attachModalProgram || selectedSubjectId === '') return

    // Prevent duplicate attach
    const isAlreadyAttached = attachedSubjects.some(
      (item) => item.subject_id === Number(selectedSubjectId)
    )
    if (isAlreadyAttached) {
      showError('Môn học này đã được gắn vào chương trình.')
      return
    }

    setAttaching(true)
    try {
      const newAttached = await attachSubjectToProgram(attachModalProgram.id, {
        subject_id: Number(selectedSubjectId),
        order_index: Number(attachOrderIndex),
        is_mandatory: attachIsMandatory,
      })
      showSuccess(`Đã gắn môn học "${newAttached.subject?.name || ''}" vào chương trình!`)
      setAttachedSubjects((prev) => [...prev, newAttached])
      setSelectedSubjectId('')
      setAttachOrderIndex(attachedSubjects.length + 2)
      void fetchPrograms()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gắn môn học thất bại.'
      showError(msg)
    } finally {
      setAttaching(false)
    }
  }

  const handleDetachSubject = async (subjectId: number, subjectName: string) => {
    if (!attachModalProgram) return
    if (!confirm(`Bạn có chắc muốn gỡ môn học "${subjectName}" khỏi chương trình này?`)) {
      return
    }

    try {
      await detachSubjectFromProgram(attachModalProgram.id, subjectId)
      showSuccess(`Đã gỡ môn học "${subjectName}" khỏi chương trình.`)
      setAttachedSubjects((prev) => prev.filter((item) => item.subject_id !== subjectId))
      void fetchPrograms()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gỡ môn học thất bại.'
      showError(msg)
    }
  }

  // Available subjects to attach (exclude already attached)
  const availableToAttach = allSubjects.filter(
    (sub) => !attachedSubjects.some((att) => att.subject_id === sub.id)
  )

  return (
    <div className="management-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Quản lý chương trình đào tạo</h2>
          <p className="page-subtitle">
            Thiết lập danh mục các chương trình đào tạo và phân bổ môn học giảng dạy
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            id="btn-create-program"
            className="btn btn-primary"
            onClick={handleOpenCreate}
          >
            + Thêm chương trình mới
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
              placeholder="Tìm theo mã hoặc tên chương trình..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <div className="filter-item">
              <label htmlFor="prog-status-filter" className="filter-label">Trạng thái:</label>
              <select
                id="prog-status-filter"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="INACTIVE">Tạm dừng (INACTIVE)</option>
                <option value="DRAFT">Bản nháp (DRAFT)</option>
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
            <button type="button" className="btn btn-outline btn-sm" onClick={() => void fetchPrograms()}>
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="loading-state">
          <div className="spinner-border text-primary" role="status" />
          <p>Đang tải danh sách chương trình đào tạo...</p>
        </div>
      )}

      {/* TABLE DATA */}
      {!loading && !error && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Mã CTĐT</th>
                <th>Tên chương trình đào tạo</th>
                <th style={{ width: '120px' }}>Thời lượng</th>
                <th style={{ width: '140px' }}>Số môn học</th>
                <th style={{ width: '140px' }}>Trạng thái</th>
                <th style={{ width: '180px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {programs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center empty-cell">
                    <div className="empty-state-box">
                      <span className="empty-icon">📁</span>
                      <p>Không tìm thấy chương trình đào tạo nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                programs.map((prog) => (
                  <tr key={prog.id}>
                    <td>
                      <code className="code-badge">{prog.code}</code>
                    </td>
                    <td>
                      <div className="item-main-info">
                        <strong>{prog.name}</strong>
                        {prog.description && (
                          <span className="item-sub-desc">{prog.description}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong>{prog.duration_hours}</strong> giờ
                    </td>
                    <td>
                      <button
                        type="button"
                        className="badge badge-info btn-badge-link"
                        onClick={() => void handleOpenAttachModal(prog)}
                        title="Xem và quản lý các môn học gắn với chương trình"
                      >
                        📚 {prog.program_subjects?.length || 0} môn học
                      </button>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          prog.status === 'ACTIVE'
                            ? 'badge-success'
                            : prog.status === 'DRAFT'
                            ? 'badge-warning'
                            : 'badge-secondary'
                        }`}
                      >
                        {prog.status === 'ACTIVE'
                          ? 'Đang mở'
                          : prog.status === 'DRAFT'
                          ? 'Bản nháp'
                          : 'Tạm dừng'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-group">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => void handleOpenAttachModal(prog)}
                          title="Gắn / gỡ môn học"
                        >
                          Môn học
                        </button>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleOpenEdit(prog)}
                              title="Chỉnh sửa thông tin"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeleteTarget(prog)}
                              title="Xóa chương trình"
                            >
                              Xóa
                            </button>
                          </>
                        )}
                      </div>
                    </td>
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
                <span className="modal-icon-badge">🎓</span>
                <h3 className="modal-title">
                  {editingProgram ? 'Chỉnh sửa chương trình đào tạo' : 'Thêm chương trình đào tạo mới'}
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
                  <label htmlFor="prog-code" className="form-label">
                    Mã chương trình <span className="text-danger">*</span>
                  </label>
                  <input
                    id="prog-code"
                    type="text"
                    className="form-input"
                    placeholder="VD: PROG-IT-01"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    disabled={Boolean(editingProgram) || submitting}
                    required
                  />
                  {editingProgram && (
                    <span className="form-hint">Mã chương trình không thể sửa sau khi đã tạo.</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="prog-name" className="form-label">
                    Tên chương trình <span className="text-danger">*</span>
                  </label>
                  <input
                    id="prog-name"
                    type="text"
                    className="form-input"
                    placeholder="VD: Lập trình Fullstack Web hiện đại"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="prog-duration" className="form-label">
                      Tổng thời lượng (giờ)
                    </label>
                    <input
                      id="prog-duration"
                      type="number"
                      min={0}
                      className="form-input"
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="prog-status" className="form-label">
                      Trạng thái
                    </label>
                    <select
                      id="prog-status"
                      className="form-select"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      disabled={submitting}
                    >
                      <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                      <option value="INACTIVE">Tạm dừng (INACTIVE)</option>
                      <option value="DRAFT">Bản nháp (DRAFT)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="prog-desc" className="form-label">
                    Mô tả chương trình
                  </label>
                  <textarea
                    id="prog-desc"
                    className="form-textarea"
                    rows={3}
                    placeholder="Mô tả mục tiêu đầu ra và nội dung đào tạo..."
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
                  {submitting ? 'Đang lưu...' : editingProgram ? 'Lưu cập nhật' : 'Tạo chương trình'}
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
              <h3 className="modal-title text-danger">Xác nhận xóa chương trình</h3>
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
                Bạn có chắc chắn muốn xóa chương trình đào tạo <strong>{deleteTarget.name}</strong> (
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

      {/* S2-06: ATTACH / DETACH SUBJECTS MODAL */}
      {attachModalProgram && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-lg">
            <header className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon-badge">📚</span>
                <div>
                  <h3 className="modal-title">Danh sách môn học trong chương trình</h3>
                  <p className="modal-subtitle">
                    Chương trình: <strong>{attachModalProgram.name}</strong> (<code>{attachModalProgram.code}</code>)
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setAttachModalProgram(null)}
              >
                ×
              </button>
            </header>

            <div className="modal-body">
              {/* Form Attach New Subject */}
              {canManage && (
                <div className="attach-form-card">
                  <h4 className="attach-form-title">+ Gắn môn học vào chương trình</h4>
                  <form onSubmit={handleAttachSubmit} className="attach-form-grid">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label htmlFor="select-attach-sub" className="form-label">
                        Chọn môn học:
                      </label>
                      <select
                        id="select-attach-sub"
                        className="form-select"
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : '')}
                        disabled={attaching}
                        required
                      >
                        <option value="">-- Chọn môn học có sẵn --</option>
                        {availableToAttach.map((s) => (
                          <option key={s.id} value={s.id}>
                            [{s.code}] {s.name} ({s.hours} giờ)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="input-attach-order" className="form-label">
                        Thứ tự:
                      </label>
                      <input
                        id="input-attach-order"
                        type="number"
                        min={0}
                        className="form-input"
                        value={attachOrderIndex}
                        onChange={(e) => setAttachOrderIndex(Number(e.target.value))}
                        disabled={attaching}
                      />
                    </div>

                    <div className="form-group-checkbox" style={{ alignSelf: 'flex-end', paddingBottom: '0.75rem' }}>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={attachIsMandatory}
                          onChange={(e) => setAttachIsMandatory(e.target.checked)}
                          disabled={attaching}
                        />
                        <span>Môn bắt buộc</span>
                      </label>
                    </div>

                    <div style={{ alignSelf: 'flex-end', paddingBottom: '0.5rem' }}>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={selectedSubjectId === '' || attaching}
                      >
                        {attaching ? 'Đang gắn...' : 'Gắn vào CTĐT'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Attached Subjects Table */}
              <h4 className="attached-list-title">
                Các môn học đã gắn ({attachedSubjects.length})
              </h4>

              {loadingAttached ? (
                <div className="loading-state">
                  <div className="spinner-border text-primary" role="status" />
                  <p>Đang tải môn học...</p>
                </div>
              ) : attachedSubjects.length === 0 ? (
                <div className="empty-state-box">
                  <p>Chương trình đào tạo này chưa được gắn môn học nào.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>Thứ tự</th>
                        <th style={{ width: '120px' }}>Mã môn</th>
                        <th>Tên môn học</th>
                        <th style={{ width: '100px' }}>Số giờ</th>
                        <th style={{ width: '130px' }}>Phân loại</th>
                        {canManage && <th style={{ width: '100px', textAlign: 'center' }}>Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {attachedSubjects
                        .slice()
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((item) => (
                          <tr key={item.id}>
                            <td>
                              <span className="badge badge-secondary">#{item.order_index}</span>
                            </td>
                            <td>
                              <code>{item.subject?.code}</code>
                            </td>
                            <td>
                              <strong>{item.subject?.name}</strong>
                            </td>
                            <td>{item.subject?.hours} giờ</td>
                            <td>
                              <span
                                className={`badge ${
                                  item.is_mandatory ? 'badge-primary' : 'badge-secondary'
                                }`}
                              >
                                {item.is_mandatory ? 'Bắt buộc' : 'Tự chọn'}
                              </span>
                            </td>
                            {canManage && (
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() =>
                                    void handleDetachSubject(
                                      item.subject_id,
                                      item.subject?.name || ''
                                    )
                                  }
                                  title="Gỡ môn khỏi chương trình"
                                >
                                  Gỡ
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <footer className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setAttachModalProgram(null)}
              >
                Đóng
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
