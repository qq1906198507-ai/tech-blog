import { useParams, useNavigate } from 'react-router-dom'
import { useMemo, useEffect, useRef, useState } from 'react'
import { usePosts } from '../lib/PostContext'
import { useUsers } from '../lib/UserContext'
import { useToast } from '../lib/ToastContext'
import Reveal from '../components/Reveal'
import type { UserInfo } from '../components/AuthModal'

interface ProfileProps {
  user?: UserInfo | null
}

export default function Profile({ user: currentUser }: ProfileProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { posts } = usePosts()
  const { users, updateUser } = useUsers()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarHover, setAvatarHover] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  const profileUser = useMemo(() => {
    const found = users.find(u => u.id === id)
    if (found) return found
    // fallback: 当前登录用户匹配时，用当前用户信息
    if (currentUser && currentUser.id === id) {
      return {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        role: currentUser.role || 'user',
        status: 'active' as const,
        joinDate: new Date().toISOString().split('T')[0],
        lastLogin: new Date().toISOString().split('T')[0],
        postsCount: 0,
      }
    }
    return undefined
  }, [users, id, currentUser])

  const userPosts = useMemo(
    () => posts.filter(p => p.authorId === id).sort((a, b) => b.date.localeCompare(a.date)),
    [posts, id]
  )

  const totalLikes = useMemo(() => {
    let count = 0
    userPosts.forEach(p => {
      const c = localStorage.getItem(`like_count_${p.id}`)
      if (c) count += parseInt(c)
    })
    return count
  }, [userPosts])

  if (!profileUser) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)' }}>
        <div style={{
          fontSize: '4rem', fontWeight: 700,
          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '16px',
        }}>404</div>
        <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>用户不存在</div>
        <button onClick={() => navigate('/')} style={{
          padding: '12px 28px', borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
          color: '#fff', fontSize: '0.9rem', fontWeight: 500,
          boxShadow: 'var(--glow-blue)',
        }}>返回首页</button>
      </div>
    )
  }

  const isOwner = currentUser?.id === profileUser.id

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast('头像不能超过 2MB', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      updateUser(profileUser.id, { avatar: dataUrl })
      showToast('头像已更新', 'success')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{
      maxWidth: '800px', margin: '0 auto',
      opacity: 1,
      transform: 'translateY(0)',
      transition: 'none',
    }}>
      {/* Profile header */}
      <Reveal direction="up">
        <div style={{
          padding: '40px', borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          backdropFilter: 'blur(10px)', marginBottom: '32px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '100px',
            background: 'linear-gradient(135deg, rgba(74, 125, 255, 0.2), rgba(168, 85, 247, 0.2))',
          }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '20px', paddingTop: '40px' }}>
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
            >
              <img
                src={profileUser.avatar}
                alt={profileUser.name}
                loading="lazy"
                decoding="async"
                style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  border: '3px solid var(--bg-secondary)', background: 'var(--bg-tertiary)',
                  boxShadow: 'var(--glow-blue)',
                }}
              />
              {isOwner && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />
                  {avatarHover && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: 'none',
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {profileUser.name}
                </h1>
                {profileUser.role === 'admin' && (
                  <span style={{
                    padding: '3px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 600,
                    color: '#fff', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))',
                    letterSpacing: '0.05em',
                  }}>ADMIN</span>
                )}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{profileUser.email}</div>
            </div>
          </div>

          <div style={{
            display: 'flex', gap: '32px', marginTop: '24px', position: 'relative',
          }}>
            {[
              { label: '文章', value: userPosts.length },
              { label: '获赞', value: totalLikes },
              { label: '加入时间', value: profileUser.joinDate },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* User posts */}
      <h2 style={{
        fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)',
        marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ width: '20px', height: '2px', background: 'var(--accent-blue)' }} />
        {isOwner ? '我的文章' : 'TA 的文章'}
      </h2>

      {userPosts.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)',
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
        }}>
          暂无文章
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {userPosts.map((post, i) => (
            <Reveal key={post.id} direction="up" delay={i * 60}>
              <div
                onClick={() => navigate(`/post/${post.id}`)}
                style={{
                  padding: '20px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  cursor: 'pointer', transition: 'all var(--transition-fast)',
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
                <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: '999px', fontSize: '0.7rem',
                    color: 'var(--accent-cyan)', background: 'rgba(0, 212, 255, 0.1)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                  }}>{post.category}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {post.date}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>
                  {post.title}
                </h3>
                <p style={{
                  fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {post.excerpt}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  )
}
