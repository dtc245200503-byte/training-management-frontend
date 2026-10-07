import { useState, useEffect, useCallback, type FormEvent } from 'react'
import {
  listSessions,
  createSession,
  updateSession,
  deleteSession,
} from '../services/trainingSessionService'
import { listPrograms } from '../services/trainingProgramService'
import { listSubjects } from '../services/subjectService'
import { listUsers } from '../services/userService'
import type {
  TrainingSessionResponse,
  TrainingSessionCreate,
  TrainingSessionUpdate,
} from '../types/trainingSession'
import type { TrainingProgramResponse } from '../types/trainingProgram'
import type { SubjectResponse } from '../types/subject'
import type { UserDetail } from '../types/user'
import { useAuth } from '../context/useAuth'
import { useNotification } from '../context/useNotification'

export default function TrainingSessionsView() {
  const { hasPermission } = useAuth()
  const { showSuccess, showError } = useNotification()

  const canManage = hasPermission('session:manage')

  // Sessions state
  const [sessions, setSessions] = useState<TrainingSessionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [programFilter, setProgramFilter] = useState<number | ''>('')
  const [subjectFilter, setSubjectFilter] = useState<number | ''>('')
  const [trainerFilter, setTrainerFilter] = useState<number | ''>('')

  // Auxiliary data for dropdowns
  const [programsList, setProgramsList] = useState<TrainingProgramResponse[]>([])
  const [subjectsList, setSubjectsList] = useState<SubjectResponse[]>([])
  const [trainersList, setTrainersList] = useState<UserDetail[]>([])

  // Modal Create / Edit state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<TrainingSessionResponse | null>(null)
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formProgramId, setFormProgramId] = useState<number | ''>('')
  const [formSubjectId, setFormSubjectId] = useState<number | ''>('')
  const [formTrainerId, setFormTrainerId] = useState<number | ''>('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formMaxTrainees, setFormMaxTrainees] = useState<number>(30)
  const [formStatus, setFormStatus] = useState('SCHEDULED')
  const [submitting, setSubmitting] = useState(false)

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<TrainingSessionResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Load auxiliary lists on mount
  useEffect(() => {
    let cancelled = false
    Promise.all([
      listPrograms({ limit: 100 }),
      listSubjects({ limit: 100 }),
      listUsers({ limit: 100 }),
    ])
      .then(([progRes, subRes, userRes]) => {
        if (cancelled) return
        setProgramsList(progRes.items || [])
        setSubjectsList(subRes.items || [])
        // Lọc giảng viên hoặc người có quyền giảng dạy
        const instructors = (userRes.items || []).filter(
          (u) => u.roles.includes('TRAINER') || u.roles.includes('ADMIN')
        )
        setTrainersList(instructors.length > 0 ? instructors : userRes.items || [])
      })
      .catch((err) => {
        console.warn('Failed to load auxiliary filter data for sessions:', err)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listSessions({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        program_id: programFilter !== '' ? Number(programFilter) : undefined,
        subject_id: subjectFilter !== '' ? Number(subjectFilter) : undefined,
        trainer_id: trainerFilter !== '' ? Number(trainerFilter) : undefined,
      })
      setSessions(res.items || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách lớp đào tạo.'
      setError(msg)
      showError(msg)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, programFilter, subjectFilter, trainerFilter, showError])

  useEffect(() => {
    let cancelled = false
    listSessions({
      search: search.trim() || undefined,
      status: statusFilter || undefined,
      program_id: programFilter !== '' ? Number(programFilter) : undefined,
      subject_id: subjectFilter !== '' ? Number(subjectFilter) : undefined,
      trainer_id: trainerFilter !== '' ? Number(trainerFilter) : undefined,
    })
      .then((res) => {
        if (!cancelled) {
          setSessions(res.items || [])
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Không thể tải danh sách lớp đào tạo.'
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
  }, [search, statusFilter, programFilter, subjectFilter, trainerFilter, showError])

  // Convert ISO string to format YYYY-MM-DDTHH:mm for datetime-local input
  const formatForDateTimeInput = (isoString?: string | null): string => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      const pad = (n: number) => n.toString().padStart(2, '0')
      const yyyy = date.getFullYear()
      const mm = pad(date.getMonth() + 1)
      const dd = pad(date.getDate())
      const hh = pad(date.getHours())
      const min = pad(date.getMinutes())
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`
    } catch {
      return ''
    }
  }

  const handleOpenCreate = () => {
    setEditingSession(null)
    setFormCode('')
    setFormName('')
    setFormProgramId('')
    setFormSubjectId('')
    setFormTrainerId('')
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    setFormStartDate(formatForDateTimeInput(now.toISOString()))
    setFormEndDate(formatForDateTimeInput(tomorrow.toISOString()))
    setFormLocation('')
    setFormMaxTrainees(30)
    setFormStatus('SCHEDULED')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (sess: TrainingSessionResponse) => {
    setEditingSession(sess)
    setFormCode(sess.code)
    setFormName(sess.name)
    setFormProgramId(sess.program_id ?? '')
    setFormSubjectId(sess.subject_id ?? '')
    setFormTrainerId(sess.trainer_id ?? '')
    setFormStartDate(formatForDateTimeInput(sess.start_date))
    setFormEndDate(formatForDateTimeInput(sess.end_date))
    setFormLocation(sess.location || '')
    setFormMaxTrainees(sess.max_trainees || 30)
    setFormStatus(sess.status)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      showError('Tên lớp đào tạo không được để trống.')
      return
    }

    if (!formStartDate || !formEndDate) {
      showError('Vui lòng chọn thời gian bắt đầu và kết thúc.')
      return
    }

    const startMs = new Date(formStartDate).getTime()
    const endMs = new Date(formEndDate).getTime()
    if (endMs <= startMs) {
      showError('Thời gian kết thúc phải sau thời gian bắt đầu.')
      return
    }

    setSubmitting(true)
    try {
      if (editingSession) {
        const payload: TrainingSessionUpdate = {
          name: formName.trim(),
          program_id: formProgramId !== '' ? Number(formProgramId) : null,
          subject_id: formSubjectId !== '' ? Number(formSubjectId) : null,
          trainer_id: formTrainerId !== '' ? Number(formTrainerId) : null,
          start_date: new Date(formStartDate).toISOString(),
          end_date: new Date(formEndDate).toISOString(),
          location: formLocation.trim() || null,
          max_trainees: Number(formMaxTrainees),
          status: formStatus,
        }
        await updateSession(editingSession.id, payload)
        showSuccess(`Cập nhật lớp "${formName}" thành công!`)
      } else {
        if (!formCode.trim()) {
          showError('Mã lớp đào tạo không được để trống.')
          setSubmitting(false)
          return
        }
        const payload: TrainingSessionCreate = {
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          program_id: formProgramId !== '' ? Number(formProgramId) : null,
          subject_id: formSubjectId !== '' ? Number(formSubjectId) : null,
          trainer_id: formTrainerId !== '' ? Number(formTrainerId) : null,
          start_date: new Date(formStartDate).toISOString(),
          end_date: new Date(formEndDate).toISOString(),
          location: formLocation.trim() || null,
          max_trainees: Number(formMaxTrainees),
          status: formStatus,
        }
        await createSession(payload)
        showSuccess(`Tạo mới lớp "${formName}" thành công!`)
      }

      setIsModalOpen(false)
      void fetchSessions()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lưu lớp đào tạo thất bại.'
      showError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteSession(deleteTarget.id)
      showSuccess(`Đã xóa lớp "${deleteTarget.name}".`)
      setDeleteTarget(null)
      void fetchSessions()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa lớp thất bại.'
      showError(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="management-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Quản lý lớp đào tạo (Training Sessions)</h2>
          <p className="page-subtitle">
            Theo dõi, phân công giảng viên và quản lý lịch học của từng lớp đào tạo
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            id="btn-create-session"
            className="btn btn-primary"
            onClick={handleOpenCreate}
          >
            + Thêm lớp đào tạo mới
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
              placeholder="Tìm theo mã hoặc tên lớp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <div className="filter-item">
              <label htmlFor="sess-prog-filter" className="filter-label">Chương trình:</label>
              <select
                id="sess-prog-filter"
                className="form-select"
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Tất cả chương trình</option>
                {programsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label htmlFor="sess-sub-filter" className="filter-label">Môn học:</label>
              <select
                id="sess-sub-filter"
                className="form-select"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Tất cả môn học</option>
                {subjectsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label htmlFor="sess-trainer-filter" className="filter-label">Giảng viên:</label>
              <select
                id="sess-trainer-filter"
                className="form-select"
                value={trainerFilter}
                onChange={(e) => setTrainerFilter(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Tất cả giảng viên</option>
                {trainersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || t.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label htmlFor="sess-status-filter" className="filter-label">Trạng thái:</label>
              <select
                id="sess-status-filter"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="SCHEDULED">Đã lên lịch (SCHEDULED)</option>
                <option value="IN_PROGRESS">Đang diễn ra (IN_PROGRESS)</option>
                <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
                <option value="CANCELLED">Đã hủy (CANCELLED)</option>
              </select>
            </div>

            {(search || statusFilter || programFilter !== '' || subjectFilter !== '' || trainerFilter !== '') && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('')
                  setProgramFilter('')
                  setSubjectFilter('')
                  setTrainerFilter('')
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
            <button type="button" className="btn btn-outline btn-sm" onClick={() => void fetchSessions()}>
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="loading-state">
          <div className="spinner-border text-primary" role="status" />
          <p>Đang tải danh sách lớp đào tạo...</p>
        </div>
      )}

      {/* TABLE DATA */}
      {!loading && !error && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>Mã lớp</th>
                <th>Tên lớp / Chương trình / Môn</th>
                <th style={{ width: '160px' }}>Giảng viên</th>
                <th style={{ width: '200px' }}>Thời gian học</th>
                <th style={{ width: '130px' }}>Địa điểm / Sĩ số</th>
                <th style={{ width: '140px' }}>Trạng thái</th>
                {canManage && <th style={{ width: '140px', textAlign: 'center' }}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="text-center empty-cell">
                    <div className="empty-state-box">
                      <span className="empty-icon">📅</span>
                      <p>Không tìm thấy lớp đào tạo nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sessions.map((sess) => (
                  <tr key={sess.id}>
                    <td>
                      <code className="code-badge">{sess.code}</code>
                    </td>
                    <td>
                      <div className="item-main-info">
                        <strong>{sess.name}</strong>
                        <div className="sub-meta-badges">
                          {sess.program_name && (
                            <span className="badge badge-secondary" title="Chương trình">
                              🎓 {sess.program_name}
                            </span>
                          )}
                          {sess.subject_name && (
                            <span className="badge badge-secondary" title="Môn học">
                              📖 {sess.subject_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="trainer-name-tag">
                        👤 {sess.trainer_name || 'Chưa phân công'}
                      </span>
                    </td>
                    <td>
                      <div className="time-range-display">
                        <div>
                          <small className="text-muted">Bắt đầu:</small>{' '}
                          {new Date(sess.start_date).toLocaleString('vi-VN')}
                        </div>
                        <div>
                          <small className="text-muted">Kết thúc:</small>{' '}
                          {new Date(sess.end_date).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>📍 {sess.location || 'Online / Chưa xếp'}</div>
                      <small className="text-muted">Tối đa: {sess.max_trainees} HV</small>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          sess.status === 'SCHEDULED'
                            ? 'badge-primary'
                            : sess.status === 'IN_PROGRESS'
                            ? 'badge-success'
                            : sess.status === 'COMPLETED'
                            ? 'badge-secondary'
                            : 'badge-danger'
                        }`}
                      >
                        {sess.status === 'SCHEDULED'
                          ? 'Đã lên lịch'
                          : sess.status === 'IN_PROGRESS'
                          ? 'Đang diễn ra'
                          : sess.status === 'COMPLETED'
                          ? 'Đã hoàn thành'
                          : 'Đã hủy'}
                      </span>
                    </td>
                    {canManage && (
                      <td>
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenEdit(sess)}
                            title="Chỉnh sửa thông tin"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteTarget(sess)}
                            title="Xóa lớp đào tạo"
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
          <div className="modal-card modal-lg">
            <header className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon-badge">📅</span>
                <h3 className="modal-title">
                  {editingSession ? 'Chỉnh sửa lớp đào tạo' : 'Thêm lớp đào tạo mới'}
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
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sess-code" className="form-label">
                      Mã lớp học <span className="text-danger">*</span>
                    </label>
                    <input
                      id="sess-code"
                      type="text"
                      className="form-input"
                      placeholder="VD: CLASS-2026-01"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      disabled={Boolean(editingSession) || submitting}
                      required
                    />
                    {editingSession && (
                      <span className="form-hint">Mã lớp không thể sửa sau khi đã tạo.</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="sess-name" className="form-label">
                      Tên lớp đào tạo <span className="text-danger">*</span>
                    </label>
                    <input
                      id="sess-name"
                      type="text"
                      className="form-input"
                      placeholder="VD: Khóa React & TypeScript K1"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sess-program" className="form-label">
                      Chương trình đào tạo
                    </label>
                    <select
                      id="sess-program"
                      className="form-select"
                      value={formProgramId}
                      onChange={(e) => setFormProgramId(e.target.value ? Number(e.target.value) : '')}
                      disabled={submitting}
                    >
                      <option value="">-- Không liên kết CTĐT --</option>
                      {programsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.code}] {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="sess-subject" className="form-label">
                      Môn học
                    </label>
                    <select
                      id="sess-subject"
                      className="form-select"
                      value={formSubjectId}
                      onChange={(e) => setFormSubjectId(e.target.value ? Number(e.target.value) : '')}
                      disabled={submitting}
                    >
                      <option value="">-- Không liên kết môn học --</option>
                      {subjectsList.map((s) => (
                        <option key={s.id} value={s.id}>
                          [{s.code}] {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sess-trainer" className="form-label">
                      Giảng viên phụ trách
                    </label>
                    <select
                      id="sess-trainer"
                      className="form-select"
                      value={formTrainerId}
                      onChange={(e) => setFormTrainerId(e.target.value ? Number(e.target.value) : '')}
                      disabled={submitting}
                    >
                      <option value="">-- Chưa phân công --</option>
                      {trainersList.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.full_name || t.email} ({t.roles.join(', ')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="sess-status" className="form-label">
                      Trạng thái lớp
                    </label>
                    <select
                      id="sess-status"
                      className="form-select"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      disabled={submitting}
                    >
                      <option value="SCHEDULED">Đã lên lịch (SCHEDULED)</option>
                      <option value="IN_PROGRESS">Đang diễn ra (IN_PROGRESS)</option>
                      <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
                      <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sess-start-date" className="form-label">
                      Thời gian bắt đầu <span className="text-danger">*</span>
                    </label>
                    <input
                      id="sess-start-date"
                      type="datetime-local"
                      className="form-input"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="sess-end-date" className="form-label">
                      Thời gian kết thúc <span className="text-danger">*</span>
                    </label>
                    <input
                      id="sess-end-date"
                      type="datetime-local"
                      className="form-input"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sess-location" className="form-label">
                      Địa điểm / Phòng học
                    </label>
                    <input
                      id="sess-location"
                      type="text"
                      className="form-input"
                      placeholder="VD: Phòng Lab 402 hoặc Google Meet URL"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="sess-max-trainees" className="form-label">
                      Sĩ số học viên tối đa
                    </label>
                    <input
                      id="sess-max-trainees"
                      type="number"
                      min={1}
                      className="form-input"
                      value={formMaxTrainees}
                      onChange={(e) => setFormMaxTrainees(Number(e.target.value))}
                      disabled={submitting}
                    />
                  </div>
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
                  {submitting ? 'Đang lưu...' : editingSession ? 'Lưu cập nhật' : 'Tạo lớp học'}
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
              <h3 className="modal-title text-danger">Xác nhận xóa lớp đào tạo</h3>
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
                Bạn có chắc chắn muốn xóa lớp <strong>{deleteTarget.name}</strong> (
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
