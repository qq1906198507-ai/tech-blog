export interface Post {
  id: string
  title: string
  excerpt: string
  content: string
  date: string
  tags: string[]
  category: string
  readTime: number
  cover?: string
  authorId?: string
  authorName?: string
  authorAvatar?: string
  pinned?: boolean
  viewCount?: number
}

export interface Draft {
  id: string
  title: string
  category: string
  tags: string
  content: string
  cover?: string
  updatedAt: string
  authorId: string
}

export interface Category {
  name: string
  count: number
  icon: string
}
