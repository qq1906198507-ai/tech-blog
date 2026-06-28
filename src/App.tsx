import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { isAdmin } from './lib/admin'
import { prefetchOnIdle } from './lib/prefetch'
import { PostProvider } from './lib/PostContext'
import { UserProvider, useUsers } from './lib/UserContext'
import { ThemeProvider } from './lib/ThemeContext'
import { SettingsProvider } from './lib/SettingsContext'
import { ToastProvider, useToast } from './lib/ToastContext'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import ScrollProgress from './components/ScrollProgress'
import BackToTop from './components/BackToTop'
import FloatingNav from './components/FloatingNav'
import PageTransition from './components/PageTransition'
import KeyboardShortcuts from './components/KeyboardShortcuts'
import ErrorBoundary from './components/ErrorBoundary'
import AuthModal, { type UserInfo } from './components/AuthModal'
import WritePostModal from './components/WritePostModal'
import { SkeletonStyle, PostListSkeleton } from './components/Skeleton'
import type { Draft } from './types'

// 路由级懒加载：首屏只加载首页，其余按需加载
const Home = lazy(() => import('./pages/Home'))
const PostDetail = lazy(() => import('./pages/PostDetail'))
const Archive = lazy(() => import('./pages/Archive'))
const Tags = lazy(() => import('./pages/Tags'))
const About = lazy(() => import('./pages/About'))
const MyPosts = lazy(() => import('./pages/MyPosts'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const Profile = lazy(() => import('./pages/Profile'))
const Rss = lazy(() => import('./pages/Rss'))

const ParticleBackground = lazy(() => import('./components/ParticleBackground'))



/** 路由加载时的骨架屏 fallback */
function RouteFallback() {
  return (
    <div style={{ minHeight: '50vh' }}>
      <PostListSkeleton count={3} />
    </div>
  )
}

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('全部')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [writeModalOpen, setWriteModalOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [editDraft, setEditDraft] = useState<Draft | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(true)
  const { users, addUser, updateUser } = useUsers()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const usersRef = useRef(users)
  usersRef.current = users

  const syncUserToManager = useCallback((userInfo: UserInfo) => {
    const existingUser = usersRef.current.find(u => u.id === userInfo.id || u.email === userInfo.email)
    if (existingUser) {
      updateUser(existingUser.id, {
        lastLogin: new Date().toISOString().split('T')[0],
        name: userInfo.name,
        avatar: userInfo.avatar,
      })
    } else {
      addUser({
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.avatar,
        role: userInfo.role || 'user',
      })
    }
  }, [addUser, updateUser])

  useEffect(() => {
    let mounted = true

    const syncFromSession = (sessionUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null }) => {
      const userInfo: UserInfo = {
        id: sessionUser.id,
        name: (sessionUser.user_metadata?.name as string) || sessionUser.email?.split('@')[0] || 'User',
        avatar: (sessionUser.user_metadata?.avatar as string) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionUser.email}`,
        email: sessionUser.email || '',
        role: isAdmin(sessionUser.email || '') ? 'admin' : 'user'
      }
      setUser(userInfo)
      syncUserToManager(userInfo)
    }

    const checkUser = async () => {
      try {
        if (!isSupabaseConfigured || !supabase) {
          if (mounted) setUser(null)
          return
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && mounted) {
          syncFromSession(session.user)
        } else if (mounted) {
          setUser(null)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        if (mounted) setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    checkUser()

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return () => { mounted = false }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'SIGNED_IN' && session?.user) {
          syncFromSession(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [syncUserToManager])

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 首次加载完成后，浏览器空闲时段预取常用页面 chunk
  useEffect(() => {
    prefetchOnIdle(['/archive', '/tags', '/about'])
  }, [])

  // 快捷键监听：⌘N 写文章 / ? 快捷键面板 / g+字母 导航 / Esc 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // ⌘N / Ctrl+N —— 写文章
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        if (user) setWriteModalOpen(true)
        else setAuthModalOpen(true)
        return
      }

      // Esc —— 关闭所有弹窗
      if (e.key === 'Escape') {
        setWriteModalOpen(false)
        setAuthModalOpen(false)
        setShortcutsOpen(false)
        return
      }

      // 输入框内不触发单字符快捷键
      if (isTyping || e.metaKey || e.ctrlKey || e.altKey) return

      // ? —— 快捷键面板（需要 Shift 才能输入 ?）
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setShortcutsOpen(prev => !prev)
        return
      }

      // g + 字母 —— 双键导航
      if (e.key.toLowerCase() === 'g') {
        const onSecondKey = (ev: KeyboardEvent) => {
          window.removeEventListener('keydown', onSecondKey)
          if (ev.metaKey || ev.ctrlKey || ev.altKey) return
          const map: Record<string, string> = {
            h: '/',
            a: '/archive',
            t: '/tags',
            b: '/about',
          }
          const path = map[ev.key.toLowerCase()]
          if (path) {
            ev.preventDefault()
            navigate(path)
          }
        }
        // 等待下一个按键（300ms 内）
        window.addEventListener('keydown', onSecondKey, { once: true })
        setTimeout(() => window.removeEventListener('keydown', onSecondKey), 600)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [user, navigate])

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category)
    setSearchQuery('')
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  const handleLogin = useCallback((userInfo: UserInfo) => {
    setUser(userInfo)
    syncUserToManager(userInfo)
    showToast(`欢迎回来，${userInfo.name}！`, 'success')
  }, [syncUserToManager, showToast])

  const handleLogout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    showToast('已安全退出登录', 'info')
  }, [showToast])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        background: 'var(--bg-primary)',
      }}>
        {/* 品牌 Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#fff',
            boxShadow: 'var(--glow-blue)',
            animation: 'logoPulse 2s ease-in-out infinite',
          }}>
            T
          </div>
          <span style={{
            fontSize: '1.3rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            TechFlow
          </span>
        </div>

        {/* 进度条 */}
        <div style={{
          width: '180px',
          height: '3px',
          borderRadius: '999px',
          background: 'var(--bg-tertiary)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '40%',
            borderRadius: '999px',
            background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))',
            boxShadow: '0 0 8px var(--accent-cyan)',
            animation: 'loadingSweep 1.2s ease-in-out infinite',
          }} />
        </div>

        <style>{`
          @keyframes logoPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.06); opacity: 0.85; }
          }
          @keyframes loadingSweep {
            0% { left: -40%; }
            100% { left: 100%; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Suspense fallback={null}>
        <ParticleBackground />
      </Suspense>
      <ScrollProgress />

      <Header
        onWriteClick={() => setWriteModalOpen(true)}
        onLoginClick={() => setAuthModalOpen(true)}
        onMenuToggle={() => setSidebarOpen(prev => !prev)}
        user={user}
        onLogout={handleLogout}
      />

      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main style={{
        marginLeft: isMobile ? 0 : 'var(--sidebar-width)',
        marginTop: 'var(--header-height)',
        padding: isMobile ? '24px 16px 96px' : '48px 48px 96px',
        position: 'relative',
        zIndex: 1,
        maxWidth: '100%',
        transition: 'margin-left var(--transition-normal)',
      }}>
        <PageTransition>
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Home searchQuery={searchQuery} activeCategory={activeCategory} />} />
                <Route path="/post/:id" element={<PostDetail user={user} />} />
                <Route path="/archive" element={<Archive />} />
                <Route path="/tags" element={<Tags />} />
                <Route path="/about" element={<About />} />
                <Route path="/dashboard" element={<MyPosts user={user} onEditDraft={(draft) => { setEditDraft(draft as Draft); setWriteModalOpen(true) }} />} />
                <Route path="/admin" element={<AdminPanel user={user} />} />
                <Route path="/profile/:id" element={<Profile user={user} />} />
                <Route path="/rss" element={<Rss />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </PageTransition>
      </main>

      <BackToTop />
      <FloatingNav />
      <WritePostModal isOpen={writeModalOpen} onClose={() => { setWriteModalOpen(false); setEditDraft(null) }} user={user} editDraft={editDraft} />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
      />
      <KeyboardShortcuts isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <HashRouter>
          <ToastProvider>
            <UserProvider>
              <PostProvider>
                <SkeletonStyle />
                <AppContent />
              </PostProvider>
            </UserProvider>
          </ToastProvider>
        </HashRouter>
      </SettingsProvider>
    </ThemeProvider>
  )
}
