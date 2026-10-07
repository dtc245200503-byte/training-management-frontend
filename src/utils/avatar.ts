const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export function getFullAvatarUrl(avatarPath?: string | null): string | null {
  if (!avatarPath) return null
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath
  }
  return `${API_URL}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`
}
