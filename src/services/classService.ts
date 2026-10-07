import { refreshAccessToken } from './authService'
const API_URL = `${window.location.protocol}//${window.location.hostname}:8000/api/classes`
export interface TrainingClass {
  class_id: number; class_name: string; course_id: number | null; program_code: string | null; program_name: string | null
  instructor_id: number | null; instructor_name: string | null; start_date: string | null; status: string
  subjects: { subject_id: number; code: string; name: string; session_count: number }[]
}
export class ClassSessionError extends Error {}
export class ClassPermissionError extends Error {}
export async function listClasses(search: string, status: string, page: number): Promise<{ items: TrainingClass[]; total: number }> {
  let token = localStorage.getItem('access_token')
  const refresh = async () => { try { token = (await refreshAccessToken()).access_token } catch { throw new ClassSessionError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') } }
  if (!token) await refresh()
  const query = new URLSearchParams({ search, page: String(page), page_size: '20', ...(status ? { status } : {}) })
  const send = () => fetch(`${API_URL}?${query}`, { headers: { Authorization: `Bearer ${token}` } })
  let response = await send()
  if (response.status === 401) { await refresh(); response = await send() }
  if (response.status === 401 || response.status === 423) throw new ClassSessionError('Phiên đăng nhập không còn hiệu lực.')
  if (response.status === 403) throw new ClassPermissionError('Bạn không có quyền xem danh sách lớp học.')
  const result = await response.json()
  if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Không thể tải lớp học. Vui lòng thử lại.')
  return result
}
