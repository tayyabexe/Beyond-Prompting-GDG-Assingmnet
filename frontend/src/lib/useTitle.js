import { useEffect } from 'react'

// Each page gets its own browser-tab title (helps users with many tabs, screen readers and SEO).
export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · NEXUS` : 'NEXUS — Tech & Workspace Store'
  }, [title])
}
