import { useEffect } from 'react'

interface SeoOptions {
  title?: string
  description?: string
  url?: string
  image?: string
}

export function useSeo({ title, description, url, image }: SeoOptions) {
  useEffect(() => {
    const siteName = 'TechFlow'
    const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - 探索技术的边界`

    document.title = fullTitle

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
      if (!el) {
        el = document.createElement('meta')
        el.name = name
        document.head.appendChild(el)
      }
      el.content = content
    }

    const setProperty = (prop: string, content: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', prop)
        document.head.appendChild(el)
      }
      el.content = content
    }

    if (description) {
      setMeta('description', description)
      setProperty('og:description', description)
      setProperty('twitter:description', description)
    }

    setProperty('og:title', fullTitle)
    setProperty('og:type', 'website')
    setProperty('og:site_name', siteName)
    setProperty('twitter:card', 'summary_large_image')
    setProperty('twitter:title', fullTitle)

    if (url) {
      setProperty('og:url', url)
    }
    if (image) {
      setProperty('og:image', image)
      setProperty('twitter:image', image)
    }

    return () => {
      document.title = `${siteName} - 探索技术的边界`
    }
  }, [title, description, url, image])
}
