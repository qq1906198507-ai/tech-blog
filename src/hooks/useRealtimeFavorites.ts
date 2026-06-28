import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { favoriteService } from '../services/database'

export function useRealtimeFavorites(postId: string, userId: string | null) {
  const [favorited, setFavorited] = useState(false)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        if (userId) {
          const favs = await favoriteService.getUserFavorites(userId)
          if (mounted) setFavorited(favs.includes(postId))
        } else {
          if (mounted) setFavorited(false)
        }
      } catch (error) {
        console.error('Error loading favorites:', error)
      }
    }

    load()

    if (!isSupabaseConfigured || !supabase || !userId) return () => { mounted = false }

    const channel = supabase
      .channel(`favorites:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'favorites', filter: `user_id=eq.${userId}` },
        async () => {
          if (!mounted) return
          const favs = await favoriteService.getUserFavorites(userId!)
          if (mounted) setFavorited(favs.includes(postId))
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase?.removeChannel(channel)
    }
  }, [postId, userId])

  return { favorited }
}
