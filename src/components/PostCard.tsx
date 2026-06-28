import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Post } from '../types'

interface PostCardProps {
  post: Post
  index: number
}

export default function PostCard({ post, index }: PostCardProps) {
  const navigate = useNavigate()
  const [hover, setHover] = useState(false)

  const gradients = [
    'linear-gradient(135deg, rgba(74, 125, 255, 0.4), rgba(0, 212, 255, 0.1))',
    'linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(236, 72, 153, 0.1))',
    'linear-gradient(135deg, rgba(0, 212, 255, 0.4), rgba(74, 125, 255, 0.1))',
    'linear-gradient(135deg, rgba(236, 72, 153, 0.4), rgba(168, 85, 247, 0.1))',
  ]

  const accentColors = ['#4a7dff', '#a855f7', '#00d4ff', '#ec4899']

  return (
    <article
      onClick={() => navigate(`/post/${post.id}`)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        padding: 'clamp(20px, 3vw, 28px)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: `1px solid ${hover ? 'var(--border-glow)' : 'var(--border-color)'}`,
        cursor: 'pointer',
        transition: 'all var(--transition-normal)',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hover ? '0 20px 60px rgba(74, 125, 255, 0.1)' : 'none',
        animation: `fadeInUp 0.6s ease ${index * 0.1}s both`,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: gradients[index % gradients.length],
        opacity: hover ? 1 : 0,
        transition: 'opacity var(--transition-normal)',
      }} />

      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColors[index % accentColors.length]}15, transparent)`,
        opacity: hover ? 1 : 0,
        transition: 'opacity var(--transition-normal)',
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
      }}>
        {post.pinned && (
          <span style={{
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.65rem',
            fontWeight: 600,
            color: '#fff',
            background: 'linear-gradient(135deg, var(--accent-amber), #f59e0b)',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
            </svg>
            置顶
          </span>
        )}
        <span style={{
          padding: '5px 14px',
          borderRadius: '999px',
          fontSize: '0.7rem',
          fontWeight: 500,
          color: accentColors[index % accentColors.length],
          background: `${accentColors[index % accentColors.length]}15`,
          border: `1px solid ${accentColors[index % accentColors.length]}30`,
          letterSpacing: '0.05em',
        }}>
          {post.category}
        </span>
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          {post.date}
        </span>
      </div>

      <h2 style={{
        fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '12px',
        lineHeight: 1.4,
        transition: 'color var(--transition-fast)',
        paddingRight: '40px',
      }}>
        {post.title}
      </h2>

      <p style={{
        fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)',
        color: 'var(--text-secondary)',
        lineHeight: 1.7,
        marginBottom: '20px',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {post.excerpt}
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
      }}>
        {post.authorAvatar && post.authorId && (
          <img
            src={post.authorAvatar}
            alt={post.authorName}
            loading="lazy"
            decoding="async"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/profile/${post.authorId}`)
            }}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              objectFit: 'cover',
              cursor: 'pointer',
            }}
          />
        )}
        <span
          onClick={(e) => {
            e.stopPropagation()
            if (post.authorId) navigate(`/profile/${post.authorId}`)
          }}
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            cursor: post.authorId ? 'pointer' : 'default',
          }}
        >
          {post.authorName || '匿名'}
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        <div style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          flex: 1,
          minWidth: 0,
        }}>
          {post.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              style={{
                padding: '3px 10px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-tertiary)',
                whiteSpace: 'nowrap',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {post.viewCount || 0}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          {post.readTime} min
        </div>
      </div>

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
      `}</style>
    </article>
  )
}
