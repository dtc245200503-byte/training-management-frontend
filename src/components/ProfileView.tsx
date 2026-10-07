import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { getProfile, updateProfile, uploadAvatar } from '../services/profileService'
import type { UserProfileDetail, UserProfileUpdate } from '../types/profile'
import { useAuth } from '../context/useAuth'
import { useNotification } from '../context/useNotification'
import { getFullAvatarUrl } from '../utils/avatar'

export default function ProfileView() {
  const { user: authUser, updateUser } = useAuth()
  const { showSuccess, showError } = useNotification()

  const [profile, setProfile] = useState<UserProfileDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form editable fields
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [bio, setBio] = useState('')
  const [address, setAddress] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const applyProfileData = useCallback((data: UserProfileDetail) => {
    setProfile(data)
    setFullName(data.full_name || '')
    setPhoneNumber(data.phone_number || '')
    setBio(data.bio || '')
    setAddress(data.address || '')
    setDateOfBirth(data.date_of_birth || '')
    setGender(data.gender || '')
  }, [])

  const refetchProfile = useCallback(() => {
    setLoading(true)
    setError(null)
    getProfile()
      .then((data) => {
        applyProfileData(data)
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Không thể tải thông tin hồ sơ.'
        setError(msg)
        showError(msg)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [applyProfileData, showError])

  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((data) => {
        if (!cancelled) {
          applyProfileData(data)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Không thể tải thông tin hồ sơ.'
          setError(msg)
          showError(msg)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [applyProfileData, showError])

  // S2-02: Form Submit - Update Profile
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      showError('Họ và tên không được để trống.')
      return
    }

    setSaving(true)
    try {
      const payload: UserProfileUpdate = {
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim() || undefined,
        bio: bio.trim() || undefined,
        address: address.trim() || undefined,
        date_of_birth: dateOfBirth.trim() || undefined,
        gender: gender || undefined,
      }

      const updated = await updateProfile(payload)
      setProfile(updated)
      updateUser({
        full_name: updated.full_name,
        phone_number: updated.phone_number,
      })
      showSuccess('Cập nhật thông tin hồ sơ cá nhân thành công!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cập nhật hồ sơ thất bại.'
      showError(msg)
    } finally {
      setSaving(false)
    }
  }

  // S2-03: Avatar Selection & Validation
  const handleAvatarSelect = (e: ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Định dạng ảnh không hợp lệ. Vui lòng chọn file .jpg, .png hoặc .webp.')
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setAvatarError('Kích thước ảnh vượt quá giới hạn 5MB.')
      return
    }

    setAvatarFile(file)
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
  }

  // S2-03: Upload Avatar Submit
  const handleAvatarUpload = async () => {
    if (!avatarFile) return
    setUploadingAvatar(true)
    setAvatarError(null)

    try {
      const res = await uploadAvatar(avatarFile)
      showSuccess('Cập nhật ảnh đại diện thành công!')
      if (profile) {
        setProfile({ ...profile, avatar_url: res.avatar_url })
      }
      updateUser({ avatar_url: res.avatar_url })
      setAvatarFile(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tải lên ảnh đại diện thất bại.'
      setAvatarError(msg)
      showError(msg)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCancelAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarError(null)
  }

  if (loading) {
    return (
      <div className="management-page">
        <div className="loading-state">
          <div className="spinner-border text-primary" role="status" />
          <p>Đang tải thông tin hồ sơ cá nhân...</p>
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="management-page">
        <div className="alert alert-danger" role="alert">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <h4>Lỗi tải dữ liệu</h4>
            <p>{error}</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={refetchProfile}>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentAvatarSrc = avatarPreview || getFullAvatarUrl(profile?.avatar_url || authUser?.avatar_url)

  return (
    <div className="management-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Hồ sơ cá nhân</h2>
          <p className="page-subtitle">Xem và cập nhật thông tin cá nhân, ảnh đại diện và vai trò của bạn</p>
        </div>
      </header>

      <div className="profile-layout-grid">
        {/* LEFT COLUMN: Avatar & System Roles Card */}
        <div className="profile-sidebar-card">
          <div className="avatar-section">
            <div className="avatar-wrapper">
              {currentAvatarSrc ? (
                <img
                  src={currentAvatarSrc}
                  alt={fullName || profile?.email || 'Avatar'}
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {((fullName || profile?.email || 'U').charAt(0)).toUpperCase()}
                </div>
              )}
            </div>

            <div className="avatar-actions">
              <label htmlFor="avatar-file-input" className="btn btn-outline btn-sm">
                📷 Chọn ảnh đại diện
              </label>
              <input
                id="avatar-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarSelect}
                disabled={uploadingAvatar}
              />

              {avatarFile && (
                <div className="avatar-confirm-group">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? 'Đang lưu...' : 'Lưu ảnh'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleCancelAvatar}
                    disabled={uploadingAvatar}
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>

            {avatarError && <p className="avatar-error-text">{avatarError}</p>}
            <p className="avatar-hint">Định dạng JPG, PNG, WEBP (tối đa 5MB)</p>
          </div>

          <div className="profile-summary-meta">
            <h3 className="profile-name">{profile?.full_name || 'Chưa cập nhật họ tên'}</h3>
            <p className="profile-email">{profile?.email}</p>

            <div className="profile-status-badge">
              <span className={`badge ${profile?.is_active ? 'badge-success' : 'badge-danger'}`}>
                {profile?.is_active ? '● Đang hoạt động' : 'Đã khóa'}
              </span>
            </div>

            <div className="profile-roles-group">
              <span className="meta-label">Vai trò hệ thống:</span>
              <div className="roles-list">
                {profile?.roles && profile.roles.length > 0 ? (
                  profile.roles.map((r) => (
                    <span key={r} className={`role-badge role-${r.toLowerCase()}`}>
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="role-badge role-default">Người dùng</span>
                )}
              </div>
            </div>

            <div className="profile-date-meta">
              <span>Tham gia: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('vi-VN') : '—'}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Form */}
        <div className="profile-content-card">
          <h3 className="card-title">Chỉnh sửa thông tin cá nhân</h3>
          <p className="card-subtitle">Cập nhật thông tin chi tiết liên hệ và giới thiệu bản thân</p>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="profile-email" className="form-label">
                  Địa chỉ Email <span className="text-muted">(Không thể thay đổi)</span>
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="form-input form-input-disabled"
                  value={profile?.email || ''}
                  disabled
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile-fullname" className="form-label">
                  Họ và tên <span className="text-danger">*</span>
                </label>
                <input
                  id="profile-fullname"
                  type="text"
                  className="form-input"
                  placeholder="Nhập họ và tên"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="profile-phone" className="form-label">
                  Số điện thoại
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  className="form-input"
                  placeholder="VD: 0987654321"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile-dob" className="form-label">
                  Ngày sinh
                </label>
                <input
                  id="profile-dob"
                  type="date"
                  className="form-input"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="profile-gender" className="form-label">
                  Giới tính
                </label>
                <select
                  id="profile-gender"
                  className="form-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">-- Chọn giới tính --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="profile-address" className="form-label">
                  Địa chỉ
                </label>
                <input
                  id="profile-address"
                  type="text"
                  className="form-input"
                  placeholder="Địa chỉ cư trú"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="profile-bio" className="form-label">
                Tiểu sử / Giới thiệu bản thân
              </label>
              <textarea
                id="profile-bio"
                className="form-textarea"
                rows={4}
                placeholder="Chia sẻ đôi nét về kinh nghiệm, sở thích hoặc chuyên môn..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="form-actions-right">
              <button
                type="submit"
                id="btn-save-profile"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    <span> Đang lưu...</span>
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
