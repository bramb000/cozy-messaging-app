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
    console.log('--- Auth: fetchProfile starting for', userId)
    const start = Date.now()
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      console.log(`--- Auth: fetchProfile finished in ${Date.now() - start}ms`)
      
      if (error) {
        console.error('--- Auth: fetchProfile error:', error.message, error.details)
        setProfile(null)
        return null
      }
      
      console.log('--- Auth: fetchProfile success:', (data as any)?.username)
      setProfile(data as Profile)
      return data
    } catch (err) {
      console.error('--- Auth: fetchProfile exception:', err)
      setProfile(null)
      return null
    }
  }

  async function startSession(userId: string) {
    console.log('--- Auth: Starting Session for', userId)
    try {
      // First expire old sessions
      await supabase.rpc('expire_sessions')

      // Check concurrent user count (25 max)
      const { data: count, error: countErr } = await supabase.rpc('active_session_count')
      console.log('--- Auth: Current count check:', count, countErr || '')
      
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        // @ts-expect-error Supabase types misaligned
        .insert({ user_id: userId, active: true, last_seen: new Date().toISOString() })
        .select()
        .single()

      if (sessionError) {
        console.error('--- Auth: Session insert error:', sessionError)
      } else if (session) {
        console.log('--- Auth: Session created successfully:', (session as any).id)
        sessionIdRef.current = (session as any).id

        // Heartbeat every 30 seconds
        heartbeatRef.current = setInterval(async () => {
          if (sessionIdRef.current) {
            const { error: hbErr } = await supabase
              .from('sessions')
              // @ts-expect-error Supabase types misaligned
              .update({ last_seen: new Date().toISOString() })
              .eq('id', sessionIdRef.current)
            
            if (hbErr) console.error('--- Auth: Heartbeat error:', hbErr)
          }
        }, 30_000)
      }
    } catch (err) {
      console.error('--- Auth: startSession exception:', err)
    }
  }

  async function endSession() {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
    if (sessionIdRef.current) {
      console.log('--- Auth: Ending session:', sessionIdRef.current)
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
    console.log('--- AuthProvider mounted')
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log('--- Auth: Initial getUser:', user?.id || 'none')
      setUser(user)
      if (user) {
        fetchProfile(user.id)
        startSession(user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      console.log('--- Auth: State change event:', event)
      console.log('--- Auth: Session user id:', sess?.user?.id || 'none')
      
      const u = sess?.user ?? null
      setUser(u)
      
      if (u) {
        console.log('--- Auth: User detected, calling fetchProfile...')
        try {
          await fetchProfile(u.id)
          console.log('--- Auth: fetchProfile back in onAuthStateChange')
          
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            console.log('--- Auth: Triggering startSession for event:', event)
            await startSession(u.id)
          }
        } catch (e) {
          console.error('--- Auth: Error in onAuthStateChange handler:', e)
        }
      } else {
        console.log('--- Auth: No user, resetting profile state')
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
