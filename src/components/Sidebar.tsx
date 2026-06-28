import { useMemo } from 'react'
import { usePosts } from '../lib/PostContext'
import type { Category } from '../types'

interface SidebarProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ activeCategory, onCategoryChange, isOpen, onClose }: SidebarProps) {
  const { posts } = usePosts()

  const categories = useMemo(() => {
    const cats: Category[] = [{ name: '全部', count: posts.length, icon: '◈' }]
    const categoryMap = new Map<string, number>()
    posts.forEach(p => {
      categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1)
    })
    const icons = ['◇', '◆', '⬡', '⬢', '◈']
    let i = 1
    categoryMap.forEach((count, name) => {
      cats.push({ name, count, icon: icons[i++ % icons.length] })
    })
    return cats
  }, [posts])

  const allTags = useMemo(() => [...new Set(posts.flatMap(p => p.tags))], [posts])
  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
          }}
        />
      )}
      <aside style={{
        position: 'fixed',
        top: 0,
        left: isOpen ? 0 : '-300px',
        width: 'var(--sidebar-width)',
        height: '100vh',
        background: 'rgba(10, 10, 15, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-color)',
        padding: '80px 20px 24px',
        zIndex: 100,
        transition: 'left var(--transition-normal)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}>
        <div>
          <div style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: 'var(--text-muted)',
            marginBottom: '12px',
            padding: '0 14px',
          }}>
            分类导航
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {categories.map((cat: Category) => {
              const isActive = activeCategory === cat.name
              return (
                <button
                  key={cat.name}
                  onClick={() => onCategoryChange(cat.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    background: isActive
                      ? 'rgba(0, 212, 255, 0.08)'
                      : 'transparent',
                    border: isActive
                      ? '1px solid rgba(0, 212, 255, 0.2)'
                      : '1px solid transparent',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-glass)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }
                  }}
                >
                  <span style={{
                    fontSize: '0.9rem',
                    width: '20px',
                    textAlign: 'center',
                    filter: isActive ? 'drop-shadow(0 0 6px rgba(0, 212, 255, 0.5))' : 'none',
                  }}>{cat.icon}</span>
                  <span style={{ flex: 1 }}>{cat.name}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: isActive ? 'rgba(0, 212, 255, 0.15)' : 'var(--bg-tertiary)',
                  }}>{cat.count}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0 14px' }} />

        <div>
          <div style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: 'var(--text-muted)',
            marginBottom: '12px',
            padding: '0 14px',
          }}>
            热门标签
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            padding: '0 14px',
          }}>
            {allTags.map(tag => (
              <span
                key={tag}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  transition: 'all var(--transition-fast)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-blue)'
                  e.currentTarget.style.color = 'var(--accent-blue)'
                  e.currentTarget.style.boxShadow = 'var(--glow-blue)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0 14px' }} />

        <div style={{
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(74, 125, 255, 0.08), rgba(168, 85, 247, 0.08))',
          border: '1px solid var(--border-color)',
          margin: '0 14px',
        }}>
          <div style={{
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}>
            深入探索
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: '16px',
          }}>
            订阅获取最新 AI 技术动态和深度文章
          </div>
          <div style={{
            display: 'flex',
            gap: '8px',
          }}>
            <input
              type="email"
              placeholder="your@email.com"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
                minWidth: 0,
              }}
            />
            <button
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = 'var(--glow-blue)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              订阅
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
