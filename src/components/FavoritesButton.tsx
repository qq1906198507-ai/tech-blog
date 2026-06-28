import { useRealtimeFavorites } from '../hooks/useRealtimeFavorites'
import { favoriteService } from '../services/database'
import { useToast } from '../lib/ToastContext'
import type { UserInfo } from './AuthModal'

interface FavoritesButtonProps {
  postId: string
  user?: UserInfo | null
}

export default function FavoritesButton({ postId, user }: FavoritesButtonProps) {
  const { showToast } = useToast()
  const userId = user?.id || null
  const { favorited } = useRealtimeFavorites(postId, userId)

  const handleToggle = async () => {
    if (!userId) {
      showToast('请先登录后再收藏', 'warning')
      return
    }

    try {
      const result = await favoriteService.toggleFavorite(postId, userId)
      showToast(result ? '已加入收藏' : '已取消收藏', result ? 'success' : 'info')
    } catch (error) {
      console.error('Error toggling favorite:', error)
      showToast('操作失败，请重试', 'error')
    }
  }

  return (
    <button
      onClick={handleToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        borderRadius: '999px',
        fontSize: '0.85rem',
        fontWeight: 500,
        color: favorited ? 'var(--accent-amber)' : 'var(--text-secondary)',
        background: favorited ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-card)',
        border: `1px solid ${favorited ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'}`,
        transition: 'all var(--transition-fast)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        if (!favorited) {
          e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)'
          e.currentTarget.style.color = 'var(--accent-amber)'
        }
      }}
      onMouseLeave={e => {
        if (!favorited) {
          e.currentTarget.style.borderColor = 'var(--border-color)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        style={{ transition: 'all 0.2s ease' }}
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      <span style={{ fontFamily: 'var(--font-mono)' }}>
        {favorited ? '已收藏' : '收藏'}
      </span>
    </button>
  )
}
