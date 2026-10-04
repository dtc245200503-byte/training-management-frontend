import type { MenuItem } from '../types/auth'

export const menuItems: MenuItem[] = [
  {
    name: 'Trang chủ',
    path: '/',
  },
  {
    name: 'Quản lý tài khoản',
    path: '/users',
    permission: 'USER_MANAGE',
  },
  {
    name: 'Vai trò và phân quyền',
    path: '/roles',
    permission: 'ROLE_MANAGE',
  },
  {
    name: 'Khóa học',
    path: '/courses',
    permission: 'COURSE_MANAGE',
  },
  {
    name: 'Lớp học',
    path: '/classes',
    permission: 'CLASS_MANAGE',
  },
  {
    name: 'Điểm',
    path: '/grades',
    permission: 'GRADE_VIEW',
  },
  {
    name: 'Học phí',
    path: '/tuition',
    permission: 'TUITION_VIEW',
  },
  {
    name: 'Điểm danh',
    path: '/attendance',
    permission: 'ATTENDANCE_VIEW',
  },
]