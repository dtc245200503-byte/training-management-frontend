import { refreshAccessToken } from './authService'

const API_URL = `${window.location.protocol}//${window.location.hostname}:8000/api/curriculums`

export type ProgramStatus = 'active' | 'inactive'
export interface ProgramData {
  code: string
  name: string
  description: string | null
  total_duration_hours: string
  standard_tuition: string
  status: ProgramStatus
}
export interface TrainingProgram extends ProgramData {
  curriculum_id: number
  active_class_count: number
  total_class_count: number
  can_delete: boolean
}
export interface ProgramList {
  items: TrainingProgram[]
  total: number
  page: number
  page_size: number
}

export class ProgramSessionError extends Error {}
export class ProgramPermissionError extends Error {}

const fieldMessages: Record<string, string> = {
  code: 'Mã chương trình phải có tối đa 50 ký tự, chỉ gồm chữ không dấu, số, dấu gạch ngang hoặc gạch dưới.',
  name: 'Vui lòng nhập tên chương trình, tối đa 100 ký tự.',
  description: 'Mô tả không được vượt quá 5.000 ký tự.',
  total_duration_hours: 'Tổng thời lượng phải lớn hơn 0, tối đa 999.999,99 giờ và có tối đa 2 chữ số thập phân.',
  standard_tuition: 'Học phí phải là số nguyên từ 0 đến 999.999.999.999 VNĐ.',
  status: 'Trạng thái chương trình không hợp lệ.',
  subject_id: 'Vui lòng chọn một môn học hợp lệ.',
  sequence_order: 'Vị trí môn học phải là số nguyên lớn hơn 0.',
  prerequisite_subject_id: 'Vui lòng chọn môn tiên quyết trong chương trình hoặc không có môn tiên quyết.',
  items: 'Danh sách thứ tự môn học không hợp lệ. Vui lòng tải lại lộ trình.',
}

async function request<T>(path = '', method = 'GET', body?: unknown): Promise<T> {
  let token = localStorage.getItem('access_token')
  const refresh = async () => {
    try { token = (await refreshAccessToken()).access_token }
    catch { throw new ProgramSessionError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') }
  }
  if (!token) await refresh()
  const send = () => fetch(`${API_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  let response = await send()
  if (response.status === 401) { await refresh(); response = await send() }
  if (response.status === 401 || response.status === 423) throw new ProgramSessionError('Phiên đăng nhập không còn hiệu lực.')
  if (response.status === 403) throw new ProgramPermissionError('Bạn không có quyền quản lý chương trình đào tạo.')
  const data = await response.json()
  if (!response.ok) {
    if (Array.isArray(data.detail)) {
      const errors = data.detail.map((item: { loc?: string[] }) => fieldMessages[item.loc?.[1] || ''] || 'Thông tin chương trình không hợp lệ.')
      throw new Error([...new Set(errors)].join(' '))
    }
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Không thể thực hiện thao tác. Vui lòng thử lại.')
  }
  return data
}

export const listPrograms = (search: string, status: string, page: number) => {
  const query = new URLSearchParams({ search, page: String(page), page_size: '20' })
  if (status) query.set('status', status)
  return request<ProgramList>(`?${query}`)
}
export const saveProgram = (data: ProgramData, id?: number) => request<TrainingProgram>(id ? `/${id}` : '', id ? 'PUT' : 'POST', data)
export const setProgramStatus = (id: number, status: ProgramStatus) => request<TrainingProgram>(`/${id}/status`, 'PATCH', { status })
export const deleteProgram = (id: number) => request<{ message: string }>(`/${id}`, 'DELETE')

export interface CurriculumItem {
  id: number
  curriculum_id: number
  subject_id: number
  subject_code: string
  subject_name: string
  session_count: number
  weight: string
  learning_outcomes: string | null
  sequence_order: number
  prerequisite_subject_id: number | null
  prerequisite_subject_name: string | null
}
export interface AvailableSubject { subject_id: number; code: string; name: string; session_count: number }
export const getProgram = (id: number) => request<TrainingProgram>(`/${id}`)
export const getLearningPath = (id: number) => request<CurriculumItem[]>(`/${id}/subjects`)
export const getAvailableSubjects = (id: number, search: string, page: number) => request<{ items: AvailableSubject[]; total: number }>(`/${id}/available-subjects?${new URLSearchParams({ search, page: String(page), page_size: '20' })}`)
export const addProgramSubject = (id: number, subjectId: number, prerequisite: number | null) => request<CurriculumItem>(`/${id}/subjects`, 'POST', { subject_id: subjectId, prerequisite_subject_id: prerequisite })
export const removeProgramSubject = (id: number, subjectId: number) => request(`/${id}/subjects/${subjectId}`, 'DELETE')
export const setPrerequisite = (id: number, subjectId: number, prerequisite: number | null) => request<CurriculumItem>(`/${id}/subjects/${subjectId}/prerequisite`, 'PATCH', { prerequisite_subject_id: prerequisite })
export const reorderLearningPath = (id: number, subjects: CurriculumItem[]) => request<{ items: CurriculumItem[] }>(`/${id}/subjects/reorder`, 'PUT', { items: subjects.map((item, index) => ({ subject_id: item.subject_id, sequence_order: index + 1 })) })
