import { useEffect } from 'react'
import { usePosts } from '../lib/PostContext'
import { useSettings } from '../lib/SettingsContext'

export default function Rss() {
  const { posts } = usePosts()
  const settings = useSettings()

  useEffect(() => {
    const rss = generateRss(posts, settings)
    const blob = new Blob([rss], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)

    // 下载 RSS 文件
    const a = document.createElement('a')
    a.href = url
    a.download = 'rss.xml'
    a.click()
    URL.revokeObjectURL(url)
  }, [posts, settings])

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '80px 20px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '2rem',
        marginBottom: '16px',
      }}>📡</div>
      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '12px',
      }}>
        RSS 订阅
      </h1>
      <p style={{
        fontSize: '0.9rem',
        color: 'var(--text-secondary)',
        marginBottom: '24px',
        lineHeight: 1.6,
      }}>
        文件已自动下载。将 rss.xml 放到网站根目录即可使用。
      </p>
      <div style={{
        padding: '20px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        textAlign: 'left',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        color: 'var(--accent-cyan)',
        maxHeight: '300px',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}>
        {generateRss(posts, settings)}
      </div>
    </div>
  )
}

function generateRss(posts: any[], settings: any): string {
  const siteUrl = settings.siteUrl || window.location.origin
  const now = new Date().toUTCString()

  const items = posts.map(post => `  <item>
    <title><![CDATA[${post.title}]]></title>
    <link>${siteUrl}/post/${post.id}</link>
    <guid isPermaLink="false">${post.id}</guid>
    <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    <description><![CDATA[${post.excerpt}]]></description>
    ${post.tags.map((t: string) => `<category>${t}</category>`).join('\n    ')}
  </item>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${settings.blogName}</title>
    <link>${siteUrl}</link>
    <description>${settings.blogDesc}</description>
    <language>zh-CN</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`
}
