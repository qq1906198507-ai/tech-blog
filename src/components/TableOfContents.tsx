import { useState, useEffect, useRef } from 'react'

export interface TocItem {
  level: 2 | 3
  text: string
  id: string
}

interface TableOfContentsProps {
  items: TocItem[]
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (items.length === 0) return

    // 收集所有标题元素
    const headings = items
      .map(item => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)

    if (headings.length === 0) return

    // 清理上一次的 observer
    observerRef.current?.disconnect()

    // 用 IntersectionObserver 监测哪个标题在视口顶部附近
    const observer = new IntersectionObserver(
      (entries) => {
        // 找出当前最靠近顶部且可见的标题
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        // 顶部留出 header 高度 + 一点缓冲
        rootMargin: '-80px 0px -70% 0px',
        threshold: [0, 1],
      }
    )

    headings.forEach(h => observer.observe(h))
    observerRef.current = observer

    return () => observer.disconnect()
  }, [items])

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return

    // 平滑滚动，并考虑顶部固定 header 的偏移
    const headerOffset = 80
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset
    window.scrollTo({ top, behavior: 'smooth' })

    // 临时高亮被点击的项
    setActiveId(id)

    // 更新 URL hash（不触发滚动）
    history.replaceState(null, '', `#${id}`)
  }

  if (items.length === 0) return null

  return (
    <nav style={{
      position: 'sticky',
      top: 'calc(var(--header-height) + 32px)',
      maxHeight: 'calc(100vh - var(--header-height) - 64px)',
      overflowY: 'auto',
      padding: '4px 0 4px 16px',
      borderLeft: '1px solid var(--border-color)',
    }}>
      <div style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        color: 'var(--text-muted)',
        marginBottom: '14px',
        fontFamily: 'var(--font-mono)',
      }}>
        目录
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, i) => {
          const isActive = activeId === item.id
          return (
            <li
              key={`${item.id}-${i}`}
              style={{
                marginBottom: '2px',
                paddingLeft: item.level === 3 ? '14px' : 0,
              }}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                style={{
                  display: 'block',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: item.level === 3 ? '0.76rem' : '0.82rem',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive
                    ? 'var(--accent-cyan)'
                    : item.level === 3
                      ? 'var(--text-muted)'
                      : 'var(--text-secondary)',
                  background: isActive ? 'rgba(0, 212, 255, 0.06)' : 'transparent',
                  borderLeft: isActive
                    ? '2px solid var(--accent-cyan)'
                    : '2px solid transparent',
                  marginLeft: '-16px',
                  paddingLeft: '14px',
                  lineHeight: 1.5,
                  transition: 'all var(--transition-fast)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = item.level === 3 ? 'var(--text-muted)' : 'var(--text-secondary)'
                  }
                }}
                title={item.text}
              >
                {item.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
