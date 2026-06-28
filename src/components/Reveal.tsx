import { useEffect, useRef, useState, type ReactNode, type CSSProperties, type ElementType } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

interface RevealProps {
  children: ReactNode
  /** 进入方向 */
  direction?: Direction
  /** 延迟（ms），用于错峰动画 */
  delay?: number
  /** 触发阈值，0-1，越小越早触发 */
  threshold?: number
  /** 是否只播一次（默认 true） */
  once?: boolean
  /** 位移距离（px） */
  distance?: number
  /** 作为哪种 HTML 标签渲染，默认 div */
  as?: ElementType
  /** 透传给容器的 style */
  style?: CSSProperties
  /** 透传给容器的 className */
  className?: string
}

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
  none: { x: 0, y: 0 },
}

export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  threshold = 0.15,
  once = true,
  distance = 24,
  as = 'div',
  style,
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  const Tag = as

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // 不支持 IntersectionObserver 时直接显示
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            setVisible(false)
          }
        })
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, once])

  const off = OFFSET[direction]

  return (
    <Tag
      ref={ref as any}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translate(0, 0)'
          : `translate(${off.x * distance}px, ${off.y * distance}px)`,
        transition: `opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}
