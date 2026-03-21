'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  LiveKitRoom, RoomAudioRenderer, useParticipants,
  useLocalParticipant
} from '@livekit/components-react'
import '@livekit/components-styles'
import styles from './VoicePage.module.css'
import PixelButton from '@/components/ui/PixelButton'
import { Stack } from '@/components/ui/Layout/Stack'
import { Box } from '@/components/ui/Layout/Box'
import { Text } from '@/components/ui/Typography/Text'
import type { RemoteParticipant, LocalParticipant } from 'livekit-client'

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
    <Stack direction="column" h="100%" className={styles.page}>
      <Stack as="header" direction="column" align="center" justify="center" p="space-4" className={styles.header}>
        <Text variant="h2" align="center" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)', color: '#fff' }}>🌼 Cozy Corner Voice Meadow</Text>
        <Text variant="subtitle" align="center" style={{ color: '#3e2723' }}>Gather around the campfire, everyone!</Text>
      </Stack>

      <Stack flex={1} align="center" justify="center" p="space-6" className={styles.body}>
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
      </Stack>
    </Stack>
  )
}

function VoiceRoomUI({ onLeave }: { onLeave: () => void }) {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const [muted, setMuted] = useState(false)

  const toggleMute = useCallback(async () => {
    await localParticipant.setMicrophoneEnabled(muted)
    setMuted(!muted)
  }, [localParticipant, muted])

  return (
    <Stack direction="column" align="center" gap="space-6" w="100%" style={{ maxWidth: 800 }}>
      <Stack direction="row" wrap="wrap" justify="center" w="100%" style={{ gap: '2rem' }}>
        {participants.map(p => (
          <ParticipantCard key={p.identity} participant={p} />
        ))}
      </Stack>

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
          🏕️ Leave Meadow
        </button>
      </Stack>
    </Stack>
  )
}

function ParticipantCard({ participant }: { participant: RemoteParticipant | LocalParticipant }) {
  const isSpeaking = participant.isSpeaking
  return (
    <Stack direction="column" align="center" className={`${styles.participantCard} ${isSpeaking ? styles.speaking : ''}`}>
      {isSpeaking && <div className={styles.waveformLeft}>ılı</div>}
      
      <div className={styles.avatarCircle}>
        <span className={styles.avatarEmoji}>🧑‍🌾</span>
      </div>
      
      {isSpeaking && <div className={styles.waveformRight}>ılı</div>}
      
      <Text variant="caption" style={{ color: '#5c3a21', textShadow: '1px 1px 0px rgba(255,255,255,0.5)', marginTop: 'var(--space-2)' }}>{participant.name ?? participant.identity}</Text>
      <span className={styles.campfireIcon}>🔥</span>
    </Stack>
  )
}
