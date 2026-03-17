import { AccessToken } from 'livekit-server-sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const participantName = (profile as any)?.username ?? user.id

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity: user.id, name: participantName }
  )
  at.addGrant({ roomJoin: true, room: 'cozy-corner-voice', canPublish: true, canSubscribe: true })

  const token = await at.toJwt()
  return NextResponse.json({ token, url: process.env.LIVEKIT_URL })
}
