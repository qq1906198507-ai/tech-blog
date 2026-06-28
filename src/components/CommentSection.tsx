import { useState, useEffect } from 'react'
import { commentService } from '../services/database'
import { supabase } from '../lib/supabase'
import { useSettings } from '../lib/SettingsContext'
import { CommentListSkeleton } from './Skeleton'

interface Comment {
  id: string
  post_id: string
  user_id: string | null
  author: string
  avatar: string | null
  content: string
  parent_id: string | null
  created_at: string
  status?: 'approved' | 'pending'
  replies?: Comment[]
}

interface CommentSectionProps {
  postId: string
  user?: { name: string; avatar: string } | null
}

export default function CommentSection({ postId, user }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [pendingNotice, setPendingNotice] = useState(false)
  const settings = useSettings()

  useEffect(() => {
    const getUser = async () => {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser()
        setUserId(user?.id || null)
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    loadComments()
  }, [postId])

  const loadComments = async () => {
    try {
      setLoading(true)
      const data = await commentService.getComments(postId)
      setComments(data)
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!newComment.trim()) return

    const authorName = user?.name || '匿名用户'
    const authorAvatar = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`
    const currentUserId = userId || 'anonymous'

    try {
      const newCommentData = await commentService.addComment(
        postId,
        currentUserId,
        authorName,
        authorAvatar,
        newComment.trim(),
        replyTo || undefined,
        settings.requireApproval
      )

      if (settings.requireApproval && newCommentData.status === 'pending') {
        setPendingNotice(true)
        setTimeout(() => setPendingNotice(false), 5000)
      }

      if (replyTo) {
        setComments(prev => prev.map(c => {
          if (c.id === replyTo) {
            return { ...c, replies: [...(c.replies || []), newCommentData] }
          }
          return c
        }))
        setReplyTo(null)
      } else if (!settings.requireApproval) {
        setComments(prev => [newCommentData, ...prev])
      }
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!userId) return

    try {
      await commentService.deleteComment(commentId, userId)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const totalComments = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0)

  if (!settings.allowComments) {
    return (
      <div style={{ marginTop: '48px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
          评论
        </h3>
        <div style={{
          padding: '32px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3, marginBottom: '12px' }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <div style={{ fontSize: '0.9rem' }}>评论功能已关闭</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '48px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}>
          评论
        </h3>
        <span style={{
          padding: '3px 10px',
          borderRadius: '999px',
          fontSize: '0.7rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent-cyan)',
          background: 'rgba(0, 212, 255, 0.1)',
        }}>
          {totalComments}
        </span>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '32px',
        alignItems: 'flex-start',
      }}>
        <img
          src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=guest`}
          alt="avatar"
          loading="lazy"
          decoding="async"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--bg-tertiary)',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }}>
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder={replyTo ? '写下你的回复...' : '写下你的评论...'}
            rows={3}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              resize: 'none',
              fontFamily: 'var(--font-sans)',
              transition: 'border-color var(--transition-fast)',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '10px',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {replyTo && (
                <button
                  onClick={() => setReplyTo(null)}
                  style={{ color: 'var(--accent-pink)', marginRight: '12px' }}
                >
                  取消回复
                </button>
              )}
              {user ? '以 ' + user.name + ' 身份评论' : '登录后可评论'}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#fff',
                background: newComment.trim()
                  ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))'
                  : 'var(--bg-tertiary)',
                cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                transition: 'all var(--transition-fast)',
              }}
            >
              发布
            </button>
          </div>
        </div>
      </div>

      {pendingNotice && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          marginBottom: '24px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--accent-pending)',
          border: '1px solid var(--accent-pending-border)',
          color: 'var(--accent-amber)',
          fontSize: '0.85rem',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          评论已提交，正在等待管理员审核后展示
        </div>
      )}

      {loading ? (
        <CommentListSkeleton count={2} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              userId={userId}
              onReply={setReplyTo}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {!loading && comments.length === 0 && (
        <div style={{
          padding: '48px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3, marginBottom: '12px' }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <div style={{ fontSize: '0.9rem', marginBottom: '6px' }}>暂无评论</div>
          <div style={{ fontSize: '0.8rem' }}>来发表第一条评论吧</div>
        </div>
      )}
    </div>
  )
}

function CommentItem({ comment, userId, onReply, onDelete }: {
  comment: Comment
  userId: string | null
  onReply: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [showReplies, setShowReplies] = useState(false)
  const hasReplies = comment.replies && comment.replies.length > 0
  const canDelete = userId && userId === comment.user_id

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toISOString().split('T')[0]
  }

  return (
    <div style={{
      padding: '16px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
    }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <img
          src={comment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author}`}
          alt={comment.author}
          loading="lazy"
          decoding="async"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--bg-tertiary)',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '6px',
          }}>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}>
              {comment.author}
            </span>
            {comment.status === 'pending' && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.65rem',
                color: 'var(--accent-amber)',
                background: 'var(--accent-pending)',
                border: '1px solid var(--accent-pending-border)',
              }}>
                待审核
              </span>
            )}
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              {formatDate(comment.created_at)}
            </span>
          </div>
          <p style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            margin: 0,
          }}>
            {comment.content}
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginTop: '10px',
          }}>
            <button
              onClick={() => onReply(comment.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                transition: 'color var(--transition-fast)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              回复
            </button>
            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  transition: 'color var(--transition-fast)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                删除
              </button>
            )}
          </div>
        </div>
      </div>

      {hasReplies && (
        <div style={{ marginTop: '12px', paddingLeft: '44px' }}>
          <button
            onClick={() => setShowReplies(!showReplies)}
            style={{
              fontSize: '0.75rem',
              color: 'var(--accent-blue)',
              marginBottom: showReplies ? '12px' : 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{showReplies ? '收起回复' : '查看回复'}</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
            }}>
              {comment.replies!.length}
            </span>
          </button>

          {showReplies && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {comment.replies!.map(reply => (
                <div key={reply.id} style={{ display: 'flex', gap: '10px', paddingLeft: '4px' }}>
                  <img
                    src={reply.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.author}`}
                    alt={reply.author}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--bg-tertiary)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {reply.author}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {formatDate(reply.created_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      {reply.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
