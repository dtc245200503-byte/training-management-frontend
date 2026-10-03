import {
  Link,
  useNavigate,
} from 'react-router-dom'


interface ErrorPageProps {
  statusCode: number
  title: string
  message: string
}


function ErrorPage({
  statusCode,
  title,
  message,
}: ErrorPageProps) {
  const navigate = useNavigate()


  return (
    <div className="error-page">
      <div className="error-card">
        <div className="error-status">
          {statusCode}
        </div>

        <div className="error-icon">
          {statusCode === 403 ? (
            <svg viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 9l6 6" />
              <path d="M15 9l-6 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
              <path d="M9 9l4 4" />
              <path d="M13 9l-4 4" />
            </svg>
          )}
        </div>

        <h1>
          {title}
        </h1>

        <p>
          {message}
        </p>

        <div className="error-actions">
          <Link
            to="/"
            className="error-action-primary"
          >
            Về trang chủ
          </Link>

          <button
            type="button"
            className="error-action-secondary"
            onClick={() => navigate(-1)}
          >
            Quay lại trang trước
          </button>
        </div>
      </div>
    </div>
  )
}


export default ErrorPage