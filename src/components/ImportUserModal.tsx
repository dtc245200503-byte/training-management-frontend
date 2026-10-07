import {
  useState,
  useRef,
} from 'react'

import {
  downloadImportTemplate,
  previewUsersFromExcel,
  confirmImportUsers,
} from '../services/userService'

import type {
  ImportPreviewResponse,
  ImportSummaryResponse,
} from '../services/userService'


interface ImportUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (summaryText: string) => void
}

type ModalStep = 'SELECT_FILE' | 'PREVIEW' | 'SUMMARY'


export default function ImportUserModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportUserModalProps) {
  const [step, setStep] = useState<ModalStep>('SELECT_FILE')
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [error, setError] = useState('')
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null)
  const [summaryData, setSummaryData] = useState<ImportSummaryResponse | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen) {
    return null
  }

  const handleReset = () => {
    setStep('SELECT_FILE')
    setFile(null)
    setError('')
    setPreviewData(null)
    setSummaryData(null)
  }

  const handleClose = () => {
    if (loading) return
    if (step === 'SUMMARY') {
      handleFinish()
      return
    }
    handleReset()
    onClose()
  }

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    setError('')
    try {
      const blob = await downloadImportTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mau_nhap_nguoi_dung.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Không thể tải tệp mẫu.')
      }
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleFileSelected = (selectedFile: File) => {
    const validExtensions = ['.xlsx', '.xls']
    const hasValidExt = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext),
    )

    if (!hasValidExt) {
      setError('Vui lòng chỉ chọn tệp Excel có định dạng .xlsx hoặc .xls.')
      setFile(null)
      return
    }

    setFile(selectedFile)
    setError('')
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      handleFileSelected(event.target.files[0])
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFileSelected(event.dataTransfer.files[0])
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handlePreview = async () => {
    if (!file) {
      setError('Vui lòng chọn một tệp Excel để kiểm tra.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await previewUsersFromExcel(file)
      setPreviewData(data)
      setStep('PREVIEW')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Có lỗi xảy ra khi kiểm tra tệp Excel.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmImport = async () => {
    if (!previewData) return

    const validRows = previewData.rows
      .filter((row) => row.is_valid && row.role_id !== null)
      .map((row) => ({
        row_index: row.row_index,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        role_id: row.role_id as number,
      }))

    if (validRows.length === 0) {
      setError('Không có dòng hợp lệ nào để nhập.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await confirmImportUsers(validRows)
      setSummaryData(result)
      setStep('SUMMARY')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Có lỗi xảy ra khi nhập người dùng.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    const summaryText = summaryData?.summary_text || 'Nhập dữ liệu thành công.'
    handleReset()
    onSuccess(summaryText)
  }

  return (
    <div className="modal-overlay">
      <div
        className="user-modal"
        style={{
          maxWidth: step === 'PREVIEW' ? '920px' : '650px',
          transition: 'max-width 0.2s ease',
          padding: '28px',
        }}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Nhập người dùng từ Excel</h2>
            <p>
              {step === 'SELECT_FILE' && 'Tải lên tệp Excel chứa danh sách người dùng để tạo tài khoản hàng loạt.'}
              {step === 'PREVIEW' && 'Xem trước và kiểm tra tính hợp lệ của từng dòng trước khi nhập.'}
              {step === 'SUMMARY' && 'Báo cáo tổng kết quá trình nhập tài khoản người dùng.'}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-button"
            onClick={handleClose}
            disabled={loading}
            title="Đóng"
          >
            &times;
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '18px',
              fontSize: '14px',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: SELECT FILE */}
        {step === 'SELECT_FILE' && (
          <div>
            {/* Download Template Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <div>
                <strong style={{ color: '#1e40af', fontSize: '14px', display: 'block' }}>
                  Tải tệp mẫu chuẩn
                </strong>
                <span style={{ color: '#3b82f6', fontSize: '13px' }}>
                  Tệp mẫu chứa sẵn các cột và dữ liệu gợi ý định dạng.
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={downloadingTemplate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 15px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: downloadingTemplate ? 'not-allowed' : 'pointer',
                  opacity: downloadingTemplate ? 0.7 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>📥</span>
                {downloadingTemplate ? 'Đang tải...' : 'Tải tệp mẫu'}
              </button>
            </div>

            {/* File Dropzone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#2563eb' : '#cbd5e1'}`,
                backgroundColor: isDragging ? '#eff6ff' : '#f8fafc',
                borderRadius: '12px',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '20px',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleInputChange}
                style={{ display: 'none' }}
              />

              <div style={{ fontSize: '42px', marginBottom: '10px' }}>📄</div>

              {file ? (
                <div>
                  <div style={{ color: '#15803d', fontWeight: 600, fontSize: '15px' }}>
                    ✓ Đã chọn: {file.name}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
                    Dung lượng: {(file.size / 1024).toFixed(1)} KB — Nhấn để chọn tệp khác
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '15px' }}>
                    Nhấn vào đây hoặc kéo thả tệp Excel vào khung này
                  </div>
                  <div style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>
                    Chấp nhận định dạng .xlsx, .xls
                  </div>
                </div>
              )}
            </div>

            {/* Instruction list */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 18px',
                marginBottom: '24px',
                fontSize: '13px',
                color: '#475569',
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: '#0f172a' }}>Lưu ý định dạng dữ liệu:</strong>
              <ul style={{ margin: '6px 0 0 20px', padding: 0 }}>
                <li>Các cột bắt buộc: <strong>HoTen</strong>, <strong>Email</strong>, <strong>VaiTro</strong>.</li>
                <li>Cột <strong>SoDienThoai</strong> có thể để trống.</li>
                <li>Vai trò hỗ trợ: <em>Học viên, Giảng viên, Quản trị viên, Quản lý đào tạo,...</em></li>
                <li>Hệ thống sẽ kiểm tra toàn bộ dữ liệu trước khi bạn xác nhận nhập.</li>
              </ul>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handlePreview}
                disabled={loading || !file}
                className="primary-button"
                style={{
                  opacity: loading || !file ? 0.6 : 1,
                  cursor: loading || !file ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Đang đọc tệp...' : 'Xem trước dữ liệu'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === 'PREVIEW' && previewData && (
          <div>
            {/* Stats Summary Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>TỔNG SỐ DÒNG</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>
                  {previewData.total_rows}
                </div>
              </div>

              <div
                style={{
                  padding: '12px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>HỢP LỆ</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#15803d' }}>
                  {previewData.valid_count}
                </div>
              </div>

              <div
                style={{
                  padding: '12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>CÓ LỖI</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#b91c1c' }}>
                  {previewData.invalid_count}
                </div>
              </div>
            </div>

            {/* Warning if there are invalid rows */}
            {previewData.invalid_count > 0 && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#fffbeb',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  marginBottom: '14px',
                  fontSize: '13px',
                }}
              >
                ℹ️ <strong>Lưu ý:</strong> Có <strong>{previewData.invalid_count}</strong> dòng có lỗi. Khi bấm xác nhận, hệ thống sẽ <strong>chỉ nhập các dòng hợp lệ</strong> và tự động bỏ qua các dòng bị lỗi.
              </div>
            )}

            {/* Preview Table */}
            <div
              style={{
                maxHeight: '380px',
                overflow: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <table
                style={{
                  width: '100%',
                  minWidth: '700px',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                  textAlign: 'left',
                }}
              >
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 }}>
                    <th style={{ padding: '10px 12px', width: '60px' }}>Dòng</th>
                    <th style={{ padding: '10px 12px' }}>Họ và tên</th>
                    <th style={{ padding: '10px 12px' }}>Email</th>
                    <th style={{ padding: '10px 12px' }}>Số điện thoại</th>
                    <th style={{ padding: '10px 12px' }}>Vai trò</th>
                    <th style={{ padding: '10px 12px', width: '100px' }}>Trạng thái</th>
                    <th style={{ padding: '10px 12px' }}>Chi tiết lỗi</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((row) => (
                    <tr
                      key={row.row_index}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: row.is_valid ? '#ffffff' : '#fff5f5',
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#64748b' }}>
                        #{row.row_index}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 500, color: '#1e293b' }}>
                        {row.full_name || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {row.email || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>
                        {row.phone || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {row.role_name}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {row.is_valid ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#dcfce7',
                              color: '#15803d',
                            }}
                          >
                            Hợp lệ
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#fee2e2',
                              color: '#b91c1c',
                            }}
                          >
                            Có lỗi
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#b91c1c' }}>
                        {row.errors.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: '16px' }}>
                            {row.errors.map((err, idx) => (
                              <li key={idx} style={{ fontSize: '12px' }}>{err}</li>
                            ))}
                          </ul>
                        ) : (
                          <span style={{ color: '#15803d', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setStep('SELECT_FILE')}
                disabled={loading}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Chọn tệp khác
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={loading || previewData.valid_count === 0}
                  className="primary-button"
                  style={{
                    opacity: loading || previewData.valid_count === 0 ? 0.6 : 1,
                    cursor: loading || previewData.valid_count === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading
                    ? 'Đang nhập...'
                    : `Xác nhận nhập (${previewData.valid_count} dòng hợp lệ)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SUMMARY */}
        {step === 'SUMMARY' && summaryData && (
          <div>
            {/* Success Banner */}
            <div
              style={{
                textAlign: 'center',
                padding: '20px 0 10px',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
              <h3 style={{ margin: '0 0 6px', color: '#1e293b', fontSize: '20px' }}>
                {summaryData.message}
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                Dữ liệu tài khoản đã được đồng bộ vào hệ thống.
              </p>
            </div>

            {/* Summary Stat Box */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                margin: '20px 0',
              }}
            >
              <div
                style={{
                  padding: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>TỔNG SỐ</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
                  {summaryData.total_rows}
                </div>
              </div>

              <div
                style={{
                  padding: '14px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>THÀNH CÔNG</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803d', marginTop: '4px' }}>
                  {summaryData.success_count}
                </div>
              </div>

              <div
                style={{
                  padding: '14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '13px', color: '#991b1b', fontWeight: 600 }}>BỎ QUA / LỖI</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#b91c1c', marginTop: '4px' }}>
                  {summaryData.failed_count}
                </div>
              </div>
            </div>

            {/* Error List if any */}
            {summaryData.errors.length > 0 && (
              <div
                style={{
                  border: '1px solid #fee2e2',
                  background: '#fff5f5',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '20px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                }}
              >
                <strong style={{ color: '#991b1b', fontSize: '13px' }}>
                  Danh sách dòng bị bỏ qua ({summaryData.errors.length}):
                </strong>
                <ul style={{ margin: '8px 0 0 18px', padding: 0, color: '#b91c1c', fontSize: '13px' }}>
                  {summaryData.errors.map((err, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Final Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                className="primary-button"
                onClick={handleFinish}
                style={{ minWidth: '120px' }}
              >
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
