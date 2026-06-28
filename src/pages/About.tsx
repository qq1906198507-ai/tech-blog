import { useState } from 'react'
import { useSettings } from '../lib/SettingsContext'
import { useSeo } from '../lib/useSeo'

export default function About() {
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null)
  const settings = useSettings()

  useSeo({
    title: '关于',
    description: settings.authorBio || '关于 TechFlow 博客和技术作者',
  })

  const socials = [
    { name: 'GitHub', url: settings.githubUrl || 'https://github.com', icon: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' },
    { name: 'Twitter', url: settings.twitterUrl || 'https://twitter.com', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
    { name: '微信', url: '#', icon: 'M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z' },
    { name: '邮箱', url: settings.email ? `mailto:${settings.email}` : 'mailto:hello@techflow.dev', icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6' },
  ]

  const skills = [
    { name: 'React', level: 90 },
    { name: 'TypeScript', level: 85 },
    { name: 'Node.js', level: 80 },
    { name: 'Python', level: 75 },
    { name: 'Rust', level: 60 },
  ]

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '48px' }}>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'var(--accent-blue)',
          marginBottom: '12px',
          fontFamily: 'var(--font-mono)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ width: '24px', height: '1px', background: 'var(--accent-blue)' }} />
          ABOUT
        </div>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 700,
          lineHeight: 1.3,
          color: 'var(--text-primary)',
          marginBottom: '12px',
        }}>
          关于我
        </h1>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
        padding: '32px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        marginBottom: '32px',
        flexWrap: 'wrap',
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#fff',
          boxShadow: 'var(--glow-blue)',
          flexShrink: 0,
        }}>
          T
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}>
            {settings.authorName || settings.blogName}
          </h2>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            marginBottom: '16px',
          }}>
            {settings.authorBio || '专注于 AI 大模型、前端工程化和全栈开发的技术博主。热爱探索新技术，分享实践经验，相信技术可以改变世界。'}
          </p>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            {socials.map(social => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setHoveredSocial(social.name)}
                onMouseLeave={() => setHoveredSocial(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: hoveredSocial === social.name ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  background: hoveredSocial === social.name ? 'rgba(0, 212, 255, 0.1)' : 'var(--bg-tertiary)',
                  border: `1px solid ${hoveredSocial === social.name ? 'rgba(0, 212, 255, 0.3)' : 'var(--border-color)'}`,
                  transition: 'all var(--transition-fast)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d={social.icon} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        padding: '32px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        marginBottom: '32px',
      }}>
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{
            width: '20px',
            height: '2px',
            background: 'var(--accent-blue)',
          }} />
          技能栈
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {skills.map((skill, index) => (
            <div key={skill.name}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {skill.name}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {skill.level}%
                </span>
              </div>
              <div style={{
                height: '6px',
                borderRadius: '3px',
                background: 'var(--bg-tertiary)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${skill.level}%`,
                  borderRadius: '3px',
                  background: `linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))`,
                  boxShadow: '0 0 10px var(--accent-cyan)',
                  transition: 'width 1s ease',
                  animation: `growWidth 1s ease ${index * 0.1}s both`,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        padding: '32px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}>
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{
            width: '20px',
            height: '2px',
            background: 'var(--accent-blue)',
          }} />
          联系方式
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          {[
            { label: '邮箱', value: 'hello@techflow.dev', icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6' },
            { label: 'GitHub', value: 'github.com/techflow', icon: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387' },
            { label: 'Twitter', value: '@techflow', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17' },
          ].map(item => (
            <div
              key={item.label}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2">
                  <path d={item.icon} />
                </svg>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.label}
                </span>
              </div>
              <span style={{
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
              }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes growWidth {
          from { width: 0; }
        }
      `}</style>
    </div>
  )
}
