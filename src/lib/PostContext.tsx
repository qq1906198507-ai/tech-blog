import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react'
import type { Post, Draft } from '../types'

const POSTS_STORAGE_KEY = 'techflow_posts'
const DRAFTS_STORAGE_KEY = 'techflow_drafts'

interface PostContextType {
  posts: Post[]
  addPost: (post: Post) => void
  deletePost: (id: string) => void
  updatePost: (id: string, updates: Partial<Post>) => void
  togglePin: (id: string) => void
  incrementViewCount: (id: string) => void
  drafts: Draft[]
  addDraft: (draft: Omit<Draft, 'id' | 'updatedAt'>) => string
  updateDraft: (id: string, updates: Partial<Draft>) => void
  deleteDraft: (id: string) => void
}

const PostContext = createContext<PostContextType | null>(null)

function loadPosts(): Post[] {
  try {
    const saved = localStorage.getItem(POSTS_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (e) {
    console.error('Failed to load posts from localStorage:', e)
  }
  return []
}

function loadDrafts(): Draft[] {
  try {
    const saved = localStorage.getItem(DRAFTS_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function PostProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(loadPosts)
  const [drafts, setDrafts] = useState<Draft[]>(loadDrafts)

  useEffect(() => {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts))
  }, [posts])

  useEffect(() => {
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts))
  }, [drafts])

  const addPost = useCallback((post: Post) => {
    setPosts(prev => [post, ...prev])
  }, [])

  const deletePost = useCallback((id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
  }, [])

  const updatePost = useCallback((id: string, updates: Partial<Post>) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }, [])

  const togglePin = useCallback((id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p))
  }, [])

  const incrementViewCount = useCallback((id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, viewCount: (p.viewCount || 0) + 1 } : p))
  }, [])

  const addDraft = useCallback((draft: Omit<Draft, 'id' | 'updatedAt'>) => {
    const id = `draft_${Date.now()}`
    const newDraft: Draft = { ...draft, id, updatedAt: new Date().toISOString() }
    setDrafts(prev => [newDraft, ...prev])
    return id
  }, [])

  const updateDraft = useCallback((id: string, updates: Partial<Draft>) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d))
  }, [])

  const deleteDraft = useCallback((id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id))
  }, [])

  const value = useMemo(() => ({ posts, addPost, deletePost, updatePost, togglePin, incrementViewCount, drafts, addDraft, updateDraft, deleteDraft }), [posts, addPost, deletePost, updatePost, togglePin, incrementViewCount, drafts, addDraft, updateDraft, deleteDraft])

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  )
}

export function usePosts() {
  const context = useContext(PostContext)
  if (!context) throw new Error('usePosts must be used within PostProvider')
  return context
}
