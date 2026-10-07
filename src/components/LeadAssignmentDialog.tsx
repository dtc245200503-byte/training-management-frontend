import ChoiceSelect from './ChoiceSelect'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { assignLeads, getLeadHistory, listLeadAdvisors } from '../services/leadService'
import type { Advisor, AssignmentHistory, Lead } from '../services/leadService'

interface Props {
  mode: 'assign' | 'history'; leads: Lead[]; onClose: () => void
  onSaved: (message: string) => void; explain: (error: unknown) => string
}

export default function LeadAssignmentDialog({ mode, leads, onClose, onSaved, explain }: Props) {
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [history, setHistory] = useState<AssignmentHistory[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [assignee, setAssignee] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const modal = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    const load = async () => {
      if (mode === 'assign') {
        const result = await listLeadAdvisors()
        if (active) setAdvisors(result)
      } else {
        const result = await getLeadHistory(leads[0].lead_id, page)
        if (active) { setHistory(result.items); setTotal(result.total) }
      }
    }
    load().catch((err: unknown) => { if (active) setError(explain(err)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, leads, page, reload])
  useEffect(() => { modal.current?.querySelector<HTMLElement>('[data-initial-focus]')?.focus() }, [loading])
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && !busy) onClose()
    if (event.key !== 'Tab') return
    const nodes = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled):not([aria-hidden="true"]), textarea:not(:disabled)')]
    if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1)?.focus() }
    if (!event.shiftKey && document.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0]?.focus() }
  }
  const save = async () => {
    if (!assignee || busy || loading) return
    setBusy(true); setError('')
    try { const result = await assignLeads(leads.map(lead => lead.lead_id), Number(assignee), note); onSaved(result.message) }
    catch (err) { setError(explain(err)) }
    finally { setBusy(false) }
  }
  const date = (value: string) => new Date(value.endsWith('Z') ? value : value + 'Z').toLocaleString('vi-VN')
  return <div className="program-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <div ref={modal} className="program-dialog lead-assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="assignment-title" onKeyDown={keyboard}>
      <div className="program-dialog-header"><h2 id="assignment-title">{mode === 'assign' ? 'Phân công khách hàng tiềm năng' : 'Lịch sử chuyển giao'}</h2><button data-initial-focus disabled={busy} aria-label="Đóng hộp thoại" onClick={onClose}>×</button></div>
      {mode === 'assign' ? <form onSubmit={event => { event.preventDefault(); void save() }}>
        <p>Phân công {leads.length} lead cho một tư vấn viên. Các lead đang có người phụ trách sẽ được chuyển giao.</p>
        <ul className="lead-assignment-selection">{leads.map(lead => <li key={lead.lead_id}><strong>{lead.full_name}</strong> — {lead.assignee_name || 'Chưa phân công'}</li>)}</ul>
        {loading ? <p role="status">Đang tải tư vấn viên...</p> : <fieldset className="program-form" disabled={busy || !!error && !advisors.length}>
          <div className="program-full"><label htmlFor="lead-assignee">Tư vấn viên nhận lead *</label><ChoiceSelect id="lead-assignee" value={assignee} onChange={event => setAssignee(event.target.value)} required><option value="">Chọn tư vấn viên</option>{advisors.map(advisor => <option key={advisor.user_id} value={advisor.user_id}>{advisor.full_name} — {advisor.email}</option>)}</ChoiceSelect>{!advisors.length && !error && <p>Chưa có tư vấn viên đang hoạt động có quyền quản lý lead.</p>}</div>
          <div className="program-full"><label htmlFor="lead-assignment-note">Ghi chú chuyển giao</label><textarea id="lead-assignment-note" maxLength={1000} rows={3} value={note} onChange={event => setNote(event.target.value)} placeholder="Ví dụ: Khách muốn được gọi lại sau 17 giờ" /></div>
        </fieldset>}
        {error && <p className="program-error" role="alert">{error} {!advisors.length && <button type="button" onClick={() => setReload(value => value + 1)}>Thử lại</button>}</p>}
        <div className="program-dialog-actions"><button type="button" className="program-secondary" disabled={busy} onClick={onClose}>Hủy</button><button className="program-primary lead-assign-confirm" disabled={busy || loading || !assignee} type="submit">{busy ? 'Đang phân công...' : 'Xác nhận phân công'}</button></div>
      </form> : <><p><strong>{leads[0].full_name}</strong></p>
        {loading ? <p role="status">Đang tải lịch sử...</p> : error ? <p className="program-error" role="alert">{error} <button onClick={() => setReload(value => value + 1)}>Thử lại</button></p> : history.length ? <ol className="lead-history-list">{history.map(item => <li key={item.history_id}><strong>{item.from_assignee_name || 'Chưa phân công'} → {item.to_assignee_name || 'Chưa phân công'}</strong><p>Người thực hiện: {item.actor_name}</p><time>{date(item.created_at)}</time>{item.note && <p className="lead-history-note">{item.note}</p>}</li>)}</ol> : <p>Chưa có lịch sử chuyển giao.</p>}
        {total > 20 && <div className="program-pagination"><span>Trang {page}/{Math.ceil(total / 20)}</span><button disabled={loading || page === 1} onClick={() => setPage(page-1)}>Trang trước</button><button disabled={loading || page >= Math.ceil(total / 20)} onClick={() => setPage(page+1)}>Trang sau</button></div>}
        <div className="program-dialog-actions"><button className="program-secondary" onClick={onClose}>Đóng</button></div>
      </>}
    </div>
  </div>
}
