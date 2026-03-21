'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function OnlineCount() {
  const [count, setCount] = useState<number>(0)
  const supabase = createClient()

  async function fetchCount() {
    const { data, error } = await supabase.rpc('active_session_count')
    if (!error) {
      setCount(data ?? 0)
    }
  }

  useEffect(() => {
    fetchCount()
    const channel = supabase
      .channel('sessions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, (payload) => {
        fetchCount()
      })
      .subscribe()

    return () => { 
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
