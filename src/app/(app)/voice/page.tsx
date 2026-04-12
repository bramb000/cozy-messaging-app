'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  LiveKitRoom, RoomAudioRenderer, useParticipants,
  useLocalParticipant
} from '@livekit/components-react'
import '@livekit/components-styles'
import styles from './VoicePage.module.css'
import PixelButton from '@/components/ui/PixelButton'
import { PageContainer } from '@/components/ui/Layout/PageContainer'
import { PageHeader } from '@/components/ui/Layout/PageHeader'
import { PageContent } from '@/components/ui/Layout/PageContent'
import { Stack } from '@/components/ui/Layout/Stack'
import { Box } from '@/components/ui/Layout/Box'
import { Text } from '@/components/ui/Typography/Text'
import type { RemoteParticipant, LocalParticipant } from 'livekit-client'
import { createClient } from '@/lib/supabase/client'

// Simple string hash function to reliably map a string to a number 0-24
function stringHashToIndex(str: string, maxSeats: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash) % maxSeats;
}

// Pre-calculate 25 seats in a circle
const TOTAL_SEATS = 25;
const radius = 42; // Percentage of the container size (50% is edge)
const RADIUS_UNIT = '%';
const seats = Array.from({ length: TOTAL_SEATS }).map((_, i) => {
  const angle = (i / TOTAL_SEATS) * 2 * Math.PI;
  // Offset by -90deg (-PI/2) to start top-center
  const x = Math.cos(angle - Math.PI / 2) * radius;
  const y = Math.sin(angle - Math.PI / 2) * radius;
  return { x, y };
});

export default function VoicePage() {
  const [token, setToken] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function joinRoom() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/livekit-token', { method: 'POST' })
    if (!res.ok) { setError('Failed to get token'); setLoading(false); return }
    const data = await res.json()
    setToken(data.token)
    setServerUrl(data.url)
    setConnected(true)
    setLoading(false)
  }

  function leaveRoom() {
    setToken(null)
    setConnected(false)
  }

  return (
    <PageContainer>
      <PageHeader title="🔥 Town Bonfire" subtitle="Gather around the fire, everyone!" />

      <PageContent centered className={styles.body}>
        {!connected ? (
          <Stack direction="column" align="center" gap="space-4" p="space-10" className={styles.joinCard}>
            <div className={styles.roomIcon}>🔊</div>
            <Text variant="h3" style={{ color: '#fff', textShadow: '1px 1px 0 #000' }}>Cozy Corner Voice</Text>
            <Text variant="subtitle" align="center" style={{ color: '#3e2723' }}>Open to everyone. Just press join.</Text>
            {error && <Box p="space-2" style={{ background: '#f8d7da', border: '2px solid #f5c6cb' }}><Text variant="body" color="red">⚠ {error}</Text></Box>}
            <PixelButton
              id="join-voice-btn"
              variant="primary"
              onClick={joinRoom}
              disabled={loading}
            >
              {loading ? 'Connecting...' : '→ Join Voice Room'}
            </PixelButton>
          </Stack>
        ) : (
          <LiveKitRoom
            token={token!}
            serverUrl={serverUrl}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={leaveRoom}
          >
            <RoomAudioRenderer />
            <VoiceRoomUI onLeave={leaveRoom} />
          </LiveKitRoom>
        )}
      </PageContent>
    </PageContainer>
  )
}

function VoiceRoomUI({ onLeave }: { onLeave: () => void }) {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const [muted, setMuted] = useState(false)
  const [profilesMap, setProfilesMap] = useState<Record<string, {avatar_url: string | null}>>({})

  const supabase = createClient()

  useEffect(() => {
    // Fetch all profiles so we have their avatars
    async function fetchProfiles() {
      const { data } = await supabase.from('profiles').select('id, avatar_url')
      if (data) {
        const map: Record<string, {avatar_url: string | null}> = {}
        data.forEach((p: any) => map[p.id] = { avatar_url: p.avatar_url })
        setProfilesMap(map)
      }
    }
    fetchProfiles()
  }, [])

  const toggleMute = useCallback(async () => {
    await localParticipant.setMicrophoneEnabled(muted)
    setMuted(!muted)
  }, [localParticipant, muted])

  return (
    <Stack direction="column" align="center" gap="space-6" w="100%" style={{ maxWidth: 800 }}>
      
      {/* The Circular Bonfire Area */}
      <div className={styles.bonfireContainer}>
        <div className={styles.centerFire}>🔥</div>
        
        {participants.map(p => {
          const seatIndex = stringHashToIndex(p.identity, TOTAL_SEATS)
          const seat = seats[seatIndex]
          const profile = profilesMap[p.identity] || { avatar_url: null }
          
          return (
            <ParticipantCard 
              key={p.identity} 
              participant={p} 
              profile={profile}
              style={{
                transform: `translate(-50%, -50%) translate(${seat.x * 2.5}px, ${seat.y * 2.5}px)`
              }}
              seat={seat}
            />
          )
        })}
      </div>

      <Stack direction="row" gap="space-3" className={styles.controlsBar}>
        <button
          id="toggle-mute-btn"
          className={styles.controlBtn}
          onClick={toggleMute}
        >
          {muted ? '🔇 Muted' : '🎙️ Mute'}
        </button>
        <button className={styles.controlBtn}>
          🎧 Deafen
        </button>
        <button id="leave-voice-btn" className={styles.controlBtn} onClick={onLeave}>
          🪵 Leave Bonfire
        </button>
      </Stack>
    </Stack>
  )
}

function ParticipantCard({ 
  participant, 
  profile,
  seat 
}: { 
  participant: RemoteParticipant | LocalParticipant,
  profile: { avatar_url: string | null },
  style?: React.CSSProperties,
  seat: { x: number, y: number }
}) {
  const isSpeaking = participant.isSpeaking
  return (
    <div 
      className={`${styles.participantCard} ${isSpeaking ? styles.speaking : ''}`}
      style={{
        transform: `translate(calc(-50% + ${seat.x * 3}px), calc(-50% + ${seat.y * 3}px))`
      }}
    >
      {isSpeaking && <div className={styles.waveformLeft}>ılı</div>}
      
      <div className={styles.avatarCircle}>
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="Avatar" className={styles.avatarImage} />
        ) : (
          <span className={styles.avatarEmoji}>🧑‍🌾</span>
        )}
      </div>
      
      {isSpeaking && <div className={styles.waveformRight}>ılı</div>}
      
      <Text variant="caption" style={{ color: 'var(--text-primary)', textShadow: '1px 1px 0px rgba(0,0,0,0.8)', marginTop: 'var(--space-2)' }}>
        {participant.name ?? participant.identity}
      </Text>
    </div>
  )
}
