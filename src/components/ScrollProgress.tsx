import { useEffect, useRef } from 'react'

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId = 0

    const handleScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        if (barRef.current) {
          const scrollTop = window.scrollY
          const docHeight = document.documentElement.scrollHeight - window.innerHeight
          const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
          barRef.current.style.width = `${pct}%`
        }
        rafId = 0
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '3px',
      zIndex: 1000,
      background: 'transparent',
    }}>
      <div
        ref={barRef}
        style={{
          height: '100%',
          width: '0%',
          background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan), var(--accent-purple))',
          boxShadow: '0 0 10px var(--accent-cyan), 0 0 20px var(--accent-blue)',
          willChange: 'width',
        }}
      />
    </div>
  )
}
