import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { likeService } from '../services/database'

export function useRealtimeLikes(postId: string, userId: string | null) {
  const [likes, setLikes] = useState(0)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const count = await likeService.getLikeCount(postId)
        if (mounted) setLikes(count)

        if (userId) {
          const isLiked = await likeService.isLiked(postId, userId)
          if (mounted) setLiked(isLiked)
        }
      } catch (error) {
        console.error('Error loading likes:', error)
      }
    }

    load()

    if (!isSupabaseConfigured || !supabase) return () => { mounted = false }

    const channel = supabase
      .channel(`likes:${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes', filter: `post_id=eq.${postId}` },
        async () => {
          if (!mounted) return
          const count = await likeService.getLikeCount(postId)
          if (mounted) setLikes(count)
          if (userId) {
            const isLiked = await likeService.isLiked(postId, userId)
            if (mounted) setLiked(isLiked)
          }
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase?.removeChannel(channel)
    }
  }, [postId, userId])

  return { likes, liked }
}
