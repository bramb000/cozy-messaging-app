'use client'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './UserPanel.module.css'

export default function UserPanel() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  if (!profile) return null

  return (
    <div className={styles.panel}>
      <Link href="/profile" className={styles.user}>
        <div className="avatar avatar-sm">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.username} />
            : <span>🌱</span>}
        </div>
        <span className={styles.username}>{profile.username}</span>
      </Link>
      <button className="btn btn-ghost btn-icon" onClick={handleSignOut} title="Sign out" id="sign-out-btn">
        🚪
      </button>
    </div>
  )
}
