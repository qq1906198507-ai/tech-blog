import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

// theme 是用户选择（含 system），resolvedTheme 是实际生效的
export type ThemeChoice = 'dark' | 'light' | 'system' | 'auto'
export type ResolvedTheme = 'dark' | 'light'

interface ThemeContextType {
  theme: ThemeChoice
  resolvedTheme: ResolvedTheme
  /** 循环切换：dark → light → system → auto → dark */
  cycleTheme: () => void
  /** 直接设置某个主题 */
  setTheme: (t: ThemeChoice) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

const THEME_KEY = 'techflow_theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme(): ThemeChoice {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system' || saved === 'auto') return saved
  } catch {}
  return 'system'
}

function getAutoTheme(): ResolvedTheme {
  const hour = new Date().getHours()
  return (hour >= 18 || hour < 7) ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    getInitialTheme() === 'system' ? getSystemTheme() : (getInitialTheme() as ResolvedTheme)
  )

  // 应用 + 持久化主题
  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme === 'auto' ? getAutoTheme() : theme
    setResolvedTheme(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  // 监听系统主题变化（仅在 system 模式下生效）
  useEffect(() => {
    if (theme !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const newResolved: ResolvedTheme = e.matches ? 'dark' : 'light'
      setResolvedTheme(newResolved)
      document.documentElement.setAttribute('data-theme', newResolved)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  // auto 模式：每分钟检查时间
  useEffect(() => {
    if (theme !== 'auto') return
    const interval = setInterval(() => {
      const resolved = getAutoTheme()
      setResolvedTheme(resolved)
      document.documentElement.setAttribute('data-theme', resolved)
    }, 60000)
    return () => clearInterval(interval)
  }, [theme])

  const setTheme = (t: ThemeChoice) => setThemeState(t)

  const cycleTheme = () => {
    setThemeState(prev => {
      const order: ThemeChoice[] = ['dark', 'light', 'system', 'auto']
      const idx = order.indexOf(prev)
      return order[(idx + 1) % order.length]
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, cycleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
