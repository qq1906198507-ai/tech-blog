import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 检查是否配置了 Supabase
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'))

// 创建 Supabase 客户端
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Demo 模式下的本地存储
const demoStorage = {
  get(key: string): string | null {
    return localStorage.getItem(key)
  },
  set(key: string, value: string) {
    localStorage.setItem(key, value)
  },
  remove(key: string) {
    localStorage.removeItem(key)
  }
}

// 导出给其他组件使用
export { demoStorage }
