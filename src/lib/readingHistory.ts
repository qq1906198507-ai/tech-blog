const READING_HISTORY_KEY = 'techflow_reading_history'
const MAX_HISTORY = 30

export interface ReadingHistoryEntry {
  postId: string
  visitedAt: number
}

export function getReadingHistory(): ReadingHistoryEntry[] {
  try {
    const saved = localStorage.getItem(READING_HISTORY_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // ignore
  }
  return []
}

export function recordVisit(postId: string) {
  if (!postId) return
  const history = getReadingHistory().filter(h => h.postId !== postId)
  history.unshift({ postId, visitedAt: Date.now() })
  localStorage.setItem(READING_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
}

export function clearReadingHistory() {
  localStorage.removeItem(READING_HISTORY_KEY)
}
