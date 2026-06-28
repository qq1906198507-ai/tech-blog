import { useParams, useNavigate } from 'react-router-dom'
import { useMemo, useEffect, useState } from 'react'
import { usePosts } from '../lib/PostContext'
import { useToast } from '../lib/ToastContext'
import { useSeo } from '../lib/useSeo'
import { recordVisit } from '../lib/readingHistory'
import Reveal from '../components/Reveal'
import TableOfContents from '../components/TableOfContents'
import LikeButton from '../components/LikeButton'
import FavoritesButton from '../components/FavoritesButton'
import CommentSection from '../components/CommentSection'
import WritePostModal from '../components/WritePostModal'
import type { UserInfo } from '../components/AuthModal'
import { canManagePost } from '../lib/permissions'

interface PostDetailProps {
  user?: UserInfo | null
}

export default function PostDetail({ user }: PostDetailProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [likeData, setLikeData] = useState<Record<string, number>>({})
  const { posts, deletePost, incrementViewCount } = usePosts()
  const { showToast } = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const post = useMemo(() => posts.find(p => p.id === id), [id, posts])

  useSeo({
    title: post?.title,
    description: post?.excerpt,
    url: window.location.href,
    image: post?.cover,
  })

  useEffect(() => {
    window.scrollTo(0, 0)

    if (id) {
      incrementViewCount(id)
      recordVisit(id)
    }

    const loadData = () => {
      const data: Record<string, number> = {}
      posts.forEach(p => {
        const count = localStorage.getItem(`like_count_${p.id}`)
        data[p.id] = count ? parseInt(count) : 0
      })
      setLikeData(data)
    }

    loadData()
    window.addEventListener('storage', loadData)
    return () => window.removeEventListener('storage', loadData)
  }, [id])

  if (!post) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '120px 0',
        color: 'var(--text-muted)',
      }}>
        <div style={{
          fontSize: '4rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '16px',
        }}>404</div>
        <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>文章不存在</div>
        <div style={{ fontSize: '0.85rem', marginBottom: '32px' }}>可能已被删除或链接有误</div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 28px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: 500,
            transition: 'all var(--transition-fast)',
            boxShadow: 'var(--glow-blue)',
          }}
        >
          返回首页
        </button>
      </div>
    )
  }

  // slug 化：用于生成标题 id，供 TOC 锚点跳转
  const slugify = (text: string) =>
    text.trim().toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50) || `heading-${Math.random().toString(36).slice(2, 6)}`

  const contentHtml = post.content
    .replace(/^### (.+)$/gm, (_, t) => `<h3 id="${slugify(t)}">${t}</h3>`)
    .replace(/^## (.+)$/gm, (_, t) => `<h2 id="${slugify(t)}">${t}</h2>`)
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
      `<div class="code-block"><div class="code-header"><span class="code-lang">${lang || 'code'}</span><button class="copy-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('code').textContent).then(()=>{this.textContent='已复制';setTimeout(()=>this.textContent='复制',1500)})">复制</button></div><pre><code>${code}</code></pre></div>`
    )
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hlu])((?!<).+)$/gm, '<p>$1</p>')
    .replace(/<\/p><p>/g, '\n\n')
    .replace(/<p><\/p>/g, '')

  // 提取目录结构
  const tocItems = useMemo(() => {
    const items: { level: 2 | 3; text: string; id: string }[] = []
    const regex = /^(#{2,3})\s+(.+)$/gm
    let m
    while ((m = regex.exec(post.content)) !== null) {
      const level = m[1].length as 2 | 3
      const text = m[2].trim()
      items.push({ level, text, id: slugify(text) })
    }
    return items
  }, [post.content])

  const relatedPosts = posts
    .filter(p => p.id !== post.id && p.category === post.category)
    .slice(0, 2)

  return (
    <>
    <div style={{
      display: 'flex',
      gap: '48px',
      maxWidth: '1200px',
      margin: '0 auto',
      alignItems: 'flex-start',
    }}>
    <article style={{
      maxWidth: '800px',
      margin: '0 auto',
      flex: 1,
      minWidth: 0,
      opacity: 1,
      transform: 'translateY(0)',
      transition: 'none',
    }}>
      <button
        onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          marginBottom: '32px',
          transition: 'all var(--transition-fast)',
          border: '1px solid var(--border-color)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--accent-cyan)'
          e.currentTarget.style.borderColor = 'var(--border-glow)'
          e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--text-secondary)'
          e.currentTarget.style.borderColor = 'var(--border-color)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12,19 5,12 12,5" />
        </svg>
        返回
      </button>

      <header style={{ marginBottom: '48px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}>
          <span style={{
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--accent-cyan)',
            background: 'rgba(0, 212, 255, 0.1)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
          }}>
            {post.category}
          </span>
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            {post.date}
          </span>
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            {post.readTime}
          </span>
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {post.viewCount || 0}
          </span>
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            {likeData[post.id] || 0}
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-color)',
          cursor: post.authorId ? 'pointer' : 'default',
          transition: 'all var(--transition-fast)',
        }}
          onClick={() => { if (post.authorId) navigate(`/profile/${post.authorId}`) }}
        >
          {post.authorAvatar && (
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              loading="lazy"
              decoding="async"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          )}
          <div>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}>
              {post.authorName || '匿名'}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}>
              作者
            </div>
          </div>
        </div>

        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: 700,
          lineHeight: 1.3,
          marginBottom: '20px',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          {post.title}
        </h1>

        <p style={{
          fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
          color: 'var(--text-secondary)',
          lineHeight: 1.8,
        }}>
          {post.excerpt}
        </p>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '24px',
        }}>
          {post.tags.map(tag => (
            <span
              key={tag}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)'
                e.currentTarget.style.color = 'var(--accent-blue)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </header>

      <div style={{
        position: 'relative',
        padding: 'clamp(24px, 5vw, 48px)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan), var(--accent-purple))',
        }} />

        <div
          className="post-content"
          style={{
            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
            lineHeight: 1.9,
            color: 'var(--text-secondary)',
          }}
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '20px 0',
        margin: '24px 0',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <LikeButton postId={post.id} user={user} />
          <FavoritesButton postId={post.id} user={user} />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-color)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent-blue)'
              e.currentTarget.style.color = 'var(--accent-blue)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
            onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            评论
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-color)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent-purple)'
              e.currentTarget.style.color = 'var(--accent-purple)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
            onClick={async () => {
              const url = window.location.href
              try {
                if (navigator.share) {
                  await navigator.share({ title: post.title, url })
                  return
                }
                await navigator.clipboard.writeText(url)
                showToast('文章链接已复制到剪贴板', 'success')
              } catch {
                showToast('分享失败，请手动复制链接', 'error')
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            分享
          </button>
          {canManagePost(user ?? null, post.authorId) && (
            <>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  color: 'var(--accent-cyan)',
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-cyan)'
                  e.currentTarget.style.background = 'rgba(0, 212, 255, 0.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)'
                  e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'
                }}
                onClick={() => setEditOpen(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                编辑
              </button>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  color: 'var(--accent-pink)',
                  background: 'rgba(236, 72, 153, 0.1)',
                  border: '1px solid rgba(236, 72, 153, 0.2)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-pink)'
                  e.currentTarget.style.background = 'rgba(236, 72, 153, 0.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.2)'
                  e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)'
                }}
                onClick={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true)
                    showToast('再次点击以确认删除', 'warning')
                    setTimeout(() => setConfirmDelete(false), 3000)
                    return
                  }
                  deletePost(post.id)
                  showToast('文章已删除', 'success')
                  navigate('/')
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                删除
              </button>
            </>
          )}
        </div>
      </div>

      <div id="comments">
        <CommentSection postId={post.id} user={user} />
      </div>

      {relatedPosts.length > 0 && (
        <Reveal direction="up">
          <div style={{ marginTop: '64px' }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                width: '20px',
                height: '2px',
                background: 'var(--accent-blue)',
              }} />
              相关文章
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}>
              {relatedPosts.map((rp, i) => (
                <Reveal key={rp.id} direction="up" delay={i * 80}>
                  <div
                    onClick={() => navigate(`/post/${rp.id}`)}
                    style={{
                      padding: '20px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-glass)',
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
                    <div style={{
                      fontSize: '0.7rem',
                      color: 'var(--accent-cyan)',
                      marginBottom: '8px',
                    }}>
                      {rp.category}
                    </div>
                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      lineHeight: 1.4,
                    }}>
                      {rp.title}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      <style>{`
        .post-content h2 {
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 40px 0 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-color);
          letter-spacing: -0.01em;
        }
        .post-content h3 {
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 32px 0 12px;
        }
        .post-content p {
          margin-bottom: 16px;
        }
        .post-content strong {
          color: var(--text-primary);
          font-weight: 600;
        }
        .post-content ul {
          margin: 16px 0;
          padding-left: 24px;
        }
        .post-content li {
          margin-bottom: 8px;
          position: relative;
        }
        .post-content li::marker {
          color: var(--accent-cyan);
        }
        .code-block {
          margin: 20px 0;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }
        .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid var(--border-color);
        }
        .code-lang {
          font-size: 0.7rem;
          font-family: var(--font-mono);
          color: var(--accent-cyan);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .copy-btn {
          font-size: 0.7rem;
          padding: 4px 10px;
          border-radius: 4px;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: var(--font-sans);
        }
        .copy-btn:hover {
          border-color: var(--accent-blue);
          color: var(--accent-blue);
        }
        .post-content pre {
          margin: 0;
          padding: 20px;
          overflow-x: auto;
          background: transparent;
          border: none;
        }
        .post-content pre code {
          background: none;
          padding: 0;
          color: var(--accent-cyan);
          font-size: 0.85rem;
          line-height: 1.8;
        }
        .post-content code {
          font-family: var(--font-mono);
          background: var(--bg-tertiary);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.85em;
          color: var(--accent-cyan);
        }

        @media (max-width: 768px) {
          .post-content h2 { font-size: 1.2rem; }
          .post-content h3 { font-size: 1rem; }
        }
        /* TOC 侧栏：桌面端显示，窄屏隐藏 */
        .toc-aside {
          display: block;
        }
        @media (max-width: 1100px) {
          .toc-aside { display: none !important; }
        }
      `}</style>
    </article>
      {/* TOC 目录侧栏 */}
      {tocItems.length > 0 && (
        <aside className="toc-aside" style={{
          width: '240px',
          flexShrink: 0,
          position: 'sticky',
          top: 'calc(var(--header-height) + 32px)',
        }}>
          <TableOfContents items={tocItems} />
        </aside>
      )}
    </div>
      <WritePostModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        editPost={post}
      />
    </>
  )
}
