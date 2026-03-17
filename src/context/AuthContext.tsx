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
  const [authEvent, setAuthEvent] = useState<string | null>(null)
  
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
        console.error('Error fetching profile:', error.message)
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
    try {
      // First expire old sessions
      await supabase.rpc('expire_sessions')

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        // @ts-expect-error Supabase types misaligned
        .insert({ user_id: userId, active: true, last_seen: new Date().toISOString() })
        .select()
        .single()

      if (sessionError) {
        console.error('Error starting session:', sessionError)
      } else if (session) {
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
    } catch (err) {
      console.error('Error in startSession:', err)
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
    setAuthEvent('SIGNED_OUT')
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  // 1. Initial Identity Check & Subscription
  useEffect(() => {
    // Check current user immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        setAuthEvent('INITIAL_SESSION')
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setAuthEvent(event)
      
      if (!u) setProfile(null)
      setLoading(false)
    })

    window.addEventListener('beforeunload', endSession)

    return () => {
      subscription.unsubscribe()
      endSession()
      window.removeEventListener('beforeunload', endSession)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2. Reactive Data Fetching (The "Pro" way)
  // ThisEffect handles all data side-effects outside of the synchronous auth flow.
  // This naturally avoids the navigator.lock deadlock on HTTPS.
  useEffect(() => {
    if (user) {
      fetchProfile(user.id)
      
      if (authEvent === 'SIGNED_IN' || authEvent === 'INITIAL_SESSION') {
        startSession(user.id)
      }
    } else {
      endSession()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authEvent])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
