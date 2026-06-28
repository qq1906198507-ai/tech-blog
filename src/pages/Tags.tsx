import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePosts } from '../lib/PostContext'
import { useSeo } from '../lib/useSeo'
import Reveal from '../components/Reveal'

export default function Tags() {
  const navigate = useNavigate()
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const { posts } = usePosts()

  useSeo({ title: '标签', description: '按标签浏览文章' })

  const allTags = useMemo(() => [...new Set(posts.flatMap(p => p.tags))], [posts])

  const tagCounts = useMemo(() => {
    return allTags.reduce((acc, tag) => {
      acc[tag] = posts.filter(p => p.tags.includes(tag)).length
      return acc
    }, {} as Record<string, number>)
  }, [allTags, posts])

  const sortedTags = useMemo(() => [...allTags].sort((a, b) => tagCounts[b] - tagCounts[a]), [allTags, tagCounts])

  const filteredPosts = useMemo(() => {
    return selectedTag ? posts.filter(p => p.tags.includes(selectedTag)) : []
  }, [selectedTag, posts])

  const tagColors = [
    '#4a7dff', '#00d4ff', '#a855f7', '#ec4899', '#10b981',
    '#f59e0b', '#ef4444', '#6366f1', '#14b8a6', '#f97316',
  ]

  const getTagColor = (index: number) => tagColors[index % tagColors.length]

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
          TAGS
        </div>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 700,
          lineHeight: 1.3,
          color: 'var(--text-primary)',
          marginBottom: '12px',
        }}>
          标签云
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          共 {allTags.length} 个标签
        </p>
      </div>

      <Reveal direction="up">
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '32px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          marginBottom: '48px',
        }}>
          {sortedTags.map((tag, index) => {
            const isSelected = selectedTag === tag
            const color = getTagColor(index)
            const count = tagCounts[tag]
            const size = Math.max(0.8, Math.min(1.3, 0.7 + count * 0.15))

            return (
              <Reveal key={tag} direction="up" delay={Math.min(index * 30, 400)}>
                <button
                  onClick={() => setSelectedTag(isSelected ? null : tag)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    fontSize: `${size}rem`,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? '#fff' : color,
                    background: isSelected
                      ? color
                      : `${color}15`,
                    border: `1px solid ${isSelected ? color : `${color}30`}`,
                    transition: 'all var(--transition-fast)',
                    boxShadow: isSelected ? `0 0 20px ${color}40` : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = `0 4px 16px ${color}30`
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  #{tag}
                  <span style={{
                    fontSize: '0.65rem',
                    opacity: 0.7,
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {count}
                  </span>
                </button>
              </Reveal>
            )
          })}
        </div>
      </Reveal>

      {selectedTag && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}>
            <h2 style={{
              fontSize: '1.2rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              #{selectedTag}
            </h2>
            <span style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}>
              {filteredPosts.length} 篇文章
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              style={{
                marginLeft: 'auto',
                fontSize: '0.8rem',
                color: 'var(--accent-blue)',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--accent-blue)'}
            >
              清除选择
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredPosts.map((post, i) => (
              <Reveal key={post.id} direction="up" delay={i * 60}>
                <div
                  onClick={() => navigate(`/post/${post.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '20px',
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
                    flexShrink: 0,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-tertiary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}>
                    {post.date}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                    }}>
                      {post.title}
                    </h3>
                    <p style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {post.excerpt}
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      marginTop: '10px',
                      flexWrap: 'wrap',
                    }}>
                      {post.tags.map(t => (
                        <span
                          key={t}
                          onClick={e => { e.stopPropagation(); setSelectedTag(t) }}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            color: t === selectedTag ? '#fff' : 'var(--text-muted)',
                            background: t === selectedTag ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                            cursor: 'pointer',
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
