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
        <h2 className={styles.title}>🎙️ Voice Room</h2>
        <span className={styles.subtitle}>Drop in · Drop out · No video</span>
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

      <div className={styles.controls}>
        <button
          id="toggle-mute-btn"
          className={`btn ${muted ? 'btn-danger' : 'btn-secondary'}`}
          onClick={toggleMute}
        >
          {muted ? '🔇 Unmute' : '🎙️ Mute'}
        </button>
        <button id="leave-voice-btn" className="btn btn-danger" onClick={onLeave}>
          📵 Leave Room
        </button>
      </div>
    </div>
  )
}

function ParticipantCard({ participant }: { participant: RemoteParticipant | LocalParticipant }) {
  const isSpeaking = participant.isSpeaking
  return (
    <div className={`${styles.participantCard} pixel-panel ${isSpeaking ? styles.speaking : ''}`}>
      <div className={`avatar avatar-lg ${styles.participantAvatar}`}>
        <span>🎙️</span>
      </div>
      <span className={styles.participantName}>{participant.name ?? participant.identity}</span>
      {isSpeaking && <span className={styles.speakingIndicator}>◉</span>}
    </div>
  )
}
