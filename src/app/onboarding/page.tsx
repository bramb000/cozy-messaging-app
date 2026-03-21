'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import CharacterCustomizer from '@/components/CharacterCustomizer/CharacterCustomizer'
import styles from './OnboardingPage.module.css'
import PixelPanel from '@/components/ui/PixelPanel'

export default function OnboardingPage() {
  const router = useRouter()
  const { profile } = useAuth()

  return (
    <div className={`${styles.container} sky-scene`}>
      {/* Sky clouds */}
      <div className="cloud"  style={{ animationDelay: '-8s' }} />
      <div className="cloud"  style={{ animationDelay: '-38s', top: '6%' }} />
      <div className="cloud-b" style={{ animationDelay: '-22s' }} />
      <div className="cloud-b" style={{ animationDelay: '-50s', top: '30%' }} />
      <div className="cloud-c" style={{ animationDelay: '-3s' }} />
      <div className="cloud-c" style={{ animationDelay: '-33s', top: '20%' }} />
      <div className="sky-grass" />
      <PixelPanel variant="standard" className={styles.card}>
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
      </PixelPanel>
    </div>
  )
}
