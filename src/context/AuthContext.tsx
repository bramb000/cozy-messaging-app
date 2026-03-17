'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const sessionIdRef = useRef<string | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
        return null
      }
      
      setProfile(data as Profile)
      return data
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err)
      setProfile(null)
      return null
    }
  }

  async function startSession(userId: string) {
    // First expire old sessions
    await supabase.rpc('expire_sessions')

    // Check concurrent user count (25 max)
    const { data: count } = await supabase.rpc('active_session_count')
    if (count && count >= 25) {
      // Already signed in users continue — new sessions blocked at session creation
      // (checked at login rather than here to avoid self-blocking on refresh)
    }

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      // @ts-expect-error Supabase types misaligned
      .insert({ user_id: userId, active: true, last_seen: new Date().toISOString() })
      .select()
      .single()

    if (sessionError) {
      console.error('Error starting session:', sessionError)
    }

    if (session) {
      sessionIdRef.current = (session as any).id

      // Heartbeat every 30 seconds
      heartbeatRef.current = setInterval(async () => {
        if (sessionIdRef.current) {
          await supabase
            .from('sessions')
            // @ts-expect-error Supabase types misaligned
            .update({ last_seen: new Date().toISOString() })
            .eq('id', sessionIdRef.current)
        }
      }, 30_000)
    }
  }

  async function endSession() {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
    if (sessionIdRef.current) {
      await supabase
        .from('sessions')
        // @ts-expect-error Supabase types misaligned
        .update({ active: false })
        .eq('id', sessionIdRef.current)
      sessionIdRef.current = null
    }
  }

  async function signOut() {
    await endSession()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        fetchProfile(user.id)
        startSession(user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      const u = sess?.user ?? null
      setUser(u)
      if (u) {
        await fetchProfile(u.id)
        if (event === 'SIGNED_IN') await startSession(u.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    // End session on browser close
    window.addEventListener('beforeunload', endSession)

    return () => {
      subscription.unsubscribe()
      endSession()
      window.removeEventListener('beforeunload', endSession)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
