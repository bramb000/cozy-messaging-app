'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  LiveKitRoom, RoomAudioRenderer, useParticipants,
  useLocalParticipant
} from '@livekit/components-react'
import '@livekit/components-styles'
import styles from './VoicePage.module.css'
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
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>🌼 Cozy Corner Voice Meadow</h2>
        <span className={styles.subtitle}>Gather around the campfire, everyone!</span>
      </header>

      <div className={styles.body}>
        {!connected ? (
          <div className={styles.joinCard}>
            <div className={styles.roomIcon}>🔊</div>
            <p className={styles.roomName}>Cozy Corner Voice</p>
            <p className={styles.roomDesc}>Open to everyone. Just press join.</p>
            {error && <p className={styles.error}>⚠ {error}</p>}
            <button
              id="join-voice-btn"
              className="btn btn-primary"
              onClick={joinRoom}
              disabled={loading}
            >
              {loading ? 'Connecting...' : '→ Join Voice Room'}
            </button>
          </div>
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
      </div>
    </div>
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
    <div className={styles.liveRoom}>
      <div className={styles.participantGrid}>
        {participants.map(p => (
          <ParticipantCard key={p.identity} participant={p} />
        ))}
      </div>

      <div className={styles.controlsBar}>
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
      </div>
    </div>
  )
}

function ParticipantCard({ participant }: { participant: RemoteParticipant | LocalParticipant }) {
  const isSpeaking = participant.isSpeaking
  return (
    <div className={`${styles.participantCard} ${isSpeaking ? styles.speaking : ''}`}>
      {isSpeaking && <div className={styles.waveformLeft}>ılı</div>}
      
      <div className={styles.avatarCircle}>
        <span className={styles.avatarEmoji}>🧑‍🌾</span>
      </div>
      
      {isSpeaking && <div className={styles.waveformRight}>ılı</div>}
      
      <span className={styles.participantName}>{participant.name ?? participant.identity}</span>
      <span className={styles.campfireIcon}>🔥</span>
    </div>
  )
}
