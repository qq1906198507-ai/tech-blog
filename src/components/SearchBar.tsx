import { useState, useRef, useEffect } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    onSearch(value)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
    inputRef.current?.focus()
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '480px',
    }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: isFocused ? 'rgba(74, 125, 255, 0.08)' : 'var(--bg-glass)',
        border: `1px solid ${isFocused ? 'var(--border-glow)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '0 12px',
        transition: 'all var(--transition-normal)',
        boxShadow: isFocused ? 'var(--glow-blue)' : 'none',
      }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: isFocused ? 'var(--accent-blue)' : 'var(--text-muted)',
            flexShrink: 0,
            transition: 'color var(--transition-fast)',
          }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="搜索文章..."
          style={{
            flex: 1,
            padding: '11px 10px',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            minWidth: 0,
          }}
        />
        {query && (
          <button
            onClick={handleClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              flexShrink: 0,
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-blue)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-tertiary)'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        {!isFocused && !query && (
          <kbd style={{
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            ⌘K
          </kbd>
        )}
      </div>

      {isFocused && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <kbd style={{ padding: '2px 6px', borderRadius: '3px', background: 'var(--bg-tertiary)', fontSize: '0.7rem' }}>↑↓</kbd>
            导航
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <kbd style={{ padding: '2px 6px', borderRadius: '3px', background: 'var(--bg-tertiary)', fontSize: '0.7rem' }}>Enter</kbd>
            选择
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <kbd style={{ padding: '2px 6px', borderRadius: '3px', background: 'var(--bg-tertiary)', fontSize: '0.7rem' }}>Esc</kbd>
            关闭
          </span>
        </div>
      )}
    </div>
  )
}
