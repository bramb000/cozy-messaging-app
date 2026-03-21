'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import CharacterCustomizer from '@/components/CharacterCustomizer/CharacterCustomizer'
import styles from './OnboardingPage.module.css'
import PixelPanel from '@/components/ui/PixelPanel'
import { Stack } from '@/components/ui/Layout/Stack'
import { Text } from '@/components/ui/Typography/Text'

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
        <Stack align="center" gap="space-3" mb="space-4">
          <span className={styles.icon}>🌱</span>
          <Text variant="h1">Create Your Character</Text>
          <Text variant="subtitle" align="center" color="on-dark-muted">Set up your profile before entering the world</Text>
        </Stack>

        <CharacterCustomizer 
          initialData={profile} 
          onComplete={() => router.push('/chat')} 
          buttonText="Enter the World →"
        />
      </PixelPanel>
    </div>
  )
}
