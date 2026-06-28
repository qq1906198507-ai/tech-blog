import { useMemo, useState } from 'react'
import PostCard from '../components/PostCard'
import Reveal from '../components/Reveal'
import { usePosts } from '../lib/PostContext'
import { useSeo } from '../lib/useSeo'

interface HomeProps {
  searchQuery: string
  activeCategory: string
}

export default function Home({ searchQuery, activeCategory }: HomeProps) {
  const { posts } = usePosts()

  useSeo({ description: '探索 AI 大模型、前端工程化和全栈开发的最新技术动态和深度文章' })

  const totalTags = useMemo(() => new Set(posts.flatMap(p => p.tags)).size, [posts])

  const filteredPosts = useMemo(() => {
    return posts
      .filter(post => {
        const matchesCategory = activeCategory === '全部' || post.category === activeCategory
        const matchesSearch = searchQuery === '' ||
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        return matchesCategory && matchesSearch
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return 0
      })
  }, [searchQuery, activeCategory, posts])

  return (
    <div style={{ padding: '0' }}>
      <Reveal direction="up">
        <div style={{
          marginBottom: '48px',
        }}>
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
            <span style={{
              width: '24px',
              height: '1px',
              background: 'var(--accent-blue)',
            }} />
            欢迎
          </div>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: '16px',
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-cyan) 50%, var(--accent-purple) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            探索 AI 大模型的边界
          </h1>
          <p style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            lineHeight: 1.8,
          }}>
            深入大模型架构、训练与部署，分享 AI 工程化实践的每一步。
          </p>

          <Reveal direction="up" delay={150}>
            <div style={{
              display: 'flex',
              gap: '24px',
              marginTop: '32px',
              flexWrap: 'wrap',
            }}>
              <StatBadge value={String(posts.length)} label="深度文章" />
              <StatBadge value={`${totalTags}+`} label="技术标签" />
              <StatBadge value="∞" label="探索可能" />
            </div>
          </Reveal>
        </div>
      </Reveal>

      {filteredPosts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 0',
          color: 'var(--text-muted)',
          opacity: 1,
          transition: 'opacity 0.6s ease 0.2s',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
          }}>
            ◇
          </div>
          <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>没有找到匹配的文章</div>
          <div style={{ fontSize: '0.85rem' }}>尝试调整搜索关键词或分类</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))',
          gap: '24px',
        }}>
          {filteredPosts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .stat-badges {
            gap: 12px;
          }
        }
      `}</style>
    </div>
  )
}

function StatBadge({ value, label }: { value: string; label: string }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderRadius: 'var(--radius-md)',
        background: hover ? 'rgba(74, 125, 255, 0.08)' : 'var(--bg-glass)',
        border: `1px solid ${hover ? 'var(--border-glow)' : 'var(--border-color)'}`,
        transition: 'all var(--transition-fast)',
      }}
    >
      <span style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        {value}
      </span>
      <span style={{
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
      }}>
        {label}
      </span>
    </div>
  )
}
