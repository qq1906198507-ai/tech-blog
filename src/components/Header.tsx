import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import SearchModal from './SearchModal'
import { useTheme } from '../lib/ThemeContext'
import { useSettings } from '../lib/SettingsContext'
import { prefetchPage } from '../lib/prefetch'
import type { UserInfo } from './AuthModal'

interface HeaderProps {
  onWriteClick: () => void
  onLoginClick: () => void
  onMenuToggle: () => void
  user: UserInfo | null
  onLogout: () => void
}

const navItems = [
  { label: '首页', path: '/' },
  { label: '归档', path: '/archive' },
  { label: '标签', path: '/tags' },
  { label: '关于', path: '/about' },
]

export default function Header({ onWriteClick, onLoginClick, onMenuToggle, user, onLogout }: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const { theme, resolvedTheme, cycleTheme } = useTheme()
  const settings = useSettings()

  // 按钮显示当前用户选择（而非 resolved），title 提示
  const themeLabel = theme === 'system' ? '跟随系统' : theme === 'auto' ? '自动切换' : theme === 'dark' ? '暗色' : '亮色'

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--header-height)',
        background: 'var(--header-bg)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(16px, 4vw, 60px)',
        zIndex: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <button
            onClick={onMenuToggle}
            className="mobile-menu-btn"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="15" y2="12" />
              <line x1="3" y1="18" x2="18" y2="18" />
            </svg>
          </button>

          <div
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#fff',
              boxShadow: 'var(--glow-blue)',
            }}>
              T
            </div>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {settings.blogName}
            </span>
          </div>

          <nav className="desktop-nav" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            {navItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <a
                  key={item.label}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(item.path)
                  }}
                  style={{
                    position: 'relative',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    prefetchPage(item.path)
                    if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  {item.label}
                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '16px',
                      height: '2px',
                      borderRadius: '1px',
                      background: 'var(--accent-cyan)',
                      boxShadow: '0 0 8px var(--accent-cyan)',
                    }} />
                  )}
                </a>
              )
            })}
          </nav>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
        }}>
          <button
            onClick={cycleTheme}
            title={`当前：${themeLabel}（点击切换）`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
              position: 'relative',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--accent-amber)'
              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            {/* dark：太阳（提示可切到亮） */}
            {theme === 'dark' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
            {/* light：月亮 */}
            {theme === 'light' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            {/* system：半太阳半月亮（用电脑图标表示） */}
            {theme === 'system' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
                <path d="M12 7v6" stroke={resolvedTheme === 'dark' ? 'currentColor' : 'transparent'} />
              </svg>
            )}
            {/* system 模式标识小圆点 */}
            {theme === 'system' && (
              <span style={{
                position: 'absolute',
                bottom: '6px',
                right: '6px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: resolvedTheme === 'dark' ? 'var(--accent-purple)' : 'var(--accent-amber)',
                boxShadow: `0 0 6px ${resolvedTheme === 'dark' ? 'var(--accent-purple)' : 'var(--accent-amber)'}`,
              }} />
            )}
            {/* auto：时钟图标 */}
            {theme === 'auto' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
            )}
          </button>

          {settings.enableSearch && (
            <button
              onClick={() => setSearchOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-glass)'
                e.currentTarget.style.borderColor = 'var(--border-color)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--bg-glass)'
                e.currentTarget.style.borderColor = 'var(--border-color)'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="search-label">搜索</span>
              <kbd style={{
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                color: 'rgba(136, 136, 168, 0.5)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}>
                ⌘K
              </kbd>
            </button>
          )}

          <a
            href="/rss"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--accent-orange)'
              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 11a9 9 0 0 1 9 9" />
              <path d="M4 4a16 16 0 0 1 16 16" />
              <circle cx="5" cy="19" r="1" />
            </svg>
          </a>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.background = 'var(--bg-glass)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>

          <div style={{
            width: '1px',
            height: '20px',
            background: 'var(--border-color)',
            margin: '0 4px',
          }} />

          {user ? (
            <UserMenu user={user} onLogout={onLogout} />
          ) : (
            <button
              onClick={onLoginClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-cyan)'
                e.currentTarget.style.color = 'var(--accent-cyan)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              登录
            </button>
          )}

          <button
            onClick={user ? onWriteClick : onLoginClick}
            className="write-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: '#fff',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
              transition: 'all var(--transition-fast)',
              boxShadow: 'var(--glow-blue)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(74, 125, 255, 0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--glow-blue)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="write-text">写文章</span>
          </button>
        </div>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .write-text { display: none; }
          .write-btn { padding: 7px 12px !important; }
          .search-label { display: none; }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .desktop-nav a { padding: 6px 10px !important; font-size: 0.82rem !important; }
        }
      `}</style>
    </>
  )
}

function UserMenu({ user, onLogout }: { user: UserInfo; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const menuItems = [
    { label: '个人主页', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', path: `/profile/${user.id}` },
    { label: '我的文章', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6', tab: 'published' },
    { label: '收藏夹', icon: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z', tab: 'favorites' },
    { label: '草稿箱', icon: 'M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z', tab: 'drafts' },
  ]

  const adminItems = user.role === 'admin' ? [
    { label: '管理后台', icon: 'M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z', path: '/admin' },
  ] : []

  const handleMenuClick = (tab?: string, path?: string) => {
    setOpen(false)
    if (path) {
      navigate(path)
    } else if (tab) {
      navigate(`/dashboard?tab=${tab}`)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px 4px 4px',
          borderRadius: '999px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          transition: 'all var(--transition-fast)',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
      >
        <img
          src={user.avatar}
          alt={user.name}
          loading="lazy"
          decoding="async"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
          }}
        />
        <span className="user-name" style={{
          fontSize: '0.8rem',
          color: 'var(--text-primary)',
          maxWidth: '80px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {user.name}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
          color: 'var(--text-muted)',
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform var(--transition-fast)',
        }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '220px',
            background: 'var(--menu-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '8px',
            zIndex: 100,
            boxShadow: 'var(--shadow-dropdown)',
            animation: 'fadeIn 0.15s ease',
          }}>
            <div style={{
              padding: '12px',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '8px',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '0.85rem', 
                fontWeight: 500, 
                color: 'var(--text-primary)' 
              }}>
                {user.name}
                {user.role === 'admin' && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    color: '#fff',
                    background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))',
                    letterSpacing: '0.05em',
                  }}>
                    ADMIN
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {user.email}
              </div>
            </div>

            {menuItems.map(item => (
              <button
                key={item.label}
                onClick={() => handleMenuClick(item.tab, item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-glass)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}

            {adminItems.length > 0 && (
              <>
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />
                {adminItems.map(item => (
                  <button
                    key={item.label}
                    onClick={() => handleMenuClick(undefined, item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      color: 'var(--accent-purple)',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon} />
                    </svg>
                    {item.label}
                  </button>
                ))}
              </>
            )}

            <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />

            <button
              onClick={() => { setOpen(false); onLogout() }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: 'var(--accent-pink)',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              退出登录
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .user-name { display: none !important; }
        }
      `}</style>
    </div>
  )
}
