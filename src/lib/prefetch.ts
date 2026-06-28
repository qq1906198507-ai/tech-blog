// 配合 React.lazy 路由做模块预取：鼠标 hover / idle 时拉取对应 chunk
// 模块被 Vite 打包成独立 chunk，重复 import 会命中浏览器缓存，秒级加载

// 缓存已预取的路径，避免重复触发
const prefetched = new Set<string>()

// 路径 → 动态 import 工厂的映射
// 这里的 import() 会被 Vite 静态分析，生成对应 chunk
const loaders: Record<string, () => Promise<unknown>> = {
  '/': () => import('../pages/Home'),
  '/post': () => import('../pages/PostDetail'),
  '/archive': () => import('../pages/Archive'),
  '/tags': () => import('../pages/Tags'),
  '/about': () => import('../pages/About'),
  '/dashboard': () => import('../pages/MyPosts'),
  '/admin': () => import('../pages/AdminPanel'),
  '/profile': () => import('../pages/Profile'),
}

/**
 * 预取某个路由对应的模块 chunk
 * @param path 完整路径或路径前缀（如 '/post' 会匹配 '/post/:id'）
 */
export function prefetchPage(path: string): void {
  // 精确匹配，否则尝试前缀匹配
  const key = loaders[path] ? path : Object.keys(loaders).find(k => path.startsWith(k) && k !== '/')

  if (!key || prefetched.has(key)) return
  prefetched.add(key)

  // 触发 import，让浏览器并行下载该 chunk
  // 不 await：预取不需要等结果，加载到缓存即可
  loaders[key]().catch(() => {
    // 失败则移除标记，允许下次重试
    prefetched.delete(key)
  })
}

/**
 * 在浏览器空闲时段预取一批常用页面
 * 用于首次加载完成后预热
 */
export function prefetchOnIdle(paths: string[] = ['/archive', '/tags']): void {
  const run = () => paths.forEach(p => prefetchPage(p))

  if ('requestIdleCallback' in window) {
    ;(window as any).requestIdleCallback(run, { timeout: 3000 })
  } else {
    setTimeout(run, 2000)
  }
}
