import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { CurrentUser } from '../types/auth'
import { ProfileSessionError, removeAvatar, uploadAvatar } from '../services/profileService'

interface AvatarEditorProps {
  user: CurrentUser
  onUpdated: (user: CurrentUser) => void
  onSuccess: (message: string) => void
  onSessionExpired: () => void
}

export default function AvatarEditor({ user, onUpdated, onSuccess, onSessionExpired }: AvatarEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!file) {
      setPreview('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (!selected) return
    setError('')
    if (!['image/jpeg', 'image/png'].includes(selected.type)) {
      setError('Vui lòng chọn ảnh JPG hoặc PNG.')
      return
    }
    if (selected.size > 2 * 1024 * 1024) {
      setError('Ảnh đại diện không được vượt quá 2 MB.')
      return
    }
    setFile(selected)
  }

  const saveAvatar = async (remove = false) => {
    if (saving || (!remove && !file)) return
    setSaving(true)
    setError('')
    try {
      const updated = remove ? await removeAvatar() : await uploadAvatar(file!)
      onUpdated(updated)
      setFile(null)
      onSuccess(remove ? 'Đã xóa ảnh đại diện.' : 'Cập nhật ảnh đại diện thành công.')
    } catch (err) {
      if (err instanceof ProfileSessionError) onSessionExpired()
      setError(err instanceof Error && !(err instanceof TypeError)
        ? err.message : 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const image = preview || user.avatar_url
  return (
    <section className="avatar-editor" aria-labelledby="avatar-title" aria-busy={saving}>
      <div className="profile-avatar" aria-label="Ảnh đại diện hiện tại">
        {image ? <img src={image} alt="Ảnh đại diện" />
          : <span>{user.full_name.trim().charAt(0).toUpperCase()}</span>}
      </div>
      <div className="avatar-details">
        <h2 id="avatar-title">Ảnh đại diện</h2>
        <p>Chọn ảnh JPG hoặc PNG, tối đa 2 MB. Ảnh sẽ được cắt vuông ở giữa và tạo bản thu nhỏ.</p>
        <input ref={inputRef} id="avatar-file" className="avatar-file-input" type="file"
          accept="image/jpeg,image/png" aria-label="Chọn ảnh đại diện"
          disabled={saving} onChange={selectFile} />
        <div className="avatar-actions">
          <button type="button" className="avatar-button" disabled={saving}
            onClick={() => inputRef.current?.click()}>{image ? 'Đổi ảnh' : 'Chọn ảnh'}</button>
          {file ? <>
            <button type="button" className="avatar-button avatar-save" disabled={saving}
              onClick={() => saveAvatar()}>{saving ? 'Đang lưu ảnh...' : 'Lưu ảnh'}</button>
            <button type="button" className="avatar-button avatar-cancel" disabled={saving}
              onClick={() => { setFile(null); setError('') }}>Hủy chọn ảnh</button>
          </> : user.avatar_url && <button type="button" className="avatar-button avatar-remove"
            disabled={saving} onClick={() => saveAvatar(true)}>{saving ? 'Đang xóa ảnh...' : 'Xóa ảnh'}</button>}
        </div>
        {file && <p className="avatar-file-name">Ảnh đã chọn: {file.name}. Bấm Lưu ảnh để cập nhật.</p>}
        {error && <p className="profile-error avatar-error" role="alert">{error}</p>}
      </div>
    </section>
  )
}
