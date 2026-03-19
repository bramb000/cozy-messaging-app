'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  async function handleGoogleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(error.message)
      else setMagicSent(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  if (magicSent) {
    return (
      <div className={`${styles.container} sky-scene`}>
        <div className="cloud"  style={{ animationDelay: '0s' }} />
        <div className="cloud-b" style={{ animationDelay: '-10s' }} />
        <div className="cloud-c" style={{ animationDelay: '-5s' }} />
        <div className="sky-grass" />
        <div className={`pixel-panel ${styles.card}`}>
          <div className={styles.icon}>📬</div>
          <h1 className={styles.title}>Check your email!</h1>
          <p className={styles.subtitle}>We sent a confirmation link to<br /><strong>{email}</strong></p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.container} sky-scene`}>
      {/* Sky clouds — three layers at different speeds */}
      <div className="cloud"  style={{ animationDelay: '0s' }} />
      <div className="cloud"  style={{ animationDelay: '-30s', top: '8%' }} />
      <div className="cloud-b" style={{ animationDelay: '-10s' }} />
      <div className="cloud-b" style={{ animationDelay: '-55s', top: '32%' }} />
      <div className="cloud-c" style={{ animationDelay: '-5s' }} />
      <div className="cloud-c" style={{ animationDelay: '-28s', top: '22%' }} />
      {/* Grass ground strip */}
      <div className="sky-grass" />

      <div className={`pixel-panel ${styles.card}`}>
        <div className={styles.header}>
          <div className={styles.icon}>🌾</div>
          <h1 className={styles.title}>Cozy Corner</h1>
          <p className={styles.subtitle}>A pixel world for friends</p>
        </div>

        {/* Google Sign In */}
        <button
          id="google-sign-in-btn"
          className={`btn btn-secondary btn-full ${styles.oauthBtn}`}
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <img src="https://www.google.com/favicon.ico" alt="" width={14} height={14} />
          Sign in with Google
        </button>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        {/* Email / Password */}
        <form onSubmit={handleEmailSubmit} className={styles.form}>
          <div className="form-group">
            <label className="input-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className={styles.error}>⚠ {error}</p>}

          <button
            id="email-submit-btn"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? '...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          className={`btn btn-ghost btn-full ${styles.toggleBtn}`}
          onClick={() => { setIsSignUp(!isSignUp); setError('') }}
        >
          {isSignUp ? 'Already have an account? Sign in' : 'New here? Create account'}
        </button>
      </div>
    </div>
  )
}
