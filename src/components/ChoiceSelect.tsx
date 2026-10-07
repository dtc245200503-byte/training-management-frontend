import { Children, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, ReactNode, SelectHTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import './ChoiceSelect.css'

type Option = { value: string; label: string; disabled: boolean }
const plainText = (node: ReactNode): string => Children.toArray(node).map(child => isValidElement<{ children?: ReactNode }>(child) ? plainText(child.props.children) : String(child ?? '')).join('')
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi').trim()
function readOptions(children: ReactNode): Option[] {
  const result: Option[] = []
  Children.forEach(children, child => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; label?: string; disabled?: boolean }>(child)) return
    if (child.type === 'option') result.push({ value: String(child.props.value ?? plainText(child.props.children)), label: child.props.label || plainText(child.props.children).trim(), disabled: !!child.props.disabled })
    else result.push(...readOptions(child.props.children))
  })
  return result
}

/** Keep the native form control and existing onChange contracts behind a shared UI. */
export default function ChoiceSelect({ children, className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const uid = useId()
  const native = useRef<HTMLSelectElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const typing = useRef({ text: '', time: 0 })
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [label, setLabel] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [position, setPosition] = useState<CSSProperties>({ position: 'fixed', top: 0, left: 0, visibility: 'hidden' })
  const options = readOptions(children)
  const value = String(props.value ?? native.current?.value ?? props.defaultValue ?? options[0]?.value ?? '')
  const selected = options.find(option => option.value === value)
  const filtered = options.filter(option => normalize(option.label).includes(normalize(query)))
  const listId = `choice-list-${uid}`
  const searchable = options.length > 7
  const close = (focus = false) => { setOpen(false); setQuery(''); if (focus) trigger.current?.focus() }
  useLayoutEffect(() => {
    const name = [...(native.current?.labels || [])].map(item => item.textContent?.trim()).join(' ')
    if (name !== label) setLabel(name)
    if (open && native.current?.matches(':disabled')) close()
  })
  useEffect(() => { if (value) setInvalid(false) }, [value])
  useLayoutEffect(() => {
    if (!open || !trigger.current) return
    const bounds = trigger.current.getBoundingClientRect()
    const below = window.innerHeight - bounds.bottom - 12
    const above = bounds.top - 12
    const upward = below < 220 && above > below
    const height = Math.min(320, upward ? above : below)
    const width = Math.min(Math.max(bounds.width, 220), window.innerWidth - 24)
    setPosition({ position: 'fixed', width, maxHeight: Math.max(90, height), left: Math.max(12, Math.min(bounds.left, window.innerWidth - width - 12)), ...(upward ? { bottom: window.innerHeight - bounds.top + 6 } : { top: bounds.bottom + 6 }) })
    if (searchable) search.current?.focus()
    const outside = (event: PointerEvent) => { if (!trigger.current?.contains(event.target as Node) && !popup.current?.contains(event.target as Node)) close() }
    const scroll = (event: Event) => { if (!popup.current?.contains(event.target as Node)) close() }
    const resize = () => close()
    document.addEventListener('pointerdown', outside)
    window.addEventListener('scroll', scroll, true)
    window.addEventListener('resize', resize)
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('scroll', scroll, true); window.removeEventListener('resize', resize) }
    // Only attach listeners while the popup is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, searchable])
  useEffect(() => {
    if (!open) return
    const list = popup.current?.querySelector<HTMLElement>('.choice-select-options')
    const item = popup.current?.querySelector<HTMLElement>(`[data-option-index="${active}"]`)
    if (!list || !item) return
    const bounds = list.getBoundingClientRect(), optionBounds = item.getBoundingClientRect()
    if (optionBounds.top < bounds.top) list.scrollTop += optionBounds.top - bounds.top
    else if (optionBounds.bottom > bounds.bottom) list.scrollTop += optionBounds.bottom - bounds.bottom
  }, [active, open])
  const show = () => {
    if (native.current?.matches(':disabled')) return
    setQuery(''); setActive(Math.max(0, options.findIndex(option => option.value === value && !option.disabled))); setOpen(true)
  }
  const choose = (option: Option) => {
    if (option.disabled || native.current?.matches(':disabled')) return
    if (native.current) {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set?.call(native.current, option.value)
      native.current.dispatchEvent(new Event('change', { bubbles: true }))
    }
    setInvalid(false); close(true)
  }
  const keyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Tab') { if (open) close(true); return }
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(true); return }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); event.stopPropagation()
      if (!open) { show(); return }
      const enabled = filtered.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0)
      const index = enabled.indexOf(active)
      setActive(event.key === 'Home' ? enabled[0] ?? 0 : event.key === 'End' ? enabled.at(-1) ?? 0 : enabled[(index + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length] ?? 0)
      return
    }
    if (event.key === 'Enter' || (event.key === ' ' && event.target === trigger.current)) {
      event.preventDefault(); event.stopPropagation()
      if (!open) show(); else if (filtered[active]) choose(filtered[active])
      return
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && event.target === trigger.current) {
      event.preventDefault()
      const now = Date.now()
      typing.current = { text: now - typing.current.time > 800 ? event.key : typing.current.text + event.key, time: now }
      if (!open) show()
      const index = filtered.findIndex(option => !option.disabled && normalize(option.label).startsWith(normalize(typing.current.text)))
      if (index >= 0) setActive(index)
    }
  }
  return <div className={`choice-select ${className}`}>
    <select {...props} ref={native} className="choice-select-native" tabIndex={-1} aria-hidden="true" onFocus={event => { trigger.current?.focus(); props.onFocus?.(event) }} onInvalid={event => { event.preventDefault(); setInvalid(true); trigger.current?.focus(); props.onInvalid?.(event) }}>{children}</select>
    <button ref={trigger} id={props.id ? `${props.id}-trigger` : undefined} className="choice-select-trigger" type="button" role="combobox" disabled={props.disabled} aria-label={props['aria-label'] || label || selected?.label || 'Chọn mục'} aria-labelledby={props['aria-labelledby']} aria-expanded={open} aria-haspopup="listbox" aria-controls={open ? listId : undefined} aria-activedescendant={open && filtered[active] ? `${listId}-${active}` : undefined} aria-required={props.required} aria-invalid={invalid || props['aria-invalid']} onClick={() => open ? close() : show()} onKeyDown={keyboard}>
      <span className="choice-select-value">{selected?.label || 'Chọn mục'}</span><svg className="choice-select-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
    {invalid && <small className="choice-select-error" role="alert">Vui lòng chọn một mục.</small>}
    {open && createPortal(<div ref={popup} className="choice-select-popup" style={position} onKeyDown={keyboard}>
      {searchable && <div className="choice-select-search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.7" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg><input ref={search} value={query} placeholder="Tìm trong danh sách…" aria-label="Tìm trong danh sách lựa chọn" role="combobox" aria-expanded="true" aria-controls={listId} aria-activedescendant={filtered[active] ? `${listId}-${active}` : undefined} onChange={event => { setQuery(event.target.value); setActive(0) }} /></div>}
      <div id={listId} className="choice-select-options" role="listbox" aria-label={label || 'Danh sách lựa chọn'}>{filtered.length ? filtered.map((option, index) => <div id={`${listId}-${index}`} key={`${option.value}-${index}`} role="option" aria-selected={option.value === value} aria-disabled={option.disabled || undefined} className={`choice-select-option${option.value === value ? ' selected' : ''}${index === active ? ' highlighted' : ''}`} data-value={option.value} data-option-index={index} onPointerMove={() => { if (!option.disabled) setActive(index) }} onMouseDown={event => event.preventDefault()} onClick={() => choose(option)}><span>{option.label}</span>{option.value === value && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}</div>) : <p className="choice-select-empty">Không có lựa chọn phù hợp.</p>}</div>
    </div>, document.body)}
  </div>
}
