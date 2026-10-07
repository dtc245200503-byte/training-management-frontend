interface ModulePlaceholderProps {
  title: string
  description: string
  icon?: string
}

export default function ModulePlaceholder({ title, description, icon = '📁' }: ModulePlaceholderProps) {
  return (
    <div className="module-placeholder">
      <div className="placeholder-card">
        <span className="placeholder-icon" aria-hidden="true">
          {icon}
        </span>
        <h2 className="placeholder-title">{title}</h2>
        <p className="placeholder-desc">{description}</p>
        <div className="placeholder-note">
          Tính năng này đã được định tuyến và cấp quyền theo vai trò của bạn thành công.
        </div>
      </div>
    </div>
  )
}
