import { useNavigate } from 'react-router-dom'
import { usePosts } from '../lib/PostContext'
import { useSeo } from '../lib/useSeo'
import Reveal from '../components/Reveal'

export default function Archive() {
  const navigate = useNavigate()
  const { posts } = usePosts()

  useSeo({ title: '归档', description: '按时间浏览所有文章' })

  const groupedByYear = posts.reduce((acc, post) => {
    const year = new Date(post.date).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(post)
    return acc
  }, {} as Record<number, typeof posts>)

  const years = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a))

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <Reveal direction="up">
        <div style={{ marginBottom: '48px' }}>
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
            ARCHIVE
          </div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 700,
            lineHeight: 1.3,
            color: 'var(--text-primary)',
            marginBottom: '12px',
          }}>
            文章归档
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            共 {posts.length} 篇文章
          </p>
        </div>
      </Reveal>

      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: '7px',
          top: '8px',
          bottom: '8px',
          width: '2px',
          background: 'linear-gradient(180deg, var(--accent-cyan), var(--accent-purple), transparent)',
        }} />

        {years.map((year, yi) => (
          <Reveal key={year} direction="up" delay={yi * 60}>
            <div style={{ marginBottom: '40px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
                position: 'relative',
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
                  boxShadow: 'var(--glow-cyan)',
                  zIndex: 1,
                }} />
                <span style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {year}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {groupedByYear[Number(year)].length} 篇
                </span>
              </div>

              <div style={{ paddingLeft: '36px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {groupedByYear[Number(year)].map(post => (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/post/${post.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--border-glow)'
                      e.currentTarget.style.background = 'rgba(74, 125, 255, 0.05)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-color)'
                      e.currentTarget.style.background = 'var(--bg-glass)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      flexShrink: 0,
                      width: '45px',
                    }}>
                      {post.date.slice(5)}
                    </span>

                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '0.65rem',
                      color: 'var(--accent-cyan)',
                      background: 'rgba(0, 212, 255, 0.1)',
                      flexShrink: 0,
                    }}>
                      {post.category}
                    </span>

                    <span style={{
                      flex: 1,
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {post.title}
                    </span>

                    <span style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      flexShrink: 0,
                    }}>
                      {post.readTime}min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
