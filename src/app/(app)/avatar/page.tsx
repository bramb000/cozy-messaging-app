'use client'
import { useAuth } from '@/context/AuthContext'
import CharacterCustomizer from '@/components/CharacterCustomizer/CharacterCustomizer'
import styles from './AvatarPage.module.css'

export default function AvatarPage() {
  const { profile } = useAuth()

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>🎨 Customize Avatar</h2>
        <p className={styles.subtitle}>Change your look anytime! Changes appear instantly in the world.</p>
      </header>

      <div className={`pixel-panel ${styles.card}`}>
        <CharacterCustomizer 
          initialData={profile} 
          buttonText="Save Changes"
        />
      </div>
    </div>
  )
}
