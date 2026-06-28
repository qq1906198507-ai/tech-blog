import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function FloatingNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)

  useEffect(() => {
    let rafId = 0
    const handleScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        setShow(window.scrollY > 300)
        rafId = 0
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  const isPostPage = location.pathname.startsWith('/post/')

  return (
    <div style={{
      position: 'fixed',
      bottom: '32px',
      left: '50%',
      transform: `translateX(-50%) translateY(${show ? '0' : '100px'})`,
      opacity: show ? 1 : 0,
      transition: 'all var(--transition-normal)',
      zIndex: 100,
      display: 'flex',
      gap: '8px',
      padding: '8px',
      borderRadius: '999px',
      background: 'rgba(10, 10, 15, 0.9)',
      backdropFilter: 'blur(20px)',
      border: '1px solid var(--border-color)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    }}>
      {isPostPage && (
        <NavButton
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          tooltip="返回"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </NavButton>
      )}
      <NavButton
        onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight / 3, behavior: 'smooth' })}
        tooltip="阅读 1/3"
      >
        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>1/3</span>
      </NavButton>
      <NavButton
        onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'smooth' })}
        tooltip="阅读 1/2"
      >
        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>1/2</span>
      </NavButton>
      <NavButton
        onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
        tooltip="底部"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </NavButton>
    </div>
  )
}

function NavButton({ children, onClick, tooltip }: {
  children: React.ReactNode
  onClick: () => void
  tooltip: string
}) {
  const [hover, setHover] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={tooltip}
      style={{
        position: 'relative',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: hover ? 'var(--accent-cyan)' : 'var(--text-secondary)',
        background: hover ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
        transition: 'all var(--transition-fast)',
      }}
    >
      {children}
    </button>
  )
}
