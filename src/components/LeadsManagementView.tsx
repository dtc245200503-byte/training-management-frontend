import { useState, useEffect, useCallback, type FormEvent } from 'react'
import {
  listLeads,
  updateLead,
  assignLead,
  deleteLead,
} from '../services/consultationService'
import { listPrograms } from '../services/trainingProgramService'
import { listUsers } from '../services/userService'
import type { LeadResponse, LeadUpdate } from '../types/consultation'
import type { TrainingProgramResponse } from '../types/trainingProgram'
import type { UserDetail } from '../types/user'
import { useAuth } from '../context/useAuth'
import { useNotification } from '../context/useNotification'

const LEAD_STATUS_MAP: Record<string, { label: string; badgeClass: string }> = {
  NEW: { label: 'Mới tạo', badgeClass: 'badge-primary' },
  CONTACTED: { label: 'Đã liên hệ', badgeClass: 'badge-info' },
  CONSULTING: { label: 'Đang tư vấn', badgeClass: 'badge-warning' },
  ENROLLED: { label: 'Đã nhập học', badgeClass: 'badge-success' },
  REJECTED: { label: 'Từ chối / Không phù hợp', badgeClass: 'badge-danger' },
  CLOSED: { label: 'Đã đóng', badgeClass: 'badge-secondary' },
}

