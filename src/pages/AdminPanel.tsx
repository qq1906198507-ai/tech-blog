import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePosts } from '../lib/PostContext'
import { useUsers } from '../lib/UserContext'
import { useToast } from '../lib/ToastContext'
import { useSettings } from '../lib/SettingsContext'
import { commentService, type Comment as ReviewComment } from '../services/database'
import BarChart from '../components/BarChart'
import type { UserInfo } from '../components/AuthModal'

interface AdminPanelProps {
  user: UserInfo | null
}

type Tab = 'overview' | 'posts' | 'users' | 'comments' | 'settings'

export default function AdminPanel({ user }: AdminPanelProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { posts, deletePost, togglePin } = usePosts()
  const { users, deleteUser, toggleUserStatus, changeUserRole } = useUsers()
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'readTime' | 'viewCount'>('date')
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'user' | 'active' | 'disabled'>('all')
  // 危险操作的两步式确认：记录待确认的 action key
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const pendingTimer = useRef<number | undefined>(undefined)

  // 触发"再次点击确认"模式，3 秒后自动取消
  const armConfirm = (key: string, hint: string) => {
    if (pendingAction === key) {
      // 已经 arm 过，这次执行
      window.clearTimeout(pendingTimer.current)
      setPendingAction(null)
      return true
    }
    setPendingAction(key)
    showToast(hint, 'warning')
    window.clearTimeout(pendingTimer.current)
    pendingTimer.current = window.setTimeout(() => setPendingAction(null), 3000)
    return false
  }

  useEffect(() => () => window.clearTimeout(pendingTimer.current), [])
  const contextSettings = useSettings()
  const [settings, setSettings] = useState(contextSettings)
  const [settingsSaved, setSettingsSaved] = useState(false)

  useEffect(() => {
    setSettings(contextSettings)
  }, [contextSettings])

  useEffect(() => {
    localStorage.setItem('techflow_settings', JSON.stringify(settings))
  }, [settings])

  const COMMENTS_STORAGE_KEY = 'techflow_comments'
  const loadComments = () => {
    try {
      const saved = localStorage.getItem(COMMENTS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {
      console.error('Failed to load comments:', e)
    }
    return []
  }

  const [commentList, setCommentList] = useState(loadComments)

  const [pendingComments, setPendingComments] = useState<ReviewComment[]>([])

  const loadPendingComments = async () => {
    try {
      const list = await commentService.getPendingComments()
      setPendingComments(list)
    } catch (e) {
      console.error('Failed to load pending comments:', e)
    }
  }

  useEffect(() => {
    if (activeTab === 'comments') {
      loadPendingComments()
    }
  }, [activeTab, commentList])

  useEffect(() => {
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(commentList))
  }, [commentList])

  const filteredPosts = useMemo(() => {
    let result = [...posts]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    result.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortBy === 'viewCount') return (b.viewCount || 0) - (a.viewCount || 0)
      return b.readTime - a.readTime
    })
    return result
  }, [posts, searchQuery, sortBy])

  const filteredUsers = useMemo(() => {
    let result = [...users]
    if (userSearchQuery) {
      const q = userSearchQuery.toLowerCase()
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    }
    if (userFilter === 'admin') {
      result = result.filter(u => u.role === 'admin')
    } else if (userFilter === 'user') {
      result = result.filter(u => u.role === 'user')
    } else if (userFilter === 'active') {
      result = result.filter(u => u.status === 'active')
    } else if (userFilter === 'disabled') {
      result = result.filter(u => u.status === 'disabled')
    }
    return result
  }, [users, userSearchQuery, userFilter])

  if (!user || user.role !== 'admin') {
    return (
      <div style={{
        textAlign: 'center',
        padding: '120px 0',
        color: 'var(--text-muted)',
      }}>
        <div style={{
          fontSize: '4rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '16px',
        }}>403</div>
        <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>无权限访问</div>
        <div style={{ fontSize: '0.85rem', marginBottom: '32px' }}>仅管理员可访问此页面</div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 28px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          返回首页
        </button>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: '概览', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { key: 'posts', label: '文章管理', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
    { key: 'users', label: '用户管理', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75' },
    { key: 'comments', label: '评论管理', icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
    { key: 'settings', label: '系统设置', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
  ]

  const handleDeletePost = (postId: string) => {
    if (!armConfirm(`post_${postId}`, '再次点击以确认删除文章')) return
    deletePost(postId)
    showToast('文章已删除', 'success')
  }

  const handleDeleteUser = (userId: string, userName: string) => {
    if (!armConfirm(`user_${userId}`, `再次点击以确认删除用户 "${userName}"`)) return
    deleteUser(userId)
    showToast(`用户 "${userName}" 已删除`, 'success')
  }

  const handleToggleStatus = (userId: string, currentStatus: 'active' | 'disabled') => {
    const action = currentStatus === 'active' ? '禁用' : '启用'
    if (!armConfirm(`status_${userId}`, `再次点击以确认${action}此用户`)) return
    toggleUserStatus(userId)
    showToast(`已${action}该用户`, 'success')
  }

  const handleChangeRole = (userId: string, newRole: 'admin' | 'user') => {
    const roleLabel = newRole === 'admin' ? '管理员' : '普通用户'
    if (!armConfirm(`role_${userId}`, `再次点击以确认设置为${roleLabel}`)) return
    changeUserRole(userId, newRole)
    showToast(`已设置为${roleLabel}`, 'success')
  }

  const renderOverview = () => (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {[
          { label: '文章总数', value: posts.length, color: 'var(--accent-blue)', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' },
          { label: '用户总数', value: users.length, color: 'var(--accent-purple)', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100-8 4 4 0 000 8z' },
          { label: '活跃用户', value: users.filter(u => u.status === 'active').length, color: 'var(--accent-cyan)', icon: 'M22 11.08V12a10 10 0 11-5.93-9.14' },
          { label: '管理员数', value: users.filter(u => u.role === 'admin').length, color: 'var(--accent-pink)', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
        ].map(stat => (
          <div key={stat.label} style={{
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `${stat.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={stat.icon} />
                </svg>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <BarChart
        data={[
          { label: '文章', value: posts.length, color: 'var(--accent-blue)' },
          { label: '总阅读', value: posts.reduce((s, p) => s + (p.viewCount || 0), 0), color: 'var(--accent-cyan)' },
          { label: '用户', value: users.length, color: 'var(--accent-purple)' },
          { label: '评论', value: commentList.length, color: 'var(--accent-pink)' },
        ]}
        height={140}
      />

      <div style={{
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
          最近文章
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {posts.slice(0, 5).map(post => (
            <div
              key={post.id}
              onClick={() => navigate(`/post/${post.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'var(--bg-tertiary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(74, 125, 255, 0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {post.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {post.authorName || '匿名'} · {post.category} · {post.date}
                </div>
              </div>
              <span style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                color: 'var(--accent-cyan)',
                background: 'rgba(0, 212, 255, 0.1)',
                flexShrink: 0,
                marginLeft: '12px',
              }}>
                {post.readTime} min
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderPosts = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="搜索文章..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'date' | 'readTime' | 'viewCount')}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <option value="date">按日期排序</option>
            <option value="readTime">按时长排序</option>
            <option value="viewCount">按阅读量排序</option>
          </select>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          共 {filteredPosts.length} 篇{searchQuery ? `（搜索: ${searchQuery}）` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredPosts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            没有找到匹配的文章
          </div>
        )}
        {filteredPosts.map(post => (
          <div
            key={post.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                onClick={() => navigate(`/post/${post.id}`)}
                style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer', marginBottom: '4px' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-blue)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
              >
                {post.title}
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {post.authorName || '匿名'}
                </span>
                <span>{post.category}</span>
                <span>{post.date}</span>
                <span>{post.readTime} min</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {post.viewCount || 0}
                </span>
                {post.pinned && (
                  <span style={{ color: 'var(--accent-amber)', fontWeight: 500 }}>📌 置顶</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '16px' }}>
              <button
                onClick={() => togglePin(post.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: post.pinned ? 'var(--accent-amber)' : 'var(--text-muted)',
                  background: post.pinned ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-tertiary)',
                  border: `1px solid ${post.pinned ? 'rgba(245, 158, 11, 0.2)' : 'var(--border-color)'}`,
                  transition: 'all var(--transition-fast)',
                }}
              >
                {post.pinned ? '取消置顶' : '置顶'}
              </button>
              <button
                onClick={() => navigate(`/post/${post.id}`)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--accent-blue)',
                  background: 'rgba(74, 125, 255, 0.1)',
                  border: '1px solid rgba(74, 125, 255, 0.2)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(74, 125, 255, 0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(74, 125, 255, 0.1)'}
              >
                查看
              </button>
              <button
                onClick={() => handleDeletePost(post.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--accent-pink)',
                  background: 'rgba(236, 72, 153, 0.1)',
                  border: '1px solid rgba(236, 72, 153, 0.2)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(236, 72, 153, 0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)'}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderUsers = () => (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '24px',
      }}>
        {[
          { label: '用户总数', value: users.length, color: 'var(--accent-purple)' },
          { label: '活跃用户', value: users.filter(u => u.status === 'active').length, color: 'var(--accent-cyan)' },
          { label: '管理员', value: users.filter(u => u.role === 'admin').length, color: 'var(--accent-pink)' },
          { label: '已禁用', value: users.filter(u => u.status === 'disabled').length, color: 'var(--accent-orange)' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '300px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="搜索用户..."
              value={userSearchQuery}
              onChange={e => setUserSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </div>
          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value as typeof userFilter)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <option value="all">全部用户</option>
            <option value="admin">管理员</option>
            <option value="user">普通用户</option>
            <option value="active">已激活</option>
            <option value="disabled">已禁用</option>
          </select>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          共 {filteredUsers.length} 人{userSearchQuery ? `（搜索: ${userSearchQuery}）` : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            没有找到匹配的用户
          </div>
        )}
        {filteredUsers.map(u => (
          <div key={u.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            opacity: u.status === 'disabled' ? 0.6 : 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <img src={u.avatar} alt={u.name} loading="lazy" decoding="async" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{u.name}</span>
                  {u.role === 'admin' && (
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      color: '#fff',
                      background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))',
                    }}>ADMIN</span>
                  )}
                  {u.status === 'disabled' && (
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      color: 'var(--accent-pink)',
                      background: 'rgba(236, 72, 153, 0.1)',
                    }}>已禁用</span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {u.email}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '12px' }}>
              {u.id !== user?.id && (
                <>
                  <button
                    onClick={() => handleChangeRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      color: u.role === 'admin' ? 'var(--accent-purple)' : 'var(--accent-cyan)',
                      background: u.role === 'admin' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(0, 212, 255, 0.1)',
                      border: `1px solid ${u.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(0, 212, 255, 0.2)'}`,
                    }}
                  >
                    {u.role === 'admin' ? '取消管理员' : '设为管理员'}
                  </button>
                  <button
                    onClick={() => handleToggleStatus(u.id, u.status)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      color: u.status === 'active' ? 'var(--accent-orange)' : 'var(--accent-cyan)',
                      background: u.status === 'active' ? 'rgba(251, 146, 60, 0.1)' : 'rgba(0, 212, 255, 0.1)',
                      border: `1px solid ${u.status === 'active' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(0, 212, 255, 0.2)'}`,
                    }}
                  >
                    {u.status === 'active' ? '禁用' : '启用'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      color: 'var(--accent-pink)',
                      background: 'rgba(236, 72, 153, 0.1)',
                      border: '1px solid rgba(236, 72, 153, 0.2)',
                    }}
                  >
                    删除
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderComments = () => {
    return (
      <div>
        {settings.requireApproval && (
          <div style={{
            marginBottom: '24px',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-pending)',
            border: '1px solid var(--accent-pending-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>待审核评论</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-amber)',
                  background: 'var(--bg-tertiary)',
                }}>
                  {pendingComments.length}
                </span>
              </div>
            </div>
            {pendingComments.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>暂无待审核评论</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pendingComments.map(c => {
                  const post = posts.find(p => p.id === c.post_id)
                  return (
                    <div key={c.id} style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>{c.author}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>评论于</span>
                          <span
                            onClick={() => navigate(`/post/${c.post_id}`)}
                            style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', cursor: 'pointer' }}
                          >
                            {post?.title || '已删除的文章'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        {c.content}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={async () => {
                            await commentService.approveComment(c.id)
                            await loadPendingComments()
                            showToast('评论已通过', 'success')
                          }}
                          style={{
                            padding: '5px 14px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 500,
                            color: '#fff',
                            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                          }}
                        >
                          通过
                        </button>
                        <button
                          onClick={async () => {
                            await commentService.rejectComment(c.id)
                            await loadPendingComments()
                            showToast('评论已驳回', 'info')
                          }}
                          style={{
                            padding: '5px 14px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            color: 'var(--accent-pink)',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          驳回
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>所有评论</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>共 {commentList.length} 条</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {commentList.map(comment => (
            <div
              key={comment.id}
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{comment.author}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>评论于</span>
                  <span
                    onClick={() => navigate(`/post/${comment.postId}`)}
                    style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  >
                    {comment.postTitle}
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{comment.date}</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {comment.content}
              </div>
              <button
                onClick={() => {
                  if (!armConfirm(`comment_${comment.id}`, '再次点击以确认删除该评论')) return
                  setCommentList(prev => prev.filter(c => c.id !== comment.id))
                  showToast('评论已删除', 'success')
                }}
                style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  color: 'var(--accent-pink)',
                  background: 'rgba(236, 72, 153, 0.1)',
                  border: '1px solid rgba(236, 72, 153, 0.2)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(236, 72, 153, 0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)'}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSettings = () => {
    const inputStyle = {
      width: '100%',
      maxWidth: '400px',
      padding: '10px 14px',
      borderRadius: '8px',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-color)',
      color: 'var(--text-primary)',
      fontSize: '0.9rem',
      transition: 'border-color var(--transition-fast)',
    }

    const labelStyle = {
      display: 'block' as const,
      fontSize: '0.85rem',
      color: 'var(--text-secondary)',
      marginBottom: '8px',
    }

    const sectionStyle = {
      padding: '24px',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      display: 'flex' as const,
      flexDirection: 'column' as const,
      gap: '20px',
    }

    const sectionTitleStyle = {
      fontSize: '0.95rem',
      fontWeight: 600,
      color: 'var(--text-primary)',
      paddingBottom: '12px',
      borderBottom: '1px solid var(--border-color)',
    }

    const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</label>
        <button
          onClick={onChange}
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            padding: '2px',
            background: checked ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: checked ? 'flex-end' : 'flex-start',
          }}
        >
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'all var(--transition-fast)',
          }} />
        </button>
      </div>
    )

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>基本信息</h3>
          {[
            { label: '博客名称', key: 'blogName' as const, type: 'text', placeholder: 'My Blog' },
            { label: '博客描述', key: 'blogDesc' as const, type: 'text', placeholder: '探索技术前沿' },
            { label: '网站地址', key: 'siteUrl' as const, type: 'url', placeholder: 'https://example.com' },
            { label: '网站关键词', key: 'siteKeywords' as const, type: 'text', placeholder: 'AI,技术,博客' },
          ].map(field => (
            <div key={field.key}>
              <label style={labelStyle}>{field.label}</label>
              <input
                type={field.type}
                value={settings[field.key]}
                onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>
          ))}
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>作者信息</h3>
          {[
            { label: '作者名称', key: 'authorName' as const, type: 'text', placeholder: '张三' },
            { label: '作者简介', key: 'authorBio' as const, type: 'text', placeholder: '全栈开发者' },
            { label: '头像链接', key: 'authorAvatar' as const, type: 'url', placeholder: 'https://example.com/avatar.jpg' },
            { label: '邮箱', key: 'email' as const, type: 'email', placeholder: 'admin@example.com' },
          ].map(field => (
            <div key={field.key}>
              <label style={labelStyle}>{field.label}</label>
              <input
                type={field.type}
                value={settings[field.key]}
                onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>
          ))}
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>社交媒体</h3>
          {[
            { label: 'GitHub 地址', key: 'githubUrl' as const, type: 'url', placeholder: 'https://github.com/username' },
            { label: 'Twitter 地址', key: 'twitterUrl' as const, type: 'url', placeholder: 'https://twitter.com/username' },
          ].map(field => (
            <div key={field.key}>
              <label style={labelStyle}>{field.label}</label>
              <input
                type={field.type}
                value={settings[field.key]}
                onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>
          ))}
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>文章设置</h3>
          <div>
            <label style={labelStyle}>每页文章数</label>
            <input
              type="number"
              value={settings.postsPerPage}
              onChange={e => setSettings({ ...settings, postsPerPage: Math.max(1, parseInt(e.target.value) || 10) })}
              min="1"
              max="50"
              style={{ ...inputStyle, width: '120px' }}
            />
          </div>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>评论设置</h3>
          <Toggle
            label="允许评论"
            checked={settings.allowComments}
            onChange={() => setSettings({ ...settings, allowComments: !settings.allowComments })}
          />
          <Toggle
            label="评论需要审核"
            checked={settings.requireApproval}
            onChange={() => setSettings({ ...settings, requireApproval: !settings.requireApproval })}
          />
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>功能开关</h3>
          <Toggle
            label="允许用户注册"
            checked={settings.enableRegistration}
            onChange={() => setSettings({ ...settings, enableRegistration: !settings.enableRegistration })}
          />
          <Toggle
            label="启用搜索功能"
            checked={settings.enableSearch}
            onChange={() => setSettings({ ...settings, enableSearch: !settings.enableSearch })}
          />
          <Toggle
            label="启用夜间模式切换"
            checked={settings.enableNightMode}
            onChange={() => setSettings({ ...settings, enableNightMode: !settings.enableNightMode })}
          />
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>页脚设置</h3>
          <div>
            <label style={labelStyle}>页脚文字</label>
            <input
              type="text"
              value={settings.footerText}
              onChange={e => setSettings({ ...settings, footerText: e.target.value })}
              placeholder="© 2026 TechFlow. All rights reserved."
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>
          <div>
            <label style={labelStyle}>ICP 备案号</label>
            <input
              type="text"
              value={settings.icp}
              onChange={e => setSettings({ ...settings, icp: e.target.value })}
              placeholder="京ICP备xxxxxxxx号"
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>统计代码</h3>
          <div>
            <label style={labelStyle}>百度统计 / Google Analytics 代码</label>
            <textarea
              value={settings.analyticsCode}
              onChange={e => setSettings({ ...settings, analyticsCode: e.target.value })}
              placeholder="粘贴统计代码..."
              rows={4}
              style={{
                ...inputStyle,
                maxWidth: '100%',
                resize: 'vertical' as const,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>
        </div>

        <div style={sectionStyle}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              数据备份
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              导出文章、草稿、用户、评论、设置等全部本地数据为 JSON 文件；或从备份文件恢复。
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  const data: Record<string, string> = {}
                  const prefixes = ['techflow_', 'comments_', 'like_', 'favorites_', 'techflow_search_history', 'techflow_reading_history']
                  for (const key of Object.keys(localStorage)) {
                    if (prefixes.some(p => key.startsWith(p))) {
                      data[key] = localStorage.getItem(key) || ''
                    }
                  }
                  const payload = JSON.stringify({ __app: 'TechFlow', __exportedAt: new Date().toISOString(), data }, null, 2)
                  const blob = new Blob([payload], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `techflow-backup-${new Date().toISOString().slice(0, 10)}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                  showToast('数据已导出', 'success')
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: '#fff',
                  background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                导出数据
              </button>
              <button
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'application/json,.json'
                  input.onchange = (ev) => {
                    const file = (ev.target as HTMLInputElement).files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () => {
                      try {
                        const parsed = JSON.parse(reader.result as string)
                        const data = parsed.data || parsed
                        if (!data || typeof data !== 'object') throw new Error('invalid')
                        Object.keys(data).forEach(k => localStorage.setItem(k, data[k]))
                        showToast('导入成功，即将刷新页面...', 'success')
                        setTimeout(() => window.location.reload(), 1200)
                      } catch {
                        showToast('文件格式无效', 'error')
                      }
                    }
                    reader.readAsText(file)
                  }
                  input.click()
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                导入数据
              </button>
            </div>
            <div style={{
              marginTop: '14px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'var(--accent-pending)',
              border: '1px solid var(--accent-pending-border)',
              fontSize: '0.75rem',
              color: 'var(--accent-amber)',
            }}>
              注意：导入会覆盖同名数据，操作不可撤销，建议先导出当前数据备份。
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setSettingsSaved(true)
            setTimeout(() => setSettingsSaved(false), 2000)
          }}
          style={{
            padding: '12px 32px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: '#fff',
            background: settingsSaved
              ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))'
              : 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            boxShadow: 'var(--glow-blue)',
            transition: 'all var(--transition-fast)',
            alignSelf: 'flex-start',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {settingsSaved ? '已保存' : '保存设置'}
        </button>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview()
      case 'posts': return renderPosts()
      case 'users': return renderUsers()
      case 'comments': return renderComments()
      case 'settings': return renderSettings()
    }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '8px',
        }}>
          管理后台
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          欢迎回来，{user.name}
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        padding: '4px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: activeTab === tab.key ? 500 : 400,
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
              background: activeTab === tab.key ? 'var(--bg-tertiary)' : 'transparent',
              border: 'none',
              transition: 'all var(--transition-fast)',
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}>
        {renderContent()}
      </div>
    </div>
  )
}
