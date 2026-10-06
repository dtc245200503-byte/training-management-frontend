import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import {
  getAccessToken,
  refreshToken,
  clearSession,
  notifyAuthFailure,
} from './authService'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: tự động đính kèm Bearer access_token nếu có
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => Promise.reject(error)
)

// Response interceptor: tự động refresh token khi nhận 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (!originalRequest) {
      return Promise.reject(error)
    }

    const url = originalRequest.url || ''
    const isAuthEndpoint = url.includes('/api/auth/login') || url.includes('/api/auth/refresh')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true

      try {
        const newAccessToken = await refreshToken()
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return apiClient(originalRequest)
        } else {
          clearSession()
          notifyAuthFailure()
          return Promise.reject(error)
        }
      } catch (refreshErr) {
        clearSession()
        notifyAuthFailure()
        return Promise.reject(refreshErr)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
