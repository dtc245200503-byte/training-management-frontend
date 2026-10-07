import { useState, useEffect, type FormEvent } from 'react'
import { submitPublicConsultation } from '../services/consultationService'
import { listPrograms } from '../services/trainingProgramService'
import type { PublicConsultationCreate } from '../types/consultation'
import type { TrainingProgramResponse } from '../types/trainingProgram'

interface PublicConsultationViewProps {
  onBackToLogin: () => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[0-9+()\-.\s]{8,20}$/

export default function PublicConsultationView({ onBackToLogin }: PublicConsultationViewProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [programId, setProgramId] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [honeypot, setHoneypot] = useState('')

  const [programs, setPrograms] = useState<TrainingProgramResponse[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Load programs list (public can view or if it falls back to empty array)
  useEffect(() => {
    let cancelled = false
    listPrograms({ limit: 50, status: 'ACTIVE' })
      .then((res) => {
        if (!cancelled) {
          setPrograms(res.items || [])
        }
      })
      .catch((err) => {
        console.warn('Could not load programs for public consultation:', err)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    // Honeypot spam bot check
    if (honeypot) {
      // Bot filled honeypot field, silent drop or success simulation
      setIsSuccess(true)
      return
    }

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Vui lòng nhập họ và tên của bạn (tối thiểu 2 ký tự).')
      return
    }

    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.')
      return
    }

    if (!phone.trim() || !PHONE_REGEX.test(phone.trim())) {
      setErrorMsg('Vui lòng nhập số điện thoại hợp lệ (8 - 20 chữ số).')
      return
    }

    setSubmitting(true)
    try {
      const payload: PublicConsultationCreate = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        program_id: programId !== '' ? Number(programId) : null,
        notes: notes.trim() || null,
        honeypot: honeypot || null,
      }

      await submitPublicConsultation(payload)
      setIsSuccess(true)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể gửi yêu cầu tư vấn lúc này. Vui lòng thử lại sau.'
      setErrorMsg(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetForm = () => {
    setFullName('')
    setEmail('')
    setPhone('')
    setProgramId('')
    setNotes('')
    setHoneypot('')
    setErrorMsg(null)
    setIsSuccess(false)
  }

  return (
    <div className="public-consultation-page">
      <div className="public-consultation-container">
        {/* Header / Brand */}
        <div className="public-header">
          <div className="navbar-logo-badge" style={{ margin: '0 auto 1rem', width: 'fit-content' }}>
            ICTU × CodeGym
          </div>
          <h2 className="public-title">Đăng Ký Tư Vấn Khóa Học</h2>
          <p className="public-subtitle">
            Để lại thông tin liên hệ của bạn, đội ngũ chuyên viên đào tạo sẽ kết nối và tư vấn lộ trình học phù hợp nhất!
          </p>
        </div>

        {/* Success Screen */}
        {isSuccess ? (
          <div className="consultation-success-card">
            <div className="success-icon-badge">🎉</div>
            <h3 className="success-title">Gửi yêu cầu tư vấn thành công!</h3>
            <p className="success-desc">
              Cảm ơn bạn <strong>{fullName}</strong> đã quan tâm đến chương trình đào tạo của chúng tôi.
              Chuyên viên tư vấn sẽ liên hệ với bạn qua email <strong>{email}</strong> hoặc số điện thoại{' '}
              <strong>{phone}</strong> trong thời gian sớm nhất.
            </p>

            <div className="success-actions">
              <button type="button" className="btn btn-outline" onClick={handleResetForm}>
                Gửi thêm yêu cầu khác
              </button>
              <button type="button" className="btn btn-primary" onClick={onBackToLogin}>
                Quay lại trang Đăng nhập
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <div className="consultation-form-card">
            {errorMsg && (
              <div className="alert alert-danger" role="alert">
                <span className="alert-icon">⚠️</span>
                <div className="alert-content">{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Honeypot field (hidden from real users) */}
              <div style={{ display: 'none' }} aria-hidden="true">
                <label htmlFor="hp-field">Leave this empty</label>
                <input
                  id="hp-field"
                  type="text"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label htmlFor="consult-fullname" className="form-label">
                  Họ và tên của bạn <span className="text-danger">*</span>
                </label>
                <input
                  id="consult-fullname"
                  type="text"
                  className="form-input"
                  placeholder="VD: Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="consult-email" className="form-label">
                    Địa chỉ Email <span className="text-danger">*</span>
                  </label>
                  <input
                    id="consult-email"
                    type="email"
                    className="form-input"
                    placeholder="VD: nguyenvana@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="consult-phone" className="form-label">
                    Số điện thoại liên hệ <span className="text-danger">*</span>
                  </label>
                  <input
                    id="consult-phone"
                    type="tel"
                    className="form-input"
                    placeholder="VD: 0987654321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="consult-program" className="form-label">
                  Chương trình đào tạo quan tâm
                </label>
                <select
                  id="consult-program"
                  className="form-select"
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value ? Number(e.target.value) : '')}
                  disabled={submitting}
                >
                  <option value="">-- Chọn khóa học bạn đang quan tâm (hoặc tư vấn chung) --</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.duration_hours} giờ)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="consult-notes" className="form-label">
                  Nhu cầu / Câu hỏi của bạn
                </label>
                <textarea
                  id="consult-notes"
                  className="form-textarea"
                  rows={4}
                  placeholder="Bạn có thắc mắc gì về lịch học, học phí, định hướng nghề nghiệp?..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="form-footer-action">
                <button
                  type="submit"
                  id="btn-submit-consultation"
                  className="btn btn-primary btn-block"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span> Đang gửi yêu cầu...</span>
                    </>
                  ) : (
                    'Gửi yêu cầu tư vấn ngay'
                  )}
                </button>
              </div>

              <div className="form-back-link">
                <button type="button" className="link-button" onClick={onBackToLogin}>
                  ← Quay lại trang đăng nhập hệ thống
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
