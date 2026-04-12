import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { existsSync, readFileSync } from 'fs'
import { join, normalize } from 'path'

// The Supabase Storage bucket name for sprites
const SPRITES_BUCKET = 'sprites'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params

  // 1. Authenticate — only logged-in users may access sprites
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

  // 2. Sanitize path — prevent directory traversal
  const rawPath = path.join('/')
  const safePath = rawPath.replace(/\.\./g, '').replace(/^\/+/, '')

  const headers = {
    'Content-Type': 'image/png',
    'Cache-Control': 'private, max-age=3600, must-revalidate',
    'X-Robots-Tag': 'noindex, nofollow',
    'X-Content-Type-Options': 'nosniff',
  }

  // ─── Strategy A: Local filesystem (development) ───────────────
  // If the assets/ folder exists locally (not in production), serve from disk.
  const localPath = normalize(join(process.cwd(), 'assets', 'sprites', safePath))
  const assetsRoot = normalize(join(process.cwd(), 'assets', 'sprites'))

  if (localPath.startsWith(assetsRoot) && existsSync(localPath)) {
    try {
      const file = readFileSync(localPath)
      return new NextResponse(file, { status: 200, headers })
    } catch {
      // Fall through to Supabase Storage
    }
  }

  // ─── Strategy B: Supabase Storage (production) ───────────────
  // Files are stored in the 'sprites' private bucket with the same path structure.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return new NextResponse(
      'Sprite storage not configured. Add SUPABASE_SERVICE_ROLE_KEY to your environment variables.',
      { status: 503 }
    )
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } }
  )

  const { data, error } = await adminClient.storage
    .from(SPRITES_BUCKET)
    .download(safePath)

  if (error || !data) {
    return new NextResponse('Sprite not found', { status: 404 })
  }

  const buffer = Buffer.from(await data.arrayBuffer())
  return new NextResponse(buffer, { status: 200, headers })
}