export default function LeadsManagementView() {
  const { hasPermission } = useAuth()
  const { showSuccess, showError } = useNotification()

  const canManage = hasPermission('lead:manage')
  const canAssign = hasPermission('lead:assign')

  // Leads list state
  const [leads, setLeads] = useState<LeadResponse[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // S2-11: Filter & Search state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [programFilter, setProgramFilter] = useState<number | ''>('')
  const [assignedToFilter, setAssignedToFilter] = useState<number | ''>('')

  // Auxiliary dropdown lists
  const [programsList, setProgramsList] = useState<TrainingProgramResponse[]>([])
  const [counselorsList, setCounselorsList] = useState<UserDetail[]>([])

  // S2-09: Detail & Update status modal state
  const [selectedLead, setSelectedLead] = useState<LeadResponse | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editStatus, setEditStatus] = useState('NEW')
  const [editAdminNotes, setEditAdminNotes] = useState('')
  const [editCustomerNotes, setEditCustomerNotes] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // S2-10: Assign Lead Modal state
  const [assigningLead, setAssigningLead] = useState<LeadResponse | null>(null)
  const [selectedCounselorId, setSelectedCounselorId] = useState<number | ''>('')
  const [submittingAssign, setSubmittingAssign] = useState(false)

  // Delete Lead state
  const [deleteTarget, setDeleteTarget] = useState<LeadResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Load auxiliary lists on mount
  useEffect(() => {
    let cancelled = false
    Promise.all([
      listPrograms({ limit: 100 }),
      listUsers({ limit: 100 }),
    ])
      .then(([progRes, userRes]) => {
        if (cancelled) return
        setProgramsList(progRes.items || [])
        setCounselorsList(userRes.items || [])
      })
      .catch((err) => {
        console.warn('Failed to load auxiliary data for leads:', err)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // S2-11: Fetch Leads with Search & Filters
  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listLeads({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        program_id: programFilter !== '' ? Number(programFilter) : undefined,
        assigned_to_id: assignedToFilter !== '' ? Number(assignedToFilter) : undefined,
      })
      setLeads(res.items || [])
      setTotal(res.total || 0)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách yêu cầu tư vấn.'
      setError(msg)
      showError(msg)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, programFilter, assignedToFilter, showError])

  useEffect(() => {
    let cancelled = false
    listLeads({
      search: search.trim() || undefined,
      status: statusFilter || undefined,
      program_id: programFilter !== '' ? Number(programFilter) : undefined,
      assigned_to_id: assignedToFilter !== '' ? Number(assignedToFilter) : undefined,
    })
      .then((res) => {
        if (!cancelled) {
          setLeads(res.items || [])
          setTotal(res.total || 0)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Không thể tải danh sách yêu cầu tư vấn.'
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
  }, [search, statusFilter, programFilter, assignedToFilter, showError])

  // Open Lead Detail & Edit Status Modal
  const handleOpenDetail = (lead: LeadResponse) => {
    setSelectedLead(lead)
    setEditStatus(lead.status)
    setEditAdminNotes(lead.admin_notes || '')
    setEditCustomerNotes(lead.notes || '')
    setIsDetailModalOpen(true)
  }

  // S2-09: Update Lead Status & Notes
  const handleUpdateLeadSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedLead) return

    setUpdatingStatus(true)
    try {
      const payload: LeadUpdate = {
        status: editStatus,
        admin_notes: editAdminNotes.trim() || null,
        notes: editCustomerNotes.trim() || null,
      }

      const updated = await updateLead(selectedLead.id, payload)
      showSuccess(`Cập nhật trạng thái lead "${updated.full_name}" thành công!`)
      setSelectedLead(updated)
      setIsDetailModalOpen(false)
      void fetchLeads()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cập nhật trạng thái lead thất bại.'
      showError(msg)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // S2-10: Open Assign Modal
  const handleOpenAssignModal = (lead: LeadResponse) => {
    setAssigningLead(lead)
    setSelectedCounselorId(lead.assigned_to_id ?? '')
  }

  // S2-10: Submit Assign Lead
  const handleAssignSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!assigningLead || selectedCounselorId === '') {
      showError('Vui lòng chọn nhân viên phụ trách tư vấn.')
      return
    }

    setSubmittingAssign(true)
    try {
      const updated = await assignLead(assigningLead.id, {
        user_id: Number(selectedCounselorId),
      })
      showSuccess(`Phân công lead "${updated.full_name}" cho "${updated.assigned_to_name}" thành công!`)
      setAssigningLead(null)
      void fetchLeads()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Phân công lead thất bại.'
      showError(msg)
    } finally {
      setSubmittingAssign(false)
    }
  }

  // Delete Lead
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteLead(deleteTarget.id)
      showSuccess(`Đã xóa yêu cầu tư vấn của "${deleteTarget.full_name}".`)
      setDeleteTarget(null)
      void fetchLeads()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa lead thất bại.'
      showError(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="management-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Quản lý tư vấn tuyển sinh (Leads)</h2>
          <p className="page-subtitle">
            Tiếp nhận yêu cầu tư vấn, phân công chuyên viên và chăm sóc học viên tiềm năng
          </p>
        </div>
        <div className="page-badge">
          <span className="badge badge-primary">Tổng cộng: {total} Leads</span>
        </div>
      </header>

      {/* S2-11: FILTER & SEARCH */}
      <section className="filter-card">
        <div className="filter-form">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-input search-input"
              placeholder="Tìm theo họ tên, email hoặc SĐT khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <div className="filter-item">
              <label htmlFor="lead-status-filter" className="filter-label">Trạng thái:</label>
              <select
                id="lead-status-filter"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(LEAD_STATUS_MAP).map(([code, meta]) => (
                  <option key={code} value={code}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label htmlFor="lead-prog-filter" className="filter-label">Khóa học:</label>
              <select
                id="lead-prog-filter"
                className="form-select"
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Tất cả khóa học</option>
                {programsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label htmlFor="lead-counselor-filter" className="filter-label">Người phụ trách:</label>
              <select
                id="lead-counselor-filter"
                className="form-select"
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Tất cả nhân viên</option>
                {counselorsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name || c.email}
                  </option>
                ))}
              </select>
            </div>

            {(search || statusFilter || programFilter !== '' || assignedToFilter !== '') && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('')
                  setProgramFilter('')
                  setAssignedToFilter('')
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
            <button type="button" className="btn btn-outline btn-sm" onClick={() => void fetchLeads()}>
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="loading-state">
          <div className="spinner-border text-primary" role="status" />
          <p>Đang tải danh sách yêu cầu tư vấn...</p>
        </div>
      )}

      {/* S2-09: LEADS DATA TABLE */}
      {!loading && !error && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Khách hàng</th>
                <th>Khóa học quan tâm</th>
                <th style={{ width: '150px' }}>Trạng thái</th>
                <th style={{ width: '180px' }}>Phụ trách</th>
                <th style={{ width: '140px' }}>Ngày gửi</th>
                <th style={{ width: '160px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center empty-cell">
                    <div className="empty-state-box">
                      <span className="empty-icon">👥</span>
                      <p>Không tìm thấy yêu cầu tư vấn nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const statusMeta = LEAD_STATUS_MAP[lead.status] || {
                    label: lead.status,
                    badgeClass: 'badge-secondary',
                  }
                  return (
                    <tr key={lead.id}>
                      <td>
                        <span className="badge badge-secondary">#{lead.id}</span>
                      </td>
                      <td>
                        <div className="customer-info-box">
                          <strong className="customer-name">{lead.full_name}</strong>
                          <div className="customer-contact">
                            <span>📧 {lead.email}</span>
                            <span>📞 {lead.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{lead.program_name || 'Tư vấn chung'}</strong>
                        {lead.notes && (
                          <div className="customer-note-snippet" title={lead.notes}>
                            📝 {lead.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${statusMeta.badgeClass}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td>
                        {lead.assigned_to_name ? (
                          <div className="assignee-box">
                            <span className="assignee-name">👤 {lead.assigned_to_name}</span>
                            {lead.assigned_at && (
                              <small className="text-muted">
                                {new Date(lead.assigned_at).toLocaleDateString('vi-VN')}
                              </small>
                            )}
                          </div>
                        ) : (
                          <span className="badge badge-warning">Chưa phân công</span>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(lead.created_at).toLocaleDateString('vi-VN')}
                        </small>
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenDetail(lead)}
                            title="Xem chi tiết & Cập nhật trạng thái"
                          >
                            Chi tiết
                          </button>
                          {canAssign && (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleOpenAssignModal(lead)}
                              title="Phân công nhân viên phụ trách"
                            >
                              Phân công
                            </button>
                          )}
                          {canManage && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeleteTarget(lead)}
                              title="Xóa yêu cầu tư vấn"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* S2-09: DETAIL & STATUS UPDATE MODAL */}
      {isDetailModalOpen && selectedLead && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card modal-lg">
            <header className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon-badge">📋</span>
                <div>
                  <h3 className="modal-title">Chi tiết yêu cầu tư vấn #{selectedLead.id}</h3>
                  <p className="modal-subtitle">
                    Khách hàng: <strong>{selectedLead.full_name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsDetailModalOpen(false)}
                disabled={updatingStatus}
              >
                ×
              </button>
            </header>

            <form onSubmit={handleUpdateLeadSubmit}>
              <div className="modal-body">
                {/* Customer Info Card */}
                <div className="lead-detail-summary-card">
                  <div className="detail-meta-row">
                    <div>
                      <span className="meta-label">Email:</span>
                      <strong>{selectedLead.email}</strong>
                    </div>
                    <div>
                      <span className="meta-label">Số điện thoại:</span>
                      <strong>{selectedLead.phone}</strong>
                    </div>
                    <div>
                      <span className="meta-label">Chương trình quan tâm:</span>
                      <strong>{selectedLead.program_name || 'Tư vấn chung'}</strong>
                    </div>
                    <div>
                      <span className="meta-label">Ngày gửi:</span>
                      <span>{new Date(selectedLead.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>

                  <div className="customer-request-box">
                    <span className="meta-label">Yêu cầu từ khách hàng:</span>
                    <p>{selectedLead.notes || 'Không có ghi chú thêm.'}</p>
                  </div>
                </div>

                {/* Edit Section */}
                <div className="form-group" style={{ marginTop: '1.25rem' }}>
                  <label htmlFor="lead-edit-status" className="form-label">
                    Trạng thái xử lý <span className="text-danger">*</span>
                  </label>
                  <select
                    id="lead-edit-status"
                    className="form-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    disabled={!canManage || updatingStatus}
                  >
                    {Object.entries(LEAD_STATUS_MAP).map(([code, meta]) => (
                      <option key={code} value={code}>
                        {meta.label} ({code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="lead-admin-notes" className="form-label">
                    Ghi chú nội bộ của chuyên viên tư vấn
                  </label>
                  <textarea
                    id="lead-admin-notes"
                    className="form-textarea"
                    rows={4}
                    placeholder="Ghi lại nội dung cuộc gọi, nhu cầu thực tế, lịch hẹn hoặc lý do học viên từ chối..."
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                    disabled={!canManage || updatingStatus}
                  />
                </div>
              </div>

              <footer className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsDetailModalOpen(false)}
                  disabled={updatingStatus}
                >
                  Đóng
                </button>
                {canManage && (
                  <button type="submit" className="btn btn-primary" disabled={updatingStatus}>
                    {updatingStatus ? 'Đang lưu...' : 'Lưu cập nhật'}
                  </button>
                )}
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* S2-10: ASSIGN LEAD MODAL */}
      {assigningLead && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <header className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon-badge">👤</span>
                <div>
                  <h3 className="modal-title">Phân công tư vấn Lead #{assigningLead.id}</h3>
                  <p className="modal-subtitle">Khách hàng: {assigningLead.full_name}</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setAssigningLead(null)}
                disabled={submittingAssign}
              >
                ×
              </button>
            </header>

            <form onSubmit={handleAssignSubmit}>
              <div className="modal-body">
                <div className="assign-info-callout">
                  <p>
                    Người phụ trách hiện tại:{' '}
                    <strong>{assigningLead.assigned_to_name || 'Chưa phân công'}</strong>
                  </p>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label htmlFor="select-counselor" className="form-label">
                    Chọn nhân viên / chuyên viên tiếp nhận: <span className="text-danger">*</span>
                  </label>
                  <select
                    id="select-counselor"
                    className="form-select"
                    value={selectedCounselorId}
                    onChange={(e) =>
                      setSelectedCounselorId(e.target.value ? Number(e.target.value) : '')
                    }
                    disabled={submittingAssign}
                    required
                  >
                    <option value="">-- Chọn nhân viên phụ trách --</option>
                    {counselorsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name || c.email} ({c.roles.join(', ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <footer className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setAssigningLead(null)}
                  disabled={submittingAssign}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={selectedCounselorId === '' || submittingAssign}
                >
                  {submittingAssign ? 'Đang phân công...' : 'Xác nhận phân công'}
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
              <h3 className="modal-title text-danger">Xác nhận xóa yêu cầu tư vấn</h3>
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
                Bạn có chắc chắn muốn xóa yêu cầu tư vấn của khách hàng{' '}
                <strong>{deleteTarget.full_name}</strong> (#{deleteTarget.id})? Thao tác này không thể hoàn tác.
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
