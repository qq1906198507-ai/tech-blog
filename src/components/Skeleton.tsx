import type { CSSProperties } from 'react'

interface BaseProps {
  width?: number | string
  height?: number | string
  radius?: number | string
  style?: CSSProperties
}

/** 基础骨架块 */
export function Skeleton({ width = '100%', height = 16, radius = 4, style }: BaseProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-glass) 50%, var(--bg-tertiary) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

/** 圆形骨架（头像） */
export function SkeletonCircle({ size = 40, style }: { size?: number; style?: CSSProperties }) {
  return <Skeleton width={size} height={size} radius="50%" style={style} />
}

/** 文章卡片骨架 */
export function PostCardSkeleton() {
  return (
    <div style={{
      padding: 'clamp(20px, 3vw, 28px)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      overflow: 'hidden',
    }}>
      {/* 分类 + 日期 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <Skeleton width={70} height={24} radius="999px" />
        <Skeleton width={60} height={20} />
      </div>

      {/* 标题 */}
      <Skeleton width="90%" height={22} style={{ marginBottom: '10px' }} />
      <Skeleton width="70%" height={22} style={{ marginBottom: '16px' }} />

      {/* 正文摘要 */}
      <Skeleton width="100%" height={14} style={{ marginBottom: '6px' }} />
      <Skeleton width="100%" height={14} style={{ marginBottom: '6px' }} />
      <Skeleton width="80%" height={14} style={{ marginBottom: '20px' }} />

      {/* 底部标签 + 阅读时间 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Skeleton width={50} height={20} radius={4} />
          <Skeleton width={50} height={20} radius={4} />
          <Skeleton width={50} height={20} radius={4} />
        </div>
        <Skeleton width={50} height={16} />
      </div>
    </div>
  )
}

/** 文章列表骨架（N 张卡片） */
export function PostListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))',
      gap: '24px',
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** 评论骨架 */
export function CommentSkeleton() {
  return (
    <div style={{
      padding: '16px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
    }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <SkeletonCircle size={32} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
            <Skeleton width={80} height={14} />
            <Skeleton width={50} height={12} />
          </div>
          <Skeleton width="100%" height={14} style={{ marginBottom: '4px' }} />
          <Skeleton width="60%" height={14} />
        </div>
      </div>
    </div>
  )
}

/** 评论列表骨架 */
export function CommentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  )
}

/** 全局样式注入（只需挂载一次） */
export function SkeletonStyle() {
  return (
    <style>{`
      @keyframes skeletonShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        @keyframes skeletonShimmer {
          0%, 100% { background-position: 200% 0; }
        }
      }
    `}</style>
  )
}
