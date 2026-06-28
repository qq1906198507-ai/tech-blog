import { supabase, isSupabaseConfigured, demoStorage } from '../lib/supabase'

// 点赞服务
export const likeService = {
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
    if (!isSupabaseConfigured || !supabase) {
      // Demo 模式
      const liked = demoStorage.get(`like_${postId}_${userId}`) === 'true'
      const countStr = demoStorage.get(`like_count_${postId}`)
      let count = countStr ? parseInt(countStr) : 0

      if (liked) {
        demoStorage.remove(`like_${postId}_${userId}`)
        count = Math.max(0, count - 1)
      } else {
        demoStorage.set(`like_${postId}_${userId}`, 'true')
        count = count + 1
      }
      demoStorage.set(`like_count_${postId}`, String(count))
      return { liked: !liked, count }
    }

    // Supabase 模式
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      await supabase.from('likes').delete().eq('id', existingLike.id)
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: userId })
    }

    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)

    return { liked: !existingLike, count: count || 0 }
  },

  async getLikeCount(postId: string): Promise<number> {
    if (!isSupabaseConfigured || !supabase) {
      const count = demoStorage.get(`like_count_${postId}`)
      return count ? parseInt(count) : 0
    }

    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
    return count || 0
  },

  async isLiked(postId: string, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      return demoStorage.get(`like_${postId}_${userId}`) === 'true'
    }

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()
    return !!data
  }
}

// 评论服务
export type CommentStatus = 'approved' | 'pending'

export interface Comment {
  id: string
  post_id: string
  user_id: string
  author: string
  avatar: string
  content: string
  parent_id: string | null
  created_at: string
  status?: CommentStatus
  postTitle?: string
  replies?: Comment[]
}

function readSettingApproval(): boolean {
  try {
    const saved = localStorage.getItem('techflow_settings')
    if (saved) return JSON.parse(saved)?.requireApproval === true
  } catch {
    // ignore
  }
  return false
}

export const commentService = {
  async addComment(postId: string, userId: string, author: string, avatar: string, content: string, parentId?: string, requireApproval?: boolean): Promise<Comment> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase 未配置，无法创建真实评论')
    }

    const needApproval = requireApproval ?? readSettingApproval()
    const status: CommentStatus = needApproval ? 'pending' : 'approved'

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        author,
        avatar,
        content,
        parent_id: parentId || null,
        status
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getComments(postId: string): Promise<Comment[]> {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const visible = (data || []).filter(c => (c.status || 'approved') === 'approved')
    const rootComments = visible.filter(c => !c.parent_id) || []
    const replies = visible.filter(c => c.parent_id) || []

    return rootComments.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_id === comment.id)
    }))
  },

  async deleteComment(commentId: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith('comments_')) {
          const comments = JSON.parse(localStorage.getItem(key) || '[]')
          const filtered = comments.filter((c: Comment) => c.id !== commentId && c.parent_id !== commentId)
          localStorage.setItem(key, JSON.stringify(filtered))
        }
      }
      return
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId)

    if (error) throw error
  },

  async getAllComments(): Promise<Comment[]> {
    if (!isSupabaseConfigured || !supabase) {
      const all: Comment[] = []
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('comments_')) {
          try {
            const arr: Comment[] = JSON.parse(localStorage.getItem(key) || '[]')
            all.push(...arr)
          } catch {
            // ignore
          }
        }
      }
      return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getPendingComments(): Promise<Comment[]> {
    const all = await this.getAllComments()
    return all.filter(c => c.status === 'pending')
  },

  async setCommentStatus(commentId: string, status: CommentStatus): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('comments_')) {
          try {
            const arr: Comment[] = JSON.parse(localStorage.getItem(key) || '[]')
            let changed = false
            const next = arr.map(c => {
              if (c.id === commentId) { changed = true; return { ...c, status } }
              return c
            })
            if (changed) localStorage.setItem(key, JSON.stringify(next))
          } catch {
            // ignore
          }
        }
      }
      return
    }

    const { error } = await supabase
      .from('comments')
      .update({ status })
      .eq('id', commentId)
    if (error) throw error
  },

  async approveComment(commentId: string): Promise<void> {
    return this.setCommentStatus(commentId, 'approved')
  },

  async rejectComment(commentId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('comments_')) {
          try {
            const arr: Comment[] = JSON.parse(localStorage.getItem(key) || '[]')
            const next = arr.filter(c => c.id !== commentId && c.parent_id !== commentId)
            localStorage.setItem(key, JSON.stringify(next))
          } catch {
            // ignore
          }
        }
      }
      return
    }
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) throw error
  },

  getLocalComments(postId: string): Comment[] {
    const saved = demoStorage.get(`comments_${postId}`)
    if (saved) return JSON.parse(saved)

    const initialComments: Comment[] = postId === '1' ? [
      { id: 'c1', post_id: '1', user_id: 'demo', author: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang', content: '非常深入的分析！GPT-5 的架构确实值得期待。', parent_id: null, created_at: '2026-06-12T00:00:00Z', status: 'approved' },
      { id: 'c2', post_id: '1', user_id: 'demo', author: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li', content: 'MoE 架构是未来的趋势吗？感觉现在还不够成熟。', parent_id: null, created_at: '2026-06-11T00:00:00Z', status: 'approved' },
    ] : postId === '2' ? [
      { id: 'c3', post_id: '2', user_id: 'demo', author: '王五', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang', content: 'GraphRAG 确实解决了传统 RAG 的很多痛点。', parent_id: null, created_at: '2026-06-09T00:00:00Z', status: 'approved' },
    ] : []

    demoStorage.set(`comments_${postId}`, JSON.stringify(initialComments))
    return initialComments
  }
}

// 收藏服务
export const favoriteService = {
  async toggleFavorite(postId: string, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase 未配置，无法切换收藏')
    }

    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id)
      return false
    } else {
      await supabase.from('favorites').insert({ post_id: postId, user_id: userId })
      return true
    }
  },

  async getUserFavorites(userId: string): Promise<string[]> {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    const { data } = await supabase
      .from('favorites')
      .select('post_id')
      .eq('user_id', userId)
    return data?.map(f => f.post_id) || []
  },

  getLocalFavorites(userId: string): string[] {
    const saved = demoStorage.get(`favorites_${userId}`)
    return saved ? JSON.parse(saved) : []
  }
}
