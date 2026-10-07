import { refreshAccessToken } from './authService'

const API_URL = `${window.location.protocol}//${window.location.hostname}:8000/api/subjects`
export interface SubjectData {
  code: string
  name: string
  session_count: number
  weight: string
  learning_outcomes: string | null
}
export interface SubjectProgram { curriculum_id: number; code: string; name: string; is_deleted: boolean }
export interface Subject extends SubjectData {
  subject_id: number
  class_count: number
  prerequisite_count: number
  can_delete: boolean
  programs: SubjectProgram[]
}
export interface ProgramOption { curriculum_id: number; code: string; name: string; status: 'active' | 'inactive' }
export class SubjectSessionError extends Error {}
export class SubjectPermissionError extends Error {}

const messages: Record<string, string> = {
  code: 'Mã môn tối đa 50 ký tự, chỉ gồm chữ không dấu, số, gạch ngang hoặc gạch dưới.',
  name: 'Tên môn học cần có từ 1 đến 255 ký tự.',
  session_count: 'Số buổi phải là số nguyên từ 1 đến 1.000.',
  weight: 'Trọng số phải lớn hơn 0, tối đa 9.999,99 và có tối đa 2 chữ số thập phân.',
  learning_outcomes: 'Chuẩn đầu ra không được vượt quá 5.000 ký tự.',
  curriculum_ids: 'Danh sách chương trình không hợp lệ hoặc bị trùng.',
  sequence_order: 'Số thứ tự buổi học phải là số nguyên từ 1 đến số buổi của môn.',
  topic: 'Chủ đề cần có từ 1 đến 255 ký tự.',
  objectives: 'Mục tiêu cần có từ 1 đến 5.000 ký tự.',
  source_subject_id: 'Vui lòng chọn môn nguồn hợp lệ.',
  mode: 'Vui lòng chọn cách nhân bản hợp lệ.',
}

async function request<T>(path = '', method = 'GET', body?: unknown): Promise<T> {
  let token = localStorage.getItem('access_token')
  const refresh = async () => {
    try { token = (await refreshAccessToken()).access_token }
    catch { throw new SubjectSessionError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') }
  }
  if (!token) await refresh()
  const send = () => fetch(`${API_URL}${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  let response = await send()
  if (response.status === 401) { await refresh(); response = await send() }
  if (response.status === 401 || response.status === 423) throw new SubjectSessionError('Phiên đăng nhập không còn hiệu lực.')
  if (response.status === 403) throw new SubjectPermissionError('Bạn không có quyền thực hiện thao tác này với môn học.')
  const data = await response.json()
  if (!response.ok) {
    if (Array.isArray(data.detail)) {
      const errors = data.detail.map((item: { loc?: string[] }) => messages[item.loc?.[1] || ''] || 'Thông tin môn học không hợp lệ.')
      throw new Error([...new Set(errors)].join(' '))
    }
    throw new Error(typeof data.detail === 'string' && data.detail !== 'Not Found' ? data.detail : 'Không thể xử lý môn học. Vui lòng thử lại.')
  }
  return data
}

export const listSubjects = (search: string, page: number) => request<{ items: Subject[]; total: number }>(`?${new URLSearchParams({ search, page: String(page), page_size: '20' })}`)
export const saveSubject = (data: SubjectData, id?: number) => request<Subject>(id ? `/${id}` : '', id ? 'PUT' : 'POST', data)
export const deleteSubject = (id: number) => request(`/${id}`, 'DELETE')
export const getProgramOptions = () => request<ProgramOption[]>('/program-options')
export const setSubjectPrograms = (id: number, ids: number[]) => request<Subject>(`/${id}/programs`, 'PUT', { curriculum_ids: ids })

export interface LessonData { sequence_order: number; topic: string; objectives: string }
export interface SubjectLesson extends LessonData { lesson_id: number }
export interface SubjectLessons { subject_id: number; code: string; name: string; session_count: number; items: SubjectLesson[] }
export const getSubjectLessons = (id: number) => request<SubjectLessons>(`/${id}/lessons`)
export const saveSubjectLesson = (id: number, data: LessonData, lessonId?: number) => request<SubjectLesson>(`/${id}/lessons${lessonId ? `/${lessonId}` : ''}`, lessonId ? 'PUT' : 'POST', data)
export const deleteSubjectLesson = (id: number, lessonId: number) => request(`/${id}/lessons/${lessonId}`, 'DELETE')
export const cloneSubjectLessons = (id: number, sourceId: number, mode: 'append' | 'replace') => request<SubjectLessons>(`/${id}/lessons/clone`, 'POST', { source_subject_id: sourceId, mode })
