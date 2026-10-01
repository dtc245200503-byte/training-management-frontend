import { Link } from 'react-router-dom'


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
  return (
    <div className="error-page">
      <div className="error-code">
        {statusCode}
      </div>

      <h1>{title}</h1>

      <p>{message}</p>

      <Link
        to="/"
        className="error-action"
      >
        Về trang chủ
      </Link>
    </div>
  )
}


export default ErrorPage