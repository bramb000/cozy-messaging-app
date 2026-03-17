'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import CharacterCustomizer from '@/components/CharacterCustomizer/CharacterCustomizer'
import styles from './OnboardingPage.module.css'

export default function OnboardingPage() {
  const router = useRouter()
  const { profile } = useAuth()

  return (
    <div className={styles.container}>
      <div className={`pixel-panel ${styles.card}`}>
        <div className={styles.header}>
          <span className={styles.icon}>🌱</span>
          <h1>Create Your Character</h1>
          <p className={styles.sub}>Set up your profile before entering the world</p>
        </div>

        <CharacterCustomizer 
          initialData={profile} 
          onComplete={() => router.push('/chat')} 
          buttonText="Enter the World →"
        />
      </div>
    </div>
  )
}
