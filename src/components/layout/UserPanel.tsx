'use client'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PixelButton from '@/components/ui/PixelButton'
import { Stack } from '@/components/ui/Layout/Stack'
import { Box } from '@/components/ui/Layout/Box'
import { Text } from '@/components/ui/Typography/Text'

export default function UserPanel() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  if (!profile) return null

  return (
    <Stack direction="row" align="center" justify="space-between" p="space-2" mt="space-2" style={{ border: '2px solid var(--moss-dark)', background: 'rgba(0,0,0,0.2)' }}>
      <Link href="/profile" style={{ textDecoration: 'none', flex: 1, minWidth: 0, display: 'flex' }}>
        <Stack direction="row" align="center" gap="space-2">
          <div className="avatar avatar-sm">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.username} />
              : <span>🌱</span>}
          </div>
          <Text variant="body" color="cream" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {profile.username}
          </Text>
        </Stack>
      </Link>
      <PixelButton variant="ghost" className="btn-icon" onClick={handleSignOut} title="Sign out" id="sign-out-btn">
        🚪
      </PixelButton>
    </Stack>
  )
}
