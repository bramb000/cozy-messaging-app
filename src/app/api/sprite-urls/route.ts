/**
 * GET /api/sprite-urls
 *
 * Returns a map of { [proxyUrl]: signedCdnUrl } for every sprite in the game.
 * Client stores this in sessionStorage and uses the CDN URLs directly,
 * bypassing the proxy on every subsequent request.
 *
 * Signed URLs expire after 2 hours. The client re-fetches when sessionStorage
 * entry is older than 100 minutes.
 */
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getAllSpritePaths } from '@/lib/sprites'

const BUCKET = 'sprites'
const SIGNED_URL_TTL = 7200 // 2 hours in seconds

export async function GET() {
  // 1. Verify user is authenticated
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 2. Build list of all storage paths (strip proxy prefix)
  const proxyUrls = getAllSpritePaths()
  // proxyUrl = /api/sprites/Player/Head/Hair_1/Hair_1_Black.png
  // storagePath = Player/Head/Hair_1/Hair_1_Black.png
  const storagePaths = proxyUrls.map(u => u.replace(/^\/api\/sprites\//, ''))

  // 3. Batch-sign all URLs in one Supabase API call
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data, error } = await adminClient.storage
    .from(BUCKET)
    .createSignedUrls(storagePaths, SIGNED_URL_TTL)

  if (error || !data) {
    return new NextResponse('Failed to generate signed URLs', { status: 500 })
  }

  // 4. Build proxyUrl → signedUrl map
  const urlMap: Record<string, string> = {}
  data.forEach((item, i) => {
    if (item.signedUrl) {
      urlMap[proxyUrls[i]] = item.signedUrl
    }
  })

  return NextResponse.json(urlMap, {
    headers: {
      // Private cache for ~100 min (less than the 2h signed URL TTL)
      'Cache-Control': 'private, max-age=6000',
    },
  })
}
