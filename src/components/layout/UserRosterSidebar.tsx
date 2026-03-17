'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './UserRosterSidebar.module.css'

interface RosterUser {
  id: string
  username: string
  avatar_url: string | null
  isOnline: boolean
}

export default function UserRosterSidebar() {
  const [users, setUsers] = useState<RosterUser[]>([])
  const supabase = createClient()

  async function fetchRoster() {
    const { data: profiles } = await supabase.from('profiles').select('*').order('username') as { data: { id: string, username: string, avatar_url: string | null }[] | null }
    const { data: activeSessions } = await supabase.from('sessions').select('user_id').eq('active', true) as { data: { user_id: string }[] | null }
    
    if (profiles) {
      const activeIds = new Set((activeSessions || []).map(s => s.user_id))
      const mapped = profiles.map(p => ({
        id: p.id,
        username: p.username,
        avatar_url: p.avatar_url,
        isOnline: activeIds.has(p.id)
      }))
      setUsers(mapped)
    }
  }

  useEffect(() => {
    fetchRoster()
    const channel = supabase
      .channel('roster-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        fetchRoster()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchRoster()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onlineUsers = users.filter(u => u.isOnline)
  const offlineUsers = users.filter(u => !u.isOnline)

  return (
    <aside className={`roster-sidebar ${styles.sidebar}`}>
      <div className={styles.header}>
        <span className={styles.title}>Town Directory</span>
      </div>
      <div className={styles.content}>
        <div className={styles.section}>
          <h3 className={styles.heading}>Online — {onlineUsers.length}</h3>
          <div className={styles.list}>
            {onlineUsers.map(u => (
              <div key={u.id} className={styles.userCard}>
                <div className={styles.avatarWrap}>
                  <div className="avatar avatar-sm">
                    {u.avatar_url ? <img src={u.avatar_url} alt={u.username} /> : <span>🌱</span>}
                  </div>
                  <div className={`${styles.statusDot} ${styles.online}`} />
                </div>
                <span className={styles.username}>{u.username}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.heading}>Offline — {offlineUsers.length}</h3>
          <div className={styles.list}>
            {offlineUsers.map(u => (
              <div key={u.id} className={`${styles.userCard} ${styles.offlineCard}`}>
                <div className={styles.avatarWrap}>
                  <div className="avatar avatar-sm">
                    {u.avatar_url ? <img src={u.avatar_url} alt={u.username} /> : <span>💤</span>}
                  </div>
                  <div className={`${styles.statusDot} ${styles.offline}`} />
                </div>
                <span className={styles.username}>{u.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
