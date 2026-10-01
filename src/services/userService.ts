const API_URL = 'http://127.0.0.1:8000'


export interface UserItem {
  user_id: number
  username: string
  full_name: string
  email: string
  phone: string | null
  role_id: number
  status: 'active' | 'locked'
}


export interface UserListResponse {
  page: number
  page_size: number
  total: number
  items: UserItem[]
}


export interface GetUsersParams {
  search?: string
  role_id?: number
  status?: string
  page?: number
  page_size?: number
}


export interface CreateUserData {
  username: string
  full_name: string
  email: string
  phone: string
  role_id: number
}


export interface UpdateUserData {
  full_name?: string
  email?: string
  phone?: string
  role_id?: number
}


function getAccessToken(): string {
  const token = localStorage.getItem('access_token')

  if (!token) {
    throw new Error('Bạn chưa đăng nhập.')
  }

  return token
}


export async function getUsers(
  params: GetUsersParams = {},
): Promise<UserListResponse> {
  const query = new URLSearchParams()

  if (params.search) {
    query.set('search', params.search)
  }

  if (params.role_id !== undefined) {
    query.set(
      'role_id',
      String(params.role_id),
    )
  }

  if (params.status) {
    query.set('status', params.status)
  }

  query.set(
    'page',
    String(params.page ?? 1),
  )

  query.set(
    'page_size',
    String(params.page_size ?? 20),
  )

  const response = await fetch(
    `${API_URL}/api/users?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    },
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail
        || 'Không thể tải danh sách tài khoản.',
    )
  }

  return data
}


export async function createUser(
  data: CreateUserData,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/users`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(data),
    },
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.detail
        || 'Không thể tạo tài khoản.',
    )
  }
}


export async function updateUser(
  userId: number,
  data: UpdateUserData,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/users/${userId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(data),
    },
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.detail
        || 'Không thể cập nhật tài khoản.',
    )
  }
}