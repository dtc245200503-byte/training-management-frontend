const API_URL = `${window.location.protocol}//${window.location.hostname}:8000/api/public/consultations`
export interface ConsultationChallenge { challenge_token: string; question: string; expires_in: number; min_wait_seconds: number }
export interface ConsultationData { full_name: string; phone: string; email: string | null; interest: string | null; message: string | null; website: string; challenge_token: string; challenge_answer: string }
export interface ConsultationReceipt { status: 'new'; status_label: string; message: string; contact_promise: string }
export class ConsultationError extends Error {
  status: number
  retryAfter: number
  constructor(message: string, status: number, retryAfter = 0) { super(message); this.status = status; this.retryAfter = retryAfter }
}
const messages: Record<string, string> = {
  full_name: 'Họ và tên cần có từ 1 đến 100 ký tự.',
  phone: 'Vui lòng nhập số điện thoại Việt Nam hợp lệ, ví dụ 0912345678.',
  email: 'Email không hợp lệ hoặc vượt quá 255 ký tự.',
  interest: 'Chương trình quan tâm không được vượt quá 255 ký tự.',
  message: 'Nội dung tư vấn không được vượt quá 2.000 ký tự.',
  challenge_token: 'Câu hỏi xác minh không hợp lệ. Vui lòng lấy câu hỏi mới.',
  challenge_answer: 'Vui lòng nhập câu trả lời xác minh bằng số.',
}
async function request<T>(path = '', body?: ConsultationData, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: body ? 'POST' : 'GET', credentials: 'omit', cache: 'no-store', signal,
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  })
  const result = await response.json().catch(() => null)
  if (!response.ok) {
    const message = Array.isArray(result?.detail)
      ? [...new Set(result.detail.map((item: { loc?: string[] }) => messages[item.loc?.[1] || ''] || 'Thông tin đăng ký chưa hợp lệ.'))].join(' ')
      : typeof result?.detail === 'string' && result.detail !== 'Not Found' ? result.detail : 'Không thể gửi đăng ký lúc này. Vui lòng thử lại.'
    const retry = response.status === 429 ? Number(response.headers.get('Retry-After')) || 900 : 0
    throw new ConsultationError(message, response.status, retry)
  }
  return result as T
}
export const getConsultationChallenge = (signal?: AbortSignal) => request<ConsultationChallenge>('/challenge', undefined, signal)
export const sendConsultation = (data: ConsultationData) => request<ConsultationReceipt>('', data)
