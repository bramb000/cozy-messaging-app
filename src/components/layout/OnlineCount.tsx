'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function OnlineCount() {
  const [count, setCount] = useState<number>(0)
  const supabase = createClient()

  async function fetchCount() {
    const { data, error } = await supabase.rpc('active_session_count')
    if (error) console.error('OnlineCount: fetch error', error)
    else console.log('OnlineCount: current total', data)
    setCount(data ?? 0)
  }

  useEffect(() => {
    fetchCount()
    console.log('--- OnlineCount: Subscribing to sessions changes...')
    const channel = supabase
      .channel('sessions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, (payload) => {
        console.log('--- OnlineCount: Realtime update received:', payload)
        fetchCount()
      })
      .subscribe((status) => {
        console.log('--- OnlineCount: Subscription status:', status)
      })

    return () => { 
      console.log('--- OnlineCount: Unsubscribing...')
      supabase.removeChannel(channel) 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="online-count">
      <div className="online-dot" />
      <span>{count} / 25 online</span>
    </div>
  )
}
