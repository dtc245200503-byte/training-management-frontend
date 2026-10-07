import {
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import {
  NotificationContext,
  type ToastType,
  type ToastMessage,
} from './notificationContextInstance'

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      setToasts((prev) => [...prev, { id, type, message }])

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        removeToast(id)
      }, 5000)
    },
    [removeToast]
  )

  const showSuccess = useCallback((msg: string) => addToast('success', msg), [addToast])
  const showError = useCallback((msg: string) => addToast('error', msg), [addToast])
  const showWarning = useCallback((msg: string) => addToast('warning', msg), [addToast])
  const showInfo = useCallback((msg: string) => addToast('info', msg), [addToast])

  // Lắng nghe các sự kiện phân quyền / xác thực toàn cục (S1-07)
  useEffect(() => {
    const handleForbidden = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      const detail = customEvent.detail || 'Bạn không có quyền thực hiện thao tác này (403 Forbidden).'
      showError(detail)
    }

    const handleUnauthorized = () => {
      showWarning('Phiên làm việc đã kết thúc. Vui lòng đăng nhập lại.')
    }

    window.addEventListener('auth:forbidden', handleForbidden)
    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('auth:forbidden', handleForbidden)
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [showError, showWarning])

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeToast,
      }}
    >
      {children}
      {/* Toast container */}
      <div className="toast-container" role="region" aria-label="Thông báo hệ thống">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-item toast-${toast.type}`}
            role="alert"
            aria-live="polite"
          >
            <div className="toast-content">
              <span className="toast-icon">
                {toast.type === 'success' && '✓'}
                {toast.type === 'error' && '✕'}
                {toast.type === 'warning' && '⚠'}
                {toast.type === 'info' && 'ℹ'}
              </span>
              <span className="toast-message">{toast.message}</span>
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
