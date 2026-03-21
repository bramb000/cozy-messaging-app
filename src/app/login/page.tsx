'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './LoginPage.module.css'
import PixelPanel from '@/components/ui/PixelPanel'
import PixelButton from '@/components/ui/PixelButton'
import { Stack } from '@/components/ui/Layout/Stack'
import { Box } from '@/components/ui/Layout/Box'
import { Text } from '@/components/ui/Typography/Text'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  async function handleGoogleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setErrorMsg(error.message)
    setLoading(false)
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setErrorMsg(error.message)
      else setMagicSent(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErrorMsg(error.message)
    }
    setLoading(false)
  }

  if (magicSent) {
    return (
      <div className={`${styles.container} sky-scene`}>
        <div className="cloud"  style={{ animationDelay: '0s' }} />
        <div className="cloud-b" style={{ animationDelay: '-12s', top: '20%' }} />
        <div className="cloud"  style={{ animationDelay: '-25s', top: '15%' }} />
        <div className="cloud-c" style={{ animationDelay: '-40s', top: '8%' }} />
        <div className="sky-grass" />
        <div className="sky-grass" />
        <PixelPanel variant="wood-h">
          <Box p="space-8">
            <Stack align="center" gap="space-3" mb="space-4">
              <div className={styles.icon}>✉️</div>
              <Text variant="h1">Check Email</Text>
            </Stack>
            <Text variant="subtitle" align="center">We sent a magic link to {email}. Check your inbox!</Text>
          </Box>
        </PixelPanel>
      </div>
    )
  }

  return (
    <div className={`${styles.container} sky-scene`}>
      {/* Sky clouds — three layers at different speeds */}
      <div className="cloud"  style={{ animationDelay: '0s' }} />
      <div className="cloud-b" style={{ animationDelay: '-12s', top: '20%' }} />
      <div className="cloud"  style={{ animationDelay: '-25s', top: '15%' }} />
      <div className="cloud-c" style={{ animationDelay: '-40s', top: '8%' }} />
      <div className="cloud"  style={{ animationDelay: '-55s', top: '3%' }} />
      <div className="cloud-b" style={{ animationDelay: '-70s', top: '25%' }} />
      
      {/* Landscape layer */}
      <div className="sky-grass" />

      <PixelPanel variant="wood-h" style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 5 }}>
        <Stack direction="column" gap="space-4" p="space-8">
          <Stack align="center" gap="space-3">
            <div className={styles.icon}>🌾</div>
            <Text variant="h1">Cozy Corner</Text>
            <Text variant="subtitle" align="center" color="on-dark-muted">A pixel world for friends</Text>
          </Stack>

          {/* Google Sign In */}
          <PixelButton
            id="google-sign-in-btn"
            variant="secondary"
            fullWidth
            onClick={handleGoogleLogin}
            disabled={loading}
            iconLeft={<img src="https://www.google.com/favicon.ico" alt="" width={14} height={14} />}
          >
            Sign in with Google
          </PixelButton>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          {/* Email / Password */}
          {/* @ts-ignore - stack as form is valid but types limit it */}
          <Stack as="form" direction="column" gap="space-4" onSubmit={handleEmailAuth}>
            <Stack direction="column" gap="space-1">
              <Text variant="label" as="label" htmlFor="email">Email</Text>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </Stack>
            <Stack direction="column" gap="space-1">
              <Text variant="label" as="label" htmlFor="password">Password</Text>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </Stack>

            {errorMsg && (
              <Box p="space-2" px="space-3" mb="space-3" style={{ border: '2px solid #e74c3c', background: 'rgba(231,76,60,0.1)' }}>
                <Text variant="body" color="red">{errorMsg}</Text>
              </Box>
            )}

            <PixelButton
              id="email-submit-btn"
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? '...' : isSignUp ? 'Create Account' : 'Sign In'}
            </PixelButton>
          </Stack>

          <Box mt="space-1">
            <PixelButton
              variant="ghost"
              fullWidth
              onClick={() => { setIsSignUp(!isSignUp); setErrorMsg('') }}
              style={{ fontSize: '0.45rem' }}
            >
              {isSignUp ? 'Already have an account? Sign in' : 'New here? Create account'}
            </PixelButton>
          </Box>
        </Stack>
      </PixelPanel>
    </div>
  )
}
