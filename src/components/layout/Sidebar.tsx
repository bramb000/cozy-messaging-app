'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import OnlineCount from './OnlineCount'
import { CharacterSprite } from '@/components/character/CharacterSprite'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { href: '/chat',    icon: '💬', label: 'Chat'    },
  { href: '/voice',   icon: '🔥', label: 'Bonfire' },
  { href: '/profile', icon: '🪴', label: 'Profile' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className={styles.brand}>
        <span className={styles.brandIcon}>🌾</span>
        <span className="nav-brand-text">Cozy<br/>Corner</span>
      </div>

      {/* Nav items */}
      <nav className="nav-items" aria-label="Main Navigation">
        {NAV_ITEMS.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${pathname.startsWith(href) ? 'active' : ''}`}
          >
            <span className="nav-item-icon">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer: online count + user panel */}
      <div className="nav-footer">
        <OnlineCount />

        {profile && (
          <div className={styles.userPanel}>
            {/* Character sprite preview */}
            <Link href="/profile" className={styles.userAvatar} title="Your Profile">
              <CharacterSprite
                config={(profile as any).character_config ?? {}}
                size="sm"
                animated={false}
              />
            </Link>

            <div className={styles.userInfo}>
              <span className={styles.username}>{profile.username}</span>
            </div>

            <button
              className={`btn-icon ${styles.signOutBtn}`}
              onClick={handleSignOut}
              title="Sign out"
              id="sign-out-btn"
              aria-label="Sign out"
            >
              🚪
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
