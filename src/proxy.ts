import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Run proxy on all paths EXCEPT:
     * - _next/static  (Next.js static chunks)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - /ui/**        (pixel-art game asset files)
     * - Any file with an extension (images, fonts, audio, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|ui/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|mp3|wav)$).*)',
  ],
}
