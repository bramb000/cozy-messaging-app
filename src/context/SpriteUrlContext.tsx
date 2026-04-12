'use client'
/**
 * SpriteUrlContext
 *
 * Fetches batch-signed Supabase Storage URLs on mount (one API call for ~130 sprites).
 * CharacterSprite reads from this context so it can use direct CDN URLs instead of
 * routing every image through the /api/sprites proxy.
 *
 * URLs are cached in sessionStorage for 100 minutes (signed URLs expire after 2h).
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type UrlMap = Record<string, string>

const SESSION_KEY    = 'sprite-url-map'
const SESSION_TS_KEY = 'sprite-url-map-at'
const MAX_AGE_MS     = 100 * 60 * 1000 // 100 minutes

const SpriteUrlContext = createContext<UrlMap>({})

export function SpriteUrlProvider({ children }: { children: ReactNode }) {
  const [urlMap, setUrlMap] = useState<UrlMap>({})

  useEffect(() => {
    // Try sessionStorage first
    try {
      const cached   = sessionStorage.getItem(SESSION_KEY)
      const cachedAt = sessionStorage.getItem(SESSION_TS_KEY)
      if (cached && cachedAt && Date.now() - parseInt(cachedAt) < MAX_AGE_MS) {
        setUrlMap(JSON.parse(cached))
        return
      }
    } catch {
      // sessionStorage unavailable (private browsing etc.) — continue to fetch
    }

    // Fetch from server (one call, ~130 signed URLs returned as JSON)
    fetch('/api/sprite-urls')
      .then(r => {
        if (!r.ok) throw new Error(`sprite-urls failed: ${r.status}`)
        return r.json() as Promise<UrlMap>
      })
      .then(map => {
        setUrlMap(map)
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(map))
          sessionStorage.setItem(SESSION_TS_KEY, Date.now().toString())
        } catch { /* ignore */ }
      })
      .catch(() => {
        // Silently fall back — CharacterSprite will use /api/sprites proxy URLs
      })
  }, [])

  return (
    <SpriteUrlContext.Provider value={urlMap}>
      {children}
    </SpriteUrlContext.Provider>
  )
}

/** Returns the signed CDN URL for a given proxy URL, or the proxy URL as fallback. */
export function useResolvedSpriteUrl(proxyUrl: string): string {
  const map = useContext(SpriteUrlContext)
  return map[proxyUrl] ?? proxyUrl
}

/** Returns the full URL map (for use in components that resolve many URLs). */
export function useSpriteUrlMap(): UrlMap {
  return useContext(SpriteUrlContext)
}
