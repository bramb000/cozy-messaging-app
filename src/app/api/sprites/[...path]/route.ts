import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { readFileSync, existsSync } from 'fs'
import { join, normalize } from 'path'

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
  const filePath = normalize(join(process.cwd(), 'assets', 'sprites', safePath))

  // Extra guard: ensure the resolved path is still inside assets/sprites
  const assetsRoot = normalize(join(process.cwd(), 'assets', 'sprites'))
  if (!filePath.startsWith(assetsRoot)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // 3. Read and return the file
  if (!existsSync(filePath)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  try {
    const file = readFileSync(filePath)
    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        // Private — cached per browser session, NOT by CDN or proxies
        'Cache-Control': 'private, max-age=3600, must-revalidate',
        // Prevent search engine indexing
        'X-Robots-Tag': 'noindex, nofollow',
        // Prevent hotlinking by restricting referer (informational header)
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
