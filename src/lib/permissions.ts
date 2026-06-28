import type { UserInfo } from '../components/AuthModal'

export function canDeletePost(user: UserInfo | null, postAuthorId?: string): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  if (postAuthorId && user.id === postAuthorId) return true
  return false
}

export function canDeleteComment(user: UserInfo | null, commentAuthorId?: string): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  if (commentAuthorId && user.id === commentAuthorId) return true
  return false
}

export function canManagePost(user: UserInfo | null, postAuthorId?: string): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  if (postAuthorId && user.id === postAuthorId) return true
  return false
}
