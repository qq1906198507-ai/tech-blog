import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { usePosts } from '../lib/PostContext'
import { likeService, favoriteService } from '../services/database'
import { getReadingHistory, type ReadingHistoryEntry } from '../lib/readingHistory'
import type { UserInfo } from '../components/AuthModal'

interface MyPostsProps {
  user?: UserInfo | null
  onEditDraft?: (draft: { id: string; title: string; category: string; tags: string; content: string }) => void
}

export default function MyPosts({ user, onEditDraft }: MyPostsProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') as 'published' | 'drafts' | 'favorites' || 'published'
  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'favorites'>(initialTab)
  const [likeData, setLikeData] = useState<Record<string, number>>({})
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [historyEntries, setHistoryEntries] = useState<ReadingHistoryEntry[]>([])
  const { posts, drafts, deleteDraft } = usePosts()

  useEffect(() => {
    const loadData = async () => {
      const data: Record<string, number> = {}

      for (const post of posts) {
        try {
          const count = await likeService.getLikeCount(post.id)
          data[post.id] = count
        } catch {
          data[post.id] = 0
        }
      }

      setLikeData(data)

      if (user?.id) {
        try {
          const favs = await favoriteService.getUserFavorites(user.id)
          setFavoriteIds(favs)
        } catch {
          setFavoriteIds([])
        }
      }
    }

    loadData()
  }, [user, posts])

  useEffect(() => {
    if (user?.id) {
      favoriteService.getUserFavorites(user.id).then(favs => setFavoriteIds(favs)).catch(() => setFavoriteIds([]))
    }
  }, [user, location.pathname])

  const favoritePosts = useMemo(() => {
    return posts.filter(p => favoriteIds.includes(p.id))
  }, [favoriteIds])

  const userPosts = useMemo(() => {
    return posts.filter(p => p.authorId === user?.id)
  }, [user, posts])

  const userDrafts = useMemo(() => {
    return drafts.filter(d => d.authorId === user?.id || d.authorId === 'anonymous')
  }, [drafts, user])

  useEffect(() => {
    setHistoryEntries(getReadingHistory())
  }, [location.pathname])

  const recentReads = useMemo(() => {
    return historyEntries
      .map(h => posts.find(p => p.id === h.postId))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .slice(0, 5)
  }, [historyEntries, posts])

  const stats = useMemo(() => {
    const totalLikes = Object.values(likeData).reduce((sum, count) => sum + count, 0)
    const totalReads = userPosts.reduce((sum, p) => sum + (p.viewCount || 0), 0)
    return {
      published: userPosts.length,
      totalReads,
      totalLikes,
    }
  }, [likeData, userPosts])

  const tabs = [
    { key: 'published' as const, label: '已发布', count: stats.published },
    { key: 'drafts' as const, label: '草稿箱', count: userDrafts.length },
    { key: 'favorites' as const, label: '收藏夹', count: favoritePosts.length },
  ]

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toString()
  }

  if (!user) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '80px 20px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 20px',
          borderRadius: '50%',
          background: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
          请先登录
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          登录后可查看个人中心、收藏文章等
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'var(--accent-blue)',
          marginBottom: '12px',
          fontFamily: 'var(--font-mono)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ width: '24px', height: '1px', background: 'var(--accent-blue)' }} />
          DASHBOARD
        </div>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}>
          个人中心
        </h1>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '32px',
        padding: '20px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}>
        <img
          src={user.avatar}
          alt={user.name}
          loading="lazy"
          decoding="async"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--bg-tertiary)',
          }}
        />
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {user.name}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {user.email}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {[
          { label: '已发布', value: stats.published, icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', color: 'var(--accent-cyan)' },
          { label: '总阅读', value: formatNumber(stats.totalReads), icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', color: 'var(--accent-purple)' },
          { label: '获赞', value: stats.totalLikes, icon: 'M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3', color: 'var(--accent-pink)' },
        ].map(stat => (
          <div key={stat.label} style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            transition: 'all var(--transition-fast)',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-glow)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: `${stat.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="2">
                <path d={stat.icon} />
              </svg>
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              marginBottom: '4px',
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '4px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        marginBottom: '24px',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: activeTab === tab.key ? 500 : 400,
              color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))'
                : 'transparent',
              transition: 'all var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {tab.label}
            <span style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '999px',
              background: activeTab === tab.key
                ? 'rgba(255,255,255,0.2)'
                : 'var(--bg-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeTab === 'published' && userPosts.map(post => (
          <div
            key={post.id}
            onClick={() => navigate(`/post/${post.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-glow)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {post.title}
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}>
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime} 分钟</span>
                <span>·</span>
                <span>{post.category}</span>
                <span>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-pink)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                  {likeData[post.id] || 0}
                </span>
              </div>
            </div>
            <div style={{
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.7rem',
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              flexShrink: 0,
            }}>
              已发布
            </div>
          </div>
        ))}

        {activeTab === 'drafts' && userDrafts.length === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3, marginBottom: '16px' }}>
              <path d="M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <div style={{ fontSize: '0.95rem', marginBottom: '8px' }}>暂无草稿</div>
            <div style={{ fontSize: '0.8rem' }}>写文章时点击"存为草稿"即可保存</div>
          </div>
        )}

        {activeTab === 'drafts' && userDrafts.map(draft => (
          <div
            key={draft.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-glow)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}>
                {draft.title || '无标题草稿'}
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}>
                <span>{new Date(draft.updatedAt).toLocaleDateString('zh-CN')}</span>
                <span>·</span>
                <span>{draft.content.length} 字</span>
                <span>·</span>
                <span>{draft.category}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditDraft?.(draft)
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  color: 'var(--accent-cyan)',
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  transition: 'all var(--transition-fast)',
                  cursor: 'pointer',
                }}
              >
                继续编辑
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteDraft(draft.id)
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  color: 'var(--accent-pink)',
                  background: 'rgba(236, 72, 153, 0.1)',
                  border: '1px solid rgba(236, 72, 153, 0.2)',
                  transition: 'all var(--transition-fast)',
                  cursor: 'pointer',
                }}
              >
                删除
              </button>
            </div>
          </div>
        ))}

        {activeTab === 'favorites' && favoritePosts.map(post => (
          <div
            key={post.id}
            onClick={() => navigate(`/post/${post.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-glow)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}>
                {post.title}
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}>
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.category}</span>
              </div>
            </div>
          </div>
        ))}

        {activeTab === 'favorites' && favoritePosts.length === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3, marginBottom: '16px' }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <div style={{ fontSize: '0.95rem', marginBottom: '8px' }}>暂无收藏</div>
            <div style={{ fontSize: '0.8rem' }}>浏览文章时点击收藏即可添加</div>
          </div>
        )}
      </div>

      {recentReads.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>最近阅读</h3>
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              最近 {recentReads.length} 篇
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentReads.map(post => {
              const entry = historyEntries.find(h => h.postId === post.id)
              return (
                <div
                  key={post.id}
                  onClick={() => navigate(`/post/${post.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--border-glow)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--accent-purple)',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.88rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {post.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {post.category}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    flexShrink: 0,
                  }}>
                    {entry ? new Date(entry.visitedAt).toLocaleDateString('zh-CN') : post.date}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
