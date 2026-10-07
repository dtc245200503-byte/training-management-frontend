import { createContext } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

export interface NotificationContextValue {
  toasts: ToastMessage[]
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void
  removeToast: (id: string) => void
}

export const NotificationContext = createContext<NotificationContextValue | null>(null)
