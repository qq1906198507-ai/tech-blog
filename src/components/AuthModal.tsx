import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { isAdmin } from '../lib/admin'
import { useSettings } from '../lib/SettingsContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (user: UserInfo) => void
}

export interface UserInfo {
  id: string
  name: string
  avatar: string
  email: string
  role?: 'admin' | 'user'
}

export default function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const settings = useSettings()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setEmail('')
      setPassword('')
      setName('')
      setError('')
      if (!settings.enableRegistration) setMode('login')
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen, settings.enableRegistration])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    if (mode === 'register' && !name) return

    setLoading(true)
    setError('')

    try {
      // Demo 模式
      if (!isSupabaseConfigured || !supabase) {
        const userName = mode === 'register' ? name : email.split('@')[0]
        const userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`

        onLogin({
          id: `demo_${Date.now()}`,
          name: userName,
          avatar: userAvatar,
          email,
          role: isAdmin(email) ? 'admin' : 'user'
        })
        onClose()
        return
      }

      // Supabase 模式
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
            }
          }
        })

        if (signUpError) throw signUpError

        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            username: name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
          })

          onLogin({
            id: data.user.id,
            name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            email,
            role: isAdmin(email) ? 'admin' : 'user'
          })
          onClose()
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) throw signInError

        if (data.user) {
          onLogin({
            id: data.user.id,
            name: data.user.user_metadata?.name || email.split('@')[0],
            avatar: data.user.user_metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            email: data.user.email || email,
            role: isAdmin(data.user.email || email) ? 'admin' : 'user'
          })
          onClose()
        }
      }
    } catch (err: any) {
      const msg = err.message || ''
      setError(msg || '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    setLoading(true)
    setError('')

    // Demo 模式
    if (!isSupabaseConfigured || !supabase) {
      const email = `user@${provider}.com`
      onLogin({
        id: `demo_${provider}_${Date.now()}`,
        name: `${provider}用户`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`,
        email,
        role: isAdmin(email) ? 'admin' : 'user'
      })
      onClose()
      return
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || '第三方登录失败')
      setLoading(false)
    }
  }

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
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '420px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease',
      }}>
        <div style={{
          padding: '32px 32px 24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 20px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: '#fff',
            boxShadow: 'var(--glow-blue)',
          }}>
            T
          </div>

          <h2 style={{
            fontSize: '1.3rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}>
            {mode === 'login' ? '欢迎回来' : '创建账号'}
          </h2>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}>
            {isSupabaseConfigured
              ? (mode === 'login' ? '登录以发布和管理你的文章' : '注册开始你的写作之旅')
              : '演示模式 - 数据保存在本地'
            }
          </p>
        </div>

        <div style={{
          padding: '0 32px 32px',
        }}>
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '24px',
          }}>
            {[
              { name: 'GitHub', icon: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387' },
              { name: 'Google', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z' }
            ].map(provider => (
              <button
                key={provider.name}
                onClick={() => handleSocialLogin(provider.name.toLowerCase() as 'github' | 'google')}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = 'var(--accent-blue)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d={provider.icon} />
                </svg>
                {provider.name}
              </button>
            ))}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>或</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              marginBottom: '16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--accent-pink)',
              background: 'rgba(236, 72, 153, 0.1)',
              border: '1px solid rgba(236, 72, 153, 0.2)',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            {mode === 'register' && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}>
                  用户名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="输入用户名"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    transition: 'border-color var(--transition-fast)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              </div>
            )}

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}>
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  transition: 'border-color var(--transition-fast)',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}>
                密码
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    transition: 'border-color var(--transition-fast)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    padding: '4px',
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
                <a
                  href="#"
                  onClick={e => e.preventDefault()}
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--accent-blue)',
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--accent-blue)'}
                >
                  忘记密码？
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: '#fff',
                background: loading
                  ? 'var(--bg-tertiary)'
                  : 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                marginTop: '8px',
                transition: 'all var(--transition-fast)',
                boxShadow: loading ? 'none' : 'var(--glow-blue)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}>
            {mode === 'login' ? '还没有账号？' : '已有账号？'}
            {settings.enableRegistration ? (
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
                style={{
                  marginLeft: '6px',
                  color: 'var(--accent-blue)',
                  fontWeight: 500,
                  transition: 'color var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--accent-blue)'}
              >
                {mode === 'login' ? '立即注册' : '去登录'}
              </button>
            ) : (
              mode === 'login' && (
                <span style={{ marginLeft: '6px', fontSize: '0.8rem' }}>注册已关闭</span>
              )
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
