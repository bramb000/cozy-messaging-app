'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CharacterAvatar } from '@/components/character/CharacterAvatar'
import styles from './UserRosterSidebar.module.css'

interface RosterUser {
  id: string
  username: string
  character_config: Record<string, unknown> | null
  isOnline: boolean
}

export default function UserRosterSidebar() {
  const [users, setUsers] = useState<RosterUser[]>([])
  const supabase = createClient()

  async function fetchRoster() {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, character_config')
      .order('username') as { data: { id: string; username: string; character_config: Record<string, unknown> | null }[] | null }

    const { data: activeSessions } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('active', true) as { data: { user_id: string }[] | null }

    if (profiles) {
      const activeIds = new Set((activeSessions || []).map(s => s.user_id))
      setUsers(profiles.map(p => ({
        id: p.id,
        username: p.username,
        character_config: p.character_config,
        isOnline: activeIds.has(p.id),
      })))
    }
  }

  useEffect(() => {
    fetchRoster()
    const channel = supabase
      .channel('roster-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, fetchRoster)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchRoster)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const online  = users.filter(u => u.isOnline)
  const offline = users.filter(u => !u.isOnline)

  return (
    <aside className="roster-sidebar" aria-label="Member List">
      <div className={styles.header}>
        <span className={styles.title}>Directory</span>
      </div>

      <div className={styles.list}>
        {online.length > 0 && (
          <>
            <span className={styles.section}>Online — {online.length}</span>
            {online.map(u => <UserRow key={u.id} user={u} online />)}
          </>
        )}

        {offline.length > 0 && (
          <>
            <span className={styles.section}>Offline — {offline.length}</span>
            {offline.map(u => <UserRow key={u.id} user={u} online={false} />)}
          </>
        )}
      </div>
    </aside>
  )
}

function UserRow({ user, online }: { user: RosterUser; online: boolean }) {
  return (
    <div className={`${styles.row} ${online ? styles.online : styles.offline}`}>
      <CharacterAvatar
        config={user.character_config ?? {}}
        variant="roster"
        showDot
        dotOnline={online}
      />
      <span className={styles.username}>{user.username}</span>
    </div>
  )
}
