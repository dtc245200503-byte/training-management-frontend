import { useEffect } from 'react'


interface ToastProps {
  message: string

  type?: 'success' | 'warning'

  onClose: () => void
}


function Toast({
  message,
  type = 'success',
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        onClose()
      },
      3000,
    )

    return () => {
      window.clearTimeout(timer)
    }
  }, [message, onClose])


  return (
    <div
      className={`toast toast-${type}`}
      role="status"
    >
      <div className="toast-icon">
        {type === 'success'
          ? '✓'
          : '!'}
      </div>

      <span className="toast-message">
        {message}
      </span>

      <button
        type="button"
        className="toast-close"
        onClick={onClose}
        aria-label="Đóng thông báo"
      >
        ×
      </button>
    </div>
  )
}


export default Toast