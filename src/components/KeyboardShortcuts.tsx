import { useState, useEffect } from 'react'

interface ShortcutItem {
  keys: string[]
  description: string
  category: string
}

const SHORTCUTS: ShortcutItem[] = [
  // 全局
  { keys: ['⌘', 'K'], description: '打开搜索', category: '全局' },
  { keys: ['⌘', 'N'], description: '写新文章（需登录）', category: '全局' },
  { keys: ['?'], description: '打开快捷键面板', category: '全局' },
  { keys: ['Esc'], description: '关闭弹窗 / 面板', category: '全局' },
  // 导航
  { keys: ['G', 'H'], description: '回到首页', category: '导航' },
  { keys: ['G', 'A'], description: '文章归档', category: '导航' },
  { keys: ['G', 'T'], description: '标签云', category: '导航' },
  { keys: ['G', 'B'], description: '关于页', category: '导航' },
  // 文章内（搜索面板内）
  { keys: ['↑', '↓'], description: '搜索结果上下导航', category: '搜索面板' },
  { keys: ['↵'], description: '打开选中的搜索结果', category: '搜索面板' },
]

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  const [activeCat, setActiveCat] = useState<string>('全局')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const categories = [...new Set(SHORTCUTS.map(s => s.category))]
  const filtered = SHORTCUTS.filter(s => s.category === activeCat)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      {/* 遮罩 */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          animation: 'shortcutsFadeIn 0.2s ease',
        }}
      />

      {/* 面板 */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '80vh',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'shortcutsSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
      }}>
        {/* 头部 */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--glow-purple)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                键盘快捷键
              </h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                提升你的浏览效率
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.background = 'var(--bg-glass)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.background = 'transparent'
            }}
            aria-label="关闭"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 分类切换 */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '12px 16px 0',
          borderBottom: '1px solid var(--border-color)',
        }}>
          {categories.map(cat => {
            const isActive = activeCat === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                style={{
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--accent-purple)' : 'var(--text-muted)',
                  borderBottom: isActive ? '2px solid var(--accent-purple)' : '2px solid transparent',
                  marginBottom: '-1px',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-muted)'
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* 快捷键列表 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px 20px',
        }}>
          {filtered.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}>
                {item.description}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {item.keys.map((key, j) => (
                  <kbd
                    key={j}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '24px',
                      height: '24px',
                      padding: '0 6px',
                      borderRadius: '5px',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 2px 0 var(--border-color)',
                    }}
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Mac 用户用 ⌘ 键，Windows/Linux 用户用 Ctrl 键
        </div>
      </div>

      <style>{`
        @keyframes shortcutsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shortcutsSlideIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-10px);
          }
                   to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
