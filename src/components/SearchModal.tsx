import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePosts } from '../lib/PostContext'
import { type Comment } from '../services/database'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

type SearchKind = 'post' | 'author' | 'tag' | 'comment'

interface SearchItem {
  kind: SearchKind
  id: string
  title: string
  subtitle: string
  meta: string
  category?: string
  postId?: string
  score: number
}

const SEARCH_HISTORY_KEY = 'techflow_search_history'
const MAX_HISTORY = 5

function getSearchHistory(): string[] {
  try {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveSearchHistory(query: string) {
  const history = getSearchHistory().filter(h => h !== query)
  history.unshift(query)
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
}

function clearSearchHistory() {
  localStorage.removeItem(SEARCH_HISTORY_KEY)
}

function loadCommentsSync(): Comment[] {
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('comments_'))
    const all: Comment[] = []
    keys.forEach(key => {
      const raw = localStorage.getItem(key)
      if (!raw) return
      try {
        all.push(...JSON.parse(raw))
      } catch {
        // ignore
      }
    })
    return all
  } catch {
    return []
  }
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { posts } = usePosts()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setHistory(getSearchHistory())
      setTimeout(() => inputRef.current?.focus(), 50)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const searchItems = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const items: SearchItem[] = []
    const comments = loadCommentsSync().filter(c => (c.status || 'approved') === 'approved')

    posts.forEach(post => {
      const matchesTitle = post.title.toLowerCase().includes(q)
      const matchesExcerpt = post.excerpt.toLowerCase().includes(q)
      const matchesTag = post.tags.some(t => t.toLowerCase().includes(q))
      const matchesCategory = post.category.toLowerCase().includes(q)
      const matchesAuthor = (post.authorName || '').toLowerCase().includes(q)

      if (matchesTitle || matchesExcerpt || matchesTag || matchesCategory || matchesAuthor) {
        const score = (matchesTitle ? 8 : 0) + (matchesAuthor ? 7 : 0) + (matchesTag ? 6 : 0) + (matchesCategory ? 4 : 0) + (matchesExcerpt ? 2 : 0)
        items.push({
          kind: 'post',
          id: `post-${post.id}`,
          title: post.title,
          subtitle: post.excerpt.slice(0, 90),
          meta: [post.category, post.authorName || '匿名作者', `${post.readTime}min`].filter(Boolean).join(' · '),
          category: post.category,
          postId: post.id,
          score,
        })
      }

      post.tags.forEach(tag => {
        if (tag.toLowerCase().includes(q)) {
          items.push({
            kind: 'tag',
            id: `tag-${post.id}-${tag}`,
            title: tag,
            subtitle: post.title,
            meta: `来自文章 · ${post.category}`,
            category: post.category,
            postId: post.id,
            score: 5,
          })
        }
      })

      if ((post.authorName || '').toLowerCase().includes(q)) {
        items.push({
          kind: 'author',
          id: `author-${post.authorId || post.authorName}`,
          title: post.authorName || '匿名作者',
          subtitle: post.title,
          meta: `${post.category} · ${post.date}`,
          category: post.category,
          postId: post.id,
          score: 7,
        })
      }
    })

    comments.forEach(comment => {
      const commentText = comment.content.toLowerCase()
      const author = comment.author.toLowerCase()
      if (commentText.includes(q) || author.includes(q)) {
        const post = posts.find(p => p.id === comment.post_id)
        items.push({
          kind: 'comment',
          id: `comment-${comment.id}`,
          title: comment.author,
          subtitle: comment.content.slice(0, 90),
          meta: post ? `${post.title} · 评论` : '评论',
          category: post?.category,
          postId: comment.post_id,
          score: commentText.includes(q) ? 6 : 4,
        })
      }
    })

    return items.sort((a, b) => b.score - a.score).slice(0, 12)
  }, [query, posts])

  const groupedResults = useMemo(() => {
    const map = new Map<SearchKind, SearchItem[]>()
    searchItems.forEach(item => {
      if (!map.has(item.kind)) map.set(item.kind, [])
      map.get(item.kind)!.push(item)
    })
    return map
  }, [searchItems])

  const totalItems = searchItems.length

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, totalItems - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && searchItems[selectedIndex]) {
        const item = searchItems[selectedIndex]
        saveSearchHistory(query)
        if (item.postId) navigate(`/post/${item.postId}`)
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, searchItems, selectedIndex, totalItems, navigate, onClose, query])

  if (!isOpen) return null

  const handleSelect = (item: SearchItem) => {
    if (query.trim()) saveSearchHistory(query)
    if (item.postId) navigate(`/post/${item.postId}`)
    onClose()
  }

  const handleTagClick = (term: string) => {
    setQuery(term)
    saveSearchHistory(term)
  }

  const handleHistoryClick = (term: string) => {
    setQuery(term)
    inputRef.current?.focus()
  }

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation()
    clearSearchHistory()
    setHistory([])
  }

  const highlightText = (text: string, q: string) => {
    if (!q.trim()) return text
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map(part =>
      part.toLowerCase() === q.toLowerCase()
        ? `<mark style="color:var(--accent-cyan);background:transparent;font-weight:600">${part}</mark>`
        : part
    ).join('')
  }

  const hotTags = ['GPT-5', 'LoRA', 'RAG', '微调', 'vLLM']

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: 'max(15vh, 100px)',
      padding: '0 20px',
    }}>
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          animation: 'searchFadeIn 0.2s ease',
        }}
      />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '640px',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-lg), 0 0 1px var(--accent-blue)',
        overflow: 'hidden',
        animation: 'searchSlideIn 0.25s ease',
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          gap: '12px',
          flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索文章标题、内容、标签..."
            style={{
              flex: 1,
              fontSize: '1rem',
              color: 'var(--text-primary)',
              background: 'transparent',
              fontFamily: 'var(--font-sans)',
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            >
              清除
            </button>
          )}
          <kbd style={{
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
          }}>
            ESC
          </kbd>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {query.trim() && searchItems.length > 0 && (
            <div style={{ padding: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  找到 {searchItems.length} 条结果
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(['post', 'author', 'tag', 'comment'] as SearchKind[]).map(kind => (
                    <span key={kind} style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {({ post: '文章', author: '作者', tag: '标签', comment: '评论' } as Record<SearchKind, string>)[kind]}·{groupedResults.get(kind)?.length || 0}
                    </span>
                  ))}
                </div>
              </div>
              {searchItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: selectedIndex === index ? 'var(--bg-hover)' : 'transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${['var(--accent-blue)', 'var(--accent-purple)', 'var(--accent-cyan)', 'var(--accent-pink)'][index % 4]}, transparent)`,
                    opacity: 0.18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={['var(--accent-blue)', 'var(--accent-purple)', 'var(--accent-cyan)', 'var(--accent-pink)'][index % 4]} strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {({ post: '文章', author: '作者', tag: '标签', comment: '评论' } as Record<SearchKind, string>)[item.kind]}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }} dangerouslySetInnerHTML={{ __html: highlightText(item.title, query) }} />
                    <div style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.5,
                    }} dangerouslySetInnerHTML={{ __html: highlightText(item.subtitle, query) }} />
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      {item.meta}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '6px',
                    flexShrink: 0,
                  }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '0.65rem',
                      fontWeight: 500,
                      color: 'var(--accent-cyan)',
                      background: 'var(--accent-cyan-bg)',
                    }}>
                      {({ post: '文章', author: '作者', tag: '标签', comment: '评论' } as Record<SearchKind, string>)[item.kind]}
                    </span>
                    {item.category && (
                      <span style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {query.trim() && searchItems.length === 0 && (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                没有找到相关结果
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                尝试搜索文章标题、作者、标签或评论内容
              </div>
            </div>
          )}

          {!query.trim() && (
            <div style={{ padding: '16px' }}>
              {history.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}>
                      搜索历史
                    </span>
                    <button
                      onClick={handleClearHistory}
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-pink)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      清除
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {history.map(term => (
                      <button
                        key={term}
                        onClick={() => handleHistoryClick(term)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'var(--accent-blue-bg)'
                          e.currentTarget.style.borderColor = 'var(--accent-blue)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'var(--bg-tertiary)'
                          e.currentTarget.style.borderColor = 'var(--border-color)'
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>
                  热门搜索
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {hotTags.map(term => (
                    <button
                      key={term}
                      onClick={() => handleTagClick(term)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        color: 'var(--accent-cyan)',
                        background: 'var(--accent-cyan-bg)',
                        border: '1px solid var(--accent-cyan-border)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--accent-cyan-bg-hover)'
                        e.currentTarget.style.borderColor = 'var(--accent-cyan)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--accent-cyan-bg)'
                        e.currentTarget.style.borderColor = 'var(--accent-cyan-border)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-tertiary)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <kbd style={footerKbdStyle}>↑</kbd>
              <kbd style={footerKbdStyle}>↓</kbd>
              <span>导航</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <kbd style={footerKbdStyle}>↵</kbd>
              <span>打开</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <kbd style={footerKbdStyle}>esc</kbd>
              <span>关闭</span>
            </div>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.7 }}>
            Powered by TechFlow
          </div>
        </div>
      </div>

      <style>{`
        @keyframes searchFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes searchSlideIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

const footerKbdStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '20px',
  height: '20px',
  padding: '0 5px',
  borderRadius: '4px',
  fontSize: '0.65rem',
  fontFamily: 'var(--font-mono)',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
}
