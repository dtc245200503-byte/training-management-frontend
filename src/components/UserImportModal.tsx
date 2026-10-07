import { useState, useRef } from 'react'
import { importUsersExcel } from '../services/userService'
import type { UserImportResult } from '../types/user'
import { useNotification } from '../context/useNotification'

interface UserImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess?: () => void
}

export default function UserImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: UserImportModalProps) {
  const { showSuccess, showError } = useNotification()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<UserImportResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = (file: File | null) => {
    setErrorMsg(null)
    setResult(null)

    if (!file) {
      setSelectedFile(null)
      return
    }

    // Validate file extension
    const allowedExtensions = ['.xlsx', '.xls']
    const fileName = file.name.toLowerCase()
    const isValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext))

    if (!isValidExtension) {
      setErrorMsg('Vui lòng chọn định dạng file Excel hợp lệ (.xlsx hoặc .xls).')
      setSelectedFile(null)
      return
    }

    // Validate size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setErrorMsg('Dung lượng file vượt quá giới hạn cho phép (tối đa 10MB).')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMsg('Vui lòng chọn một file Excel trước khi tải lên.')
      return
    }

    setIsUploading(true)
    setErrorMsg(null)
    setResult(null)

    try {
      const res = await importUsersExcel(selectedFile)
      setResult(res)

      if (res.imported_count > 0 && res.skipped_count === 0) {
        showSuccess(`Nhập thành công toàn bộ ${res.imported_count} người dùng từ file Excel!`)
        onImportSuccess?.()
      } else if (res.imported_count > 0 && res.skipped_count > 0) {
        showSuccess(
          `Nhập một phần: Đã tạo ${res.imported_count} người dùng, bỏ qua ${res.skipped_count} dòng lỗi.`
        )
        onImportSuccess?.()
      } else {
        showError(`Không có người dùng nào được nhập (${res.skipped_count} dòng không hợp lệ).`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nhập danh sách người dùng thất bại.'
      setErrorMsg(msg)
      showError(msg)
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setResult(null)
    setErrorMsg(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    if (isUploading) return
    handleReset()
    onClose()
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
      <div className="modal-card modal-lg">
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon-badge" aria-hidden="true">📥</span>
            <div>
              <h3 id="import-modal-title" className="modal-title">Nhập người dùng từ Excel</h3>
              <p className="modal-subtitle">Tải lên file danh sách tài khoản theo định dạng .xlsx hoặc .xls</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isUploading}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {errorMsg && (
            <div className="alert alert-danger" role="alert">
              <span className="alert-icon">⚠️</span>
              <div className="alert-content">{errorMsg}</div>
            </div>
          )}

          {/* Upload Area */}
          {!result && (
            <>
              <div
                className={`dropzone-container ${isDragging ? 'is-dragging' : ''} ${
                  selectedFile ? 'has-file' : ''
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click()
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    handleFileChange(file)
                  }}
                  disabled={isUploading}
                />

                <div className="dropzone-content">
                  <span className="dropzone-icon">📊</span>
                  {selectedFile ? (
                    <div className="file-info-box">
                      <span className="file-name">{selectedFile.name}</span>
                      <span className="file-size">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                      <span className="file-hint">Nhấp vào đây nếu muốn chọn file khác</span>
                    </div>
                  ) : (
                    <div>
                      <p className="dropzone-text">
                        Kéo thả file Excel vào đây hoặc <strong>nhấp để chọn file</strong>
                      </p>
                      <p className="dropzone-subtext">Hỗ trợ các định dạng .xlsx, .xls (tối đa 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="excel-template-hint">
                <span className="hint-icon">💡</span>
                <span>
                  Các cột yêu cầu trong file Excel: <code>email</code>, <code>full_name</code>,{' '}
                  <code>password</code> (tùy chọn), <code>role</code> (ADMIN, TRAINER, TRAINEE).
                </span>
              </div>
            </>
          )}

          {/* Results Summary */}
          {result && (
            <div className="import-result-section">
              <div
                className={`import-status-banner ${
                  result.imported_count > 0 && result.skipped_count === 0
                    ? 'status-success'
                    : result.imported_count > 0 && result.skipped_count > 0
                    ? 'status-partial'
                    : 'status-failed'
                }`}
              >
                <div className="status-icon">
                  {result.imported_count > 0 && result.skipped_count === 0
                    ? '✅'
                    : result.imported_count > 0 && result.skipped_count > 0
                    ? '⚠️'
                    : '❌'}
                </div>
                <div className="status-meta">
                  <h4>
                    {result.imported_count > 0 && result.skipped_count === 0
                      ? 'Nhập dữ liệu thành công hoàn toàn'
                      : result.imported_count > 0 && result.skipped_count > 0
                      ? 'Nhập dữ liệu thành công một phần'
                      : 'Nhập dữ liệu thất bại'}
                  </h4>
                  <p>
                    Đã xử lý tổng cộng <strong>{result.total_rows}</strong> dòng trong file Excel.
                  </p>
                </div>
              </div>

              <div className="stat-cards-grid">
                <div className="stat-card">
                  <span className="stat-label">Tổng số dòng</span>
                  <span className="stat-value">{result.total_rows}</span>
                </div>
                <div className="stat-card stat-success">
                  <span className="stat-label">Thành công</span>
                  <span className="stat-value">{result.imported_count}</span>
                </div>
                <div className="stat-card stat-danger">
                  <span className="stat-label">Bỏ qua / Lỗi</span>
                  <span className="stat-value">{result.skipped_count}</span>
                </div>
              </div>

              {/* Error Details Table */}
              {result.errors && result.errors.length > 0 && (
                <div className="error-details-box">
                  <h5 className="error-table-title">Chi tiết các dòng bị lỗi ({result.errors.length})</h5>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '80px' }}>Dòng</th>
                          <th>Email</th>
                          <th>Nguyên nhân</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.errors.map((err, idx) => (
                          <tr key={idx}>
                            <td>
                              <span className="badge badge-secondary">Dòng {err.row}</span>
                            </td>
                            <td>
                              <code>{err.email || '—'}</code>
                            </td>
                            <td className="text-danger">{err.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {result ? (
            <>
              <button type="button" className="btn btn-outline" onClick={handleReset}>
                Nhập file khác
              </button>
              <button type="button" className="btn btn-primary" onClick={handleClose}>
                Hoàn tất
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleClose}
                disabled={isUploading}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    <span> Đang tải lên...</span>
                  </>
                ) : (
                  'Bắt đầu nhập dữ liệu'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
