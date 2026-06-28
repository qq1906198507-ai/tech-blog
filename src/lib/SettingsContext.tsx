import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

const SETTINGS_STORAGE_KEY = 'techflow_settings'

export interface Settings {
  blogName: string
  blogDesc: string
  postsPerPage: number
  allowComments: boolean
  requireApproval: boolean
  siteUrl: string
  siteKeywords: string
  authorName: string
  authorBio: string
  authorAvatar: string
  githubUrl: string
  twitterUrl: string
  email: string
  footerText: string
  icp: string
  analyticsCode: string
  enableRegistration: boolean
  enableSearch: boolean
  enableNightMode: boolean
}

const defaultSettings: Settings = {
  blogName: 'TechFlow',
  blogDesc: '探索 AI 技术前沿',
  postsPerPage: 10,
  allowComments: true,
  requireApproval: false,
  siteUrl: '',
  siteKeywords: '',
  authorName: '',
  authorBio: '',
  authorAvatar: '',
  githubUrl: '',
  twitterUrl: '',
  email: '',
  footerText: '',
  icp: '',
  analyticsCode: '',
  enableRegistration: true,
  enableSearch: true,
  enableNightMode: true,
}

function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object') return { ...defaultSettings, ...parsed }
    }
  } catch {
    // ignore
  }
  return defaultSettings
}

const SettingsContext = createContext<Settings>(defaultSettings)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    const handler = () => {
      setSettings(loadSettings())
    }
    window.addEventListener('storage', handler)
    const interval = setInterval(handler, 1000)
    return () => {
      window.removeEventListener('storage', handler)
      clearInterval(interval)
    }
  }, [])

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
