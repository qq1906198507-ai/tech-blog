import { useState, useEffect } from 'react'
import { usePosts } from '../lib/PostContext'
import type { UserInfo } from './AuthModal'
import type { Post, Draft } from '../types'

interface WritePostModalProps {
  isOpen: boolean
  onClose: () => void
  user?: UserInfo | null
  editPost?: Post | null
  editDraft?: Draft | null
}

export default function WritePostModal({ isOpen, onClose, user, editPost, editDraft }: WritePostModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('应用实践')
  const [tags, setTags] = useState('')
  const [cover, setCover] = useState('')
  const [content, setContent] = useState('')
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)
  const { addPost, updatePost, addDraft, updateDraft } = usePosts()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      if (editPost) {
        setTitle(editPost.title)
        setCategory(editPost.category)
        setTags(editPost.tags.join(', '))
        setCover(editPost.cover || '')
        setContent(editPost.content)
      } else if (editDraft) {
        setTitle(editDraft.title)
        setCategory(editDraft.category)
        setTags(editDraft.tags)
        setCover(editDraft.cover || '')
        setContent(editDraft.content)
      } else {
        setTitle('')
        setContent('')
        setTags('')
        setCover('')
        setCategory('应用实践')
      }
      setPreview(false)
      setSaved(false)
      setSaving(false)
      setAutoSaved(false)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen, editPost, editDraft])

  useEffect(() => {
    if (!isOpen) return
    const timer = window.setTimeout(() => {
      if (!title.trim() && !content.trim() && !cover.trim() && !tags.trim()) return
      const payload = {
        title,
        category,
        tags,
        content,
        cover,
        authorId: user?.id || 'anonymous',
      }
      if (editDraft) {
        updateDraft(editDraft.id, payload)
      } else if (!editPost) {
        const draftId = localStorage.getItem('techflow_autosave_draft_id')
        if (draftId) {
          updateDraft(draftId, payload)
        } else {
          const id = addDraft(payload)
          localStorage.setItem('techflow_autosave_draft_id', id)
        }
      }
      setAutoSaved(true)
      window.setTimeout(() => setAutoSaved(false), 1200)
    }, 800)
    return () => window.clearTimeout(timer)
  }, [title, category, tags, content, cover, isOpen, editDraft, editPost, user, addDraft, updateDraft])

  if (!isOpen) return null

  const handleSaveDraft = () => {
    if (!title.trim() && !content.trim()) return

    if (editDraft) {
      updateDraft(editDraft.id, { title, category, tags, content, cover })
    } else {
      addDraft({ title, category, tags, content, cover, authorId: user?.id || 'anonymous' })
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1000)
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)

    if (editPost) {
      updatePost(editPost.id, {
        title: title.trim(),
        excerpt: content.trim().slice(0, 150) + (content.trim().length > 150 ? '...' : ''),
        content: content.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        category,
        cover: cover.trim() || undefined,
        readTime: Math.max(1, Math.ceil(content.trim().length / 500)),
      })
    } else {
      const newPost: Post = {
        id: `post_${Date.now()}`,
        title: title.trim(),
        excerpt: content.trim().slice(0, 150) + (content.trim().length > 150 ? '...' : ''),
        content: content.trim(),
        date: new Date().toISOString().split('T')[0],
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        category,
        readTime: Math.max(1, Math.ceil(content.trim().length / 500)),
        authorId: user?.id || 'anonymous',
        authorName: user?.name || '匿名用户',
        authorAvatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous`,
      }
      addPost(newPost)
    }

    if (editDraft) {
      updateDraft(editDraft.id, { title: '', content: '', category: '', tags: '' })
    }

    await new Promise(r => setTimeout(r, 500))
    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setTitle('')
      setContent('')
      setTags('')
      onClose()
    }, 1500)
  }

  const renderMarkdown = (md: string) => {
    return md
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[hlu])((?!<).+)$/gm, '<p>$1</p>')
      .replace(/<\/p><p>/g, '\n\n')
      .replace(/<p><\/p>/g, '')
  }

  const categories = ['模型架构', '模型训练', '应用实践', '部署运维', '行业动态']

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
        maxWidth: '900px',
        maxHeight: '90vh',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
              boxShadow: 'var(--glow-blue)',
            }} />
            <h2 style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              {editPost ? '编辑文章' : editDraft ? '编辑草稿' : '发表文章'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPreview(!preview)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: preview ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                background: preview ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                border: `1px solid ${preview ? 'rgba(0, 212, 255, 0.3)' : 'var(--border-color)'}`,
                transition: 'all var(--transition-fast)',
              }}
            >
              {preview ? '编辑' : '预览'}
            </button>
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--accent-pink)'
                e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div style={{
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderBottom: '1px solid var(--border-color)',
        }}>
          {cover.trim() && (
            <div style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-tertiary)',
            }}>
              <img
                src={cover}
                alt="cover preview"
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}

          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="输入文章标题..."
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              padding: '8px 0',
              borderBottom: '1px solid var(--border-color)',
            }}
          />

          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                minWidth: '120px',
              }}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <input
              type="text"
              value={cover}
              onChange={e => setCover(e.target.value)}
              placeholder="封面图片地址（可选）"
              style={{
                flex: 1,
                minWidth: '240px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
              }}
            />

            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="标签（逗号分隔）"
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
              }}
            />
          </div>
        </div>

        <div style={{
          flex: 1,
          overflow: 'auto',
          minHeight: '300px',
        }}>
          {preview ? (
            <div
              className="preview-content"
              style={{
                padding: '24px',
                fontSize: '0.95rem',
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
              }}
            >
              {!title && !content && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 0',
                  color: 'var(--text-muted)',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.5 }}>◇</div>
                  <div>开始写作后可预览效果</div>
                </div>
              )}
              {title && (
                <h1 style={{
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '24px',
                }}>
                  {title}
                </h1>
              )}
              <div
                className="post-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={`使用 Markdown 格式写作...\n\n## 二级标题\n\n正文内容...\n\n- 列表项 1\n- 列表项 2\n\n\`\`\`python\nprint("Hello, World!")\n\`\`\``}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '300px',
                padding: '24px',
                fontSize: '0.9rem',
                lineHeight: 1.8,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                resize: 'none',
                background: 'transparent',
              }}
            />
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <span>支持 Markdown 语法</span>
            <span>{content.length} 字符</span>
            {autoSaved && <span style={{ color: 'var(--accent-cyan)' }}>已自动保存草稿</span>}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--text-muted)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              取消
            </button>

            <button
              onClick={handleSaveDraft}
              disabled={saving}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-amber)'
                e.currentTarget.style.color = 'var(--accent-amber)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              存为草稿
            </button>

            <button
              onClick={handleSave}
              disabled={!title.trim() || !content.trim() || saving}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: '#fff',
                background: saved
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                opacity: (!title.trim() || !content.trim()) ? 0.5 : 1,
                cursor: (!title.trim() || !content.trim()) ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition-fast)',
                boxShadow: 'var(--glow-blue)',
                minWidth: '100px',
              }}
            >
              {saving ? '保存中...' : saved ? '✓ 已保存' : editPost ? '保存修改' : '发布文章'}
            </button>
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
        .preview-content h1 {
          color: var(--text-primary);
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
        }
        .preview-content h2 {
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 32px 0 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-color);
        }
        .preview-content h3 {
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 24px 0 12px;
        }
        .preview-content p {
          margin-bottom: 16px;
        }
        .preview-content strong {
          color: var(--text-primary);
          font-weight: 600;
        }
        .preview-content ul {
          margin: 16px 0;
          padding-left: 24px;
        }
        .preview-content li {
          margin-bottom: 8px;
        }
        .preview-content li::marker {
          color: var(--accent-cyan);
        }
        .preview-content pre {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
          overflow-x: auto;
          margin: 16px 0;
        }
        .preview-content pre code {
          background: none;
          padding: 0;
          font-size: 0.85rem;
          color: var(--accent-cyan);
        }
        .preview-content code {
          font-family: var(--font-mono);
          background: var(--bg-tertiary);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.85em;
          color: var(--accent-cyan);
        }
      `}</style>
    </div>
  )
}
