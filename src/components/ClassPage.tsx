import { useEffect, useState } from 'react'
import ChoiceSelect from './ChoiceSelect'
import ErrorPage from './ErrorPage'
import { ClassPermissionError, ClassSessionError, listClasses } from '../services/classService'
import type { TrainingClass } from '../services/classService'
import './TrainingProgramPage.css'

const statuses: Record<string, string> = { planned: 'Sắp khai giảng', in_progress: 'Đang học', completed: 'Đã kết thúc', cancelled: 'Đã hủy' }
export default function ClassPage({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [items, setItems] = useState<TrainingClass[]>([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ search: '', status: '' })
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [forbidden, setForbidden] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true); setError(''); setExpanded(null)
    listClasses(filters.search, filters.status, page).then(result => {
      if (!active) return
      const last = Math.max(1, Math.ceil(result.total / 20))
      if (page > last) { setPage(last); return }
      setItems(result.items); setTotal(result.total)
    }).catch((err: unknown) => {
      if (!active) return
      if (err instanceof ClassSessionError) onSessionExpired()
      if (err instanceof ClassPermissionError) setForbidden(true)
      setItems([]); setTotal(0); setError(err instanceof Error && !(err instanceof TypeError) ? err.message : 'Không thể kết nối đến hệ thống. Vui lòng thử lại.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, reload])
  if (forbidden) return <ErrorPage statusCode={403} title="Không có quyền truy cập" message="Bạn không có quyền xem lớp học." />
  return <section className="program-page" aria-labelledby="class-title">
    <div className="program-header"><div><h1 id="class-title">Lớp học</h1><p>Theo dõi các lớp theo chương trình, giảng viên và trạng thái đào tạo.</p></div></div>
    <form className="program-filters" onSubmit={event => { event.preventDefault(); setFilters({ ...filters, search }); setPage(1); setReload(value => value + 1) }}>
      <div><label htmlFor="class-search">Tìm lớp học</label><input id="class-search" maxLength={100} value={search} placeholder="Tên lớp, chương trình hoặc giảng viên" onChange={event => setSearch(event.target.value)} /></div>
      <div><label htmlFor="class-status">Trạng thái</label><ChoiceSelect id="class-status" value={filters.status} onChange={event => { setFilters({ search, status: event.target.value }); setPage(1) }}><option value="">Tất cả trạng thái</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</ChoiceSelect></div><button type="submit">Tìm kiếm</button>
    </form>
    {error && <p className="program-error" role="alert">{error} <button onClick={() => setReload(value => value + 1)}>Thử lại</button></p>}
    <div className="program-table-wrap" aria-busy={loading}><table className="program-table"><caption>{total} lớp học</caption><thead><tr><th>Lớp học</th><th>Chương trình</th><th>Giảng viên</th><th>Khai giảng</th><th>Trạng thái</th><th>Môn học</th></tr></thead><tbody>{loading ? <tr><td colSpan={6}>Đang tải lớp học...</td></tr> : !items.length ? <tr><td colSpan={6}>Chưa có lớp phù hợp.</td></tr> : items.map(item => <tr key={item.class_id} data-class-id={item.class_id}>
      <td className="program-name"><strong>{item.class_name}</strong><small>Mã lớp: {item.class_id}</small></td><td className="program-name">{item.program_name || 'Chưa chọn chương trình'}<small>{item.program_code}</small></td><td>{item.instructor_name || 'Chưa phân công'}</td><td>{item.start_date ? item.start_date.split('-').reverse().join('/') : 'Chưa có ngày'}</td><td><span className={`program-badge ${item.status === 'in_progress' ? 'active' : 'inactive'}`}>{statuses[item.status] || 'Khác'}</span></td><td><button type="button" aria-expanded={expanded === item.class_id} onClick={() => setExpanded(expanded === item.class_id ? null : item.class_id)}>Xem {item.subjects.length} môn học</button>{expanded === item.class_id && <ul style={{ paddingLeft: 20, minWidth: 210, lineHeight: 1.7 }}>{item.subjects.length ? item.subjects.map(subject => <li key={subject.subject_id}><strong>{subject.code}</strong> — {subject.name}<small>{subject.session_count} buổi</small></li>) : <li>Chưa có môn học trong lớp.</li>}</ul>}</td>
    </tr>)}</tbody></table></div><div className="program-pagination"><span>Trang {page}/{Math.max(1, Math.ceil(total / 20))}</span><button disabled={loading || page <= 1} onClick={() => setPage(page-1)}>Trang trước</button><button disabled={loading || page >= Math.ceil(total / 20)} onClick={() => setPage(page+1)}>Trang sau</button></div>
  </section>
}
