import { useState } from 'react'
import { useRealtimeLikes } from '../hooks/useRealtimeLikes'
import { likeService } from '../services/database'
import { useToast } from '../lib/ToastContext'
import type { UserInfo } from './AuthModal'

interface LikeButtonProps {
  postId: string
  user?: UserInfo | null
}

export default function LikeButton({ postId, user }: LikeButtonProps) {
  const [animating, setAnimating] = useState(false)
  const { showToast } = useToast()
  const userId = user?.id || null
  const { likes, liked } = useRealtimeLikes(postId, userId)

  const handleLike = async () => {
    if (!userId) {
      showToast('请先登录后再点赞', 'warning')
      return
    }

    setAnimating(true)

    try {
      await likeService.toggleLike(postId, userId)
    } catch (error) {
      console.error('Error toggling like:', error)
    }

    setTimeout(() => setAnimating(false), 300)
  }

  return (
    <button
      onClick={handleLike}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        borderRadius: '999px',
        fontSize: '0.85rem',
        fontWeight: 500,
        color: liked ? 'var(--accent-pink)' : 'var(--text-secondary)',
        background: liked ? 'rgba(236, 72, 153, 0.1)' : 'var(--bg-card)',
        border: `1px solid ${liked ? 'rgba(236, 72, 153, 0.3)' : 'var(--border-color)'}`,
        transition: 'all var(--transition-fast)',
        transform: animating ? 'scale(1.1)' : 'scale(1)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        if (!liked) {
          e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.3)'
          e.currentTarget.style.color = 'var(--accent-pink)'
        }
      }}
      onMouseLeave={e => {
        if (!liked) {
          e.currentTarget.style.borderColor = 'var(--border-color)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        style={{ transition: 'all 0.2s ease' }}
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
      <span style={{ fontFamily: 'var(--font-mono)' }}>{likes}</span>
    </button>
  )
}
