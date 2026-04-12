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

/**
 * Fire-and-forget: create a hidden Image for every URL so the browser fetches
 * them all in parallel via HTTP/2 and stores them in its memory cache.
 * CSS background-image is lazy — it only fetches on first render.
 * Preloading means every customiser option change is a cache hit (instant).
 */
function preloadAll(map: UrlMap) {
  Object.values(map).forEach(url => {
    const img = new Image()
    img.src = url
  })
}

export function SpriteUrlProvider({ children }: { children: ReactNode }) {
  const [urlMap, setUrlMap] = useState<UrlMap>({})

  useEffect(() => {
    // Try sessionStorage first
    try {
      const cached   = sessionStorage.getItem(SESSION_KEY)
      const cachedAt = sessionStorage.getItem(SESSION_TS_KEY)
      if (cached && cachedAt && Date.now() - parseInt(cachedAt) < MAX_AGE_MS) {
        const map = JSON.parse(cached) as UrlMap
        setUrlMap(map)
        preloadAll(map) // warm browser cache even on the cache-hit path
        return
      }
    } catch {
      // sessionStorage unavailable — fall through to fetch
    }

    // Fetch from server: one call returns ~130 signed CDN URLs as JSON
    fetch('/api/sprite-urls')
      .then(r => {
        if (!r.ok) throw new Error(`sprite-urls: ${r.status}`)
        return r.json() as Promise<UrlMap>
      })
      .then(map => {
        setUrlMap(map)
        preloadAll(map) // immediately start downloading all sprites in background
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(map))
          sessionStorage.setItem(SESSION_TS_KEY, Date.now().toString())
        } catch { /* ignore */ }
      })
      .catch(() => {
        // Context stays empty — CharacterSprite falls back to proxy URLs silently
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
