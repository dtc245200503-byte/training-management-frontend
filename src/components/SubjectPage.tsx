import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import ErrorPage from './ErrorPage'
import { deleteSubject, getProgramOptions, listSubjects, saveSubject, setSubjectPrograms, SubjectPermissionError, SubjectSessionError } from '../services/subjectService'
import type { ProgramOption, Subject } from '../services/subjectService'
import './TrainingProgramPage.css'
import './SubjectPage.css'

interface Props { onSessionExpired: () => void; canManagePrograms: boolean }
interface FormData { code: string; name: string; session_count: string; weight: string; learning_outcomes: string }
const emptyForm: FormData = { code: '', name: '', session_count: '', weight: '1', learning_outcomes: '' }

export default function SubjectPage({ onSessionExpired, canManagePrograms }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [reload, setReload] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [forbidden, setForbidden] = useState(false)
  const [dialog, setDialog] = useState<'form' | 'programs' | 'delete' | null>(null)
  const [selected, setSelected] = useState<Subject | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [dialogError, setDialogError] = useState('')
  const [busy, setBusy] = useState(false)
  const [options, setOptions] = useState<ProgramOption[]>([])
  const [optionsReady, setOptionsReady] = useState(false)
  const [programIds, setProgramIds] = useState<number[]>([])
  const [programSearch, setProgramSearch] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const explain = (err: unknown, pageRequest = false) => {
    if (err instanceof SubjectSessionError) onSessionExpired()
    if (err instanceof SubjectPermissionError && pageRequest) setForbidden(true)
    return err instanceof Error && !(err instanceof TypeError) ? err.message : 'Không thể kết nối đến hệ thống. Vui lòng thử lại.'
  }

  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    listSubjects(appliedSearch, page).then(result => {
      if (!active) return
      const lastPage = Math.max(1, Math.ceil(result.total / 20))
      if (page > lastPage) { setPage(lastPage); return }
      setSubjects(result.items); setTotal(result.total)
    }).catch((err: unknown) => { if (active) setError(explain(err, true)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSearch, page, reload])

  useEffect(() => {
    if (dialog) modalRef.current?.querySelector<HTMLElement>('[data-initial-focus]')?.focus()
  }, [dialog])

  useEffect(() => {
    if (dialog !== 'programs') return
    let active = true
    setOptionsReady(false)
    getProgramOptions().then(result => { if (active) { setOptions(result); setOptionsReady(true) } })
      .catch((err: unknown) => { if (active) setDialogError(explain(err)) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog])

  const close = () => {
    if (busy) return
    setDialog(null); setDialogError(''); triggerRef.current?.focus()
  }

  const open = (type: 'form' | 'programs' | 'delete', trigger: HTMLElement, subject?: Subject) => {
    triggerRef.current = trigger
    setSelected(subject || null); setDialogError(''); setSuccess('')
    setForm(subject ? { code: subject.code, name: subject.name, session_count: String(subject.session_count), weight: subject.weight, learning_outcomes: subject.learning_outcomes || '' } : { ...emptyForm })
    setProgramIds(subject?.programs.filter(item => !item.is_deleted).map(item => item.curriculum_id) || [])
    setOptionsReady(false); setProgramSearch(''); setDialog(type)
  }

  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { close(); return }
    if (event.key !== 'Tab') return
    const nodes = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)')]
    const first = nodes[0], last = nodes[nodes.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    const data = { code: form.code.trim().toUpperCase(), name: form.name.trim(), session_count: Number(form.session_count), weight: form.weight, learning_outcomes: form.learning_outcomes.trim() || null }
    if (dialog === 'form') {
      if (!/^[A-Z0-9][A-Z0-9_-]{0,49}$/.test(data.code)) { setDialogError('Mã môn chỉ gồm chữ không dấu, số, gạch ngang hoặc gạch dưới; tối đa 50 ký tự.'); return }
      if (!data.name || data.name.length > 255) { setDialogError('Vui lòng nhập tên môn học, tối đa 255 ký tự.'); return }
      if (!/^\d+$/.test(form.session_count) || data.session_count < 1 || data.session_count > 1000) { setDialogError('Số buổi phải là số nguyên từ 1 đến 1.000.'); return }
      if (!/^\d+(\.\d{1,2})?$/.test(data.weight) || Number(data.weight) <= 0 || Number(data.weight) > 9999.99) { setDialogError('Trọng số phải lớn hơn 0, tối đa 9.999,99 và có tối đa 2 chữ số thập phân.'); return }
    }
    if (dialog === 'programs' && !optionsReady) return
    setBusy(true); setDialogError('')
    try {
      if (dialog === 'form') await saveSubject(data, selected?.subject_id)
      else if (dialog === 'programs' && selected) await setSubjectPrograms(selected.subject_id, programIds)
      else if (dialog === 'delete' && selected) await deleteSubject(selected.subject_id)
      setSuccess(dialog === 'delete' ? 'Đã xóa môn học khỏi danh mục.' : dialog === 'programs' ? 'Đã cập nhật các chương trình sử dụng môn học.' : selected ? 'Cập nhật môn học thành công.' : 'Thêm môn học thành công.')
      setDialog(null); setReload(value => value + 1); triggerRef.current?.focus()
    } catch (err) { setDialogError(explain(err)); setReload(value => value + 1) }
    finally { setBusy(false) }
  }

  if (forbidden) return <ErrorPage statusCode={403} title="Không có quyền truy cập" message="Bạn không có quyền quản lý danh mục môn học." />
  const visibleOptions = options.filter(item => `${item.code} ${item.name}`.toLocaleLowerCase('vi-VN').includes(programSearch.trim().toLocaleLowerCase('vi-VN')))

  return <section className="program-page subject-page" aria-labelledby="subject-title">
    <div className="program-header"><div><h1 id="subject-title">Danh mục môn học</h1><p>Khai báo một lần, sử dụng môn học cho nhiều chương trình đào tạo.</p></div>
      <button className="program-primary" onClick={event => open('form', event.currentTarget)}>Thêm môn học</button></div>
    <form className="program-filters" onSubmit={event => { event.preventDefault(); setAppliedSearch(search); setPage(1); setReload(value => value + 1) }}>
      <div><label htmlFor="subject-search">Tìm môn học</label><input id="subject-search" placeholder="Tìm theo mã hoặc tên môn học" maxLength={100} value={search} onChange={event => setSearch(event.target.value)} /></div>
      <button type="submit">Tìm kiếm</button></form>
    {error && <p className="program-error" role="alert">{error} <button onClick={() => setReload(value => value + 1)}>Thử lại</button></p>}
    {success && <p className="program-success" role="status">{success}</p>}
    <div className="program-table-wrap" aria-busy={loading}><table className="program-table subject-table"><caption>{total} môn học</caption><thead><tr><th>Mã môn</th><th>Tên và chuẩn đầu ra</th><th>Số buổi</th><th>Trọng số</th><th>Chương trình sử dụng</th><th>Lớp học</th><th>Thao tác</th></tr></thead>
      <tbody>{loading ? <tr><td colSpan={7}>Đang tải môn học...</td></tr> : subjects.length === 0 ? <tr><td colSpan={7}>Chưa có môn học phù hợp.</td></tr> : subjects.map(subject => <tr key={subject.subject_id}>
        <td><strong>{subject.code}</strong></td><td className="program-name"><strong>{subject.name}</strong><p>{subject.learning_outcomes || 'Chưa khai báo chuẩn đầu ra'}</p></td>
        <td>{subject.session_count}</td><td>{Number(subject.weight).toLocaleString('vi-VN')}</td>
        <td className="subject-program-names">{subject.programs.length ? subject.programs.map(program => <small key={program.curriculum_id}><strong>{program.code}</strong> — {program.name}{program.is_deleted ? ' (đã xóa khỏi danh mục)' : ''}</small>) : 'Chưa gắn chương trình'}</td>
        <td>{subject.class_count}</td><td><div className="program-row-actions"><button onClick={event => open('form', event.currentTarget, subject)}>Sửa</button>
          {canManagePrograms && <button onClick={event => open('programs', event.currentTarget, subject)}>Chương trình</button>}
          <button className="program-delete" disabled={!subject.can_delete} onClick={event => open('delete', event.currentTarget, subject)}>Xóa</button>
          <Link className="program-path-link" to={`/subjects/${subject.subject_id}/lessons`}>Buổi học</Link></div>
          {!subject.can_delete && <small>{subject.class_count > 0 ? 'Đã có lớp học, không được xóa.' : 'Đang là môn tiên quyết, chưa thể xóa.'}</small>}</td>
      </tr>)}</tbody></table></div>
    <div className="program-pagination"><span>Trang {page} / {Math.max(1, Math.ceil(total / 20))}</span><button disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>Trang trước</button><button disabled={loading || page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>Trang sau</button></div>
    {dialog && <div className="program-overlay" onMouseDown={event => { if (event.target === event.currentTarget) close() }}><div ref={modalRef} className="program-dialog" role="dialog" aria-modal="true" aria-labelledby="subject-dialog-title" onKeyDown={keyboard}>
      <div className="program-dialog-header"><h2 id="subject-dialog-title">{dialog === 'form' ? selected ? 'Sửa môn học' : 'Thêm môn học' : dialog === 'programs' ? 'Chương trình sử dụng môn học' : 'Xóa môn học'}</h2><button aria-label="Đóng hộp thoại" onClick={close} disabled={busy}>×</button></div>
      <form onSubmit={submit} noValidate>
        {dialog === 'form' ? <fieldset className="program-form" disabled={busy}>
          <div><label htmlFor="subject-code">Mã môn *</label><input id="subject-code" data-initial-focus value={form.code} maxLength={50} onChange={event => setForm({ ...form, code: event.target.value })} /><small>Mã duy nhất, không phân biệt chữ hoa/thường.</small></div>
          <div><label htmlFor="subject-name">Tên môn học *</label><input id="subject-name" value={form.name} maxLength={255} onChange={event => setForm({ ...form, name: event.target.value })} /></div>
          <div><label htmlFor="subject-sessions">Số buổi *</label><input id="subject-sessions" type="number" min="1" max="1000" step="1" value={form.session_count} onChange={event => setForm({ ...form, session_count: event.target.value })} /></div>
          <div><label htmlFor="subject-weight">Trọng số *</label><input id="subject-weight" type="number" min="0.01" max="9999.99" step="0.01" value={form.weight} onChange={event => setForm({ ...form, weight: event.target.value })} /><small>Hệ số trọng số, ví dụ 1 hoặc 1,5.</small></div>
          <div className="program-full"><label htmlFor="subject-outcomes">Mô tả chuẩn đầu ra</label><textarea id="subject-outcomes" rows={4} maxLength={5000} value={form.learning_outcomes} onChange={event => setForm({ ...form, learning_outcomes: event.target.value })} /></div>
        </fieldset> : dialog === 'programs' ? <><p><strong>{selected?.code} — {selected?.name}</strong></p><p>Chọn nhiều chương trình để dùng chung môn học. Gỡ khỏi chương trình vẫn giữ lịch sử lớp đã học.</p>
          <label htmlFor="subject-program-search">Tìm chương trình</label><input id="subject-program-search" data-initial-focus value={programSearch} onChange={event => setProgramSearch(event.target.value)} />
          {!optionsReady && !dialogError ? <p>Đang tải chương trình...</p> : optionsReady && <fieldset disabled={busy} className="subject-program-options"><legend>Chương trình đào tạo — đã chọn {programIds.length}</legend>
            {visibleOptions.length ? visibleOptions.map(program => <label key={program.curriculum_id}><input type="checkbox" data-program-id={program.curriculum_id} checked={programIds.includes(program.curriculum_id)} onChange={event => setProgramIds(event.target.checked ? [...programIds, program.curriculum_id] : programIds.filter(id => id !== program.curriculum_id))} /><span><strong>{program.code}</strong> — {program.name}{program.status === 'inactive' ? ' (ngừng áp dụng)' : ''}</span></label>) : <p>Chưa có chương trình phù hợp.</p>}</fieldset>}
        </> : <><p><strong>{selected?.code} — {selected?.name}</strong></p><p>Xóa môn học khỏi danh mục và gỡ khỏi {selected?.programs.length || 0} chương trình đang liên kết. Môn đã có lớp học sẽ được hệ thống chặn xóa.</p></>}
        {dialogError && <p className="program-error" role="alert">{dialogError}</p>}
        <div className="program-dialog-actions"><button type="button" className="program-secondary" data-initial-focus={dialog === 'delete' ? true : undefined} onClick={close} disabled={busy}>Hủy</button><button className="program-primary subject-confirm" type="submit" disabled={busy || (dialog === 'programs' && !optionsReady)}>{busy ? 'Đang lưu...' : dialog === 'delete' ? 'Xác nhận xóa' : dialog === 'programs' ? 'Lưu liên kết' : 'Lưu môn học'}</button></div>
      </form></div></div>}
  </section>
}
