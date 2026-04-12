'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  LiveKitRoom, RoomAudioRenderer, useParticipants,
  useLocalParticipant
} from '@livekit/components-react'
import '@livekit/components-styles'
import styles from './VoicePage.module.css'
import type { RemoteParticipant, LocalParticipant } from 'livekit-client'
import { createClient } from '@/lib/supabase/client'
import { CharacterSprite } from '@/components/character/CharacterSprite'
import type { CharacterConfig } from '@/lib/sprites'

function stringHashToIndex(str: string, max: number): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash) % max
}

const TOTAL_SEATS = 25
const RADIUS_PCT = 40 // % of container radius
const seats = Array.from({ length: TOTAL_SEATS }).map((_, i) => {
  const angle = (i / TOTAL_SEATS) * 2 * Math.PI - Math.PI / 2
  return {
    x: Math.cos(angle) * RADIUS_PCT,
    y: Math.sin(angle) * RADIUS_PCT,
  }
})

export default function VoicePage() {
  const [token, setToken]         = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  async function joinRoom() {
    setLoading(true); setError('')
    const res = await fetch('/api/livekit-token', { method: 'POST' })
    if (!res.ok) { setError('Failed to get token'); setLoading(false); return }
    const data = await res.json()
    setToken(data.token); setServerUrl(data.url)
    setConnected(true); setLoading(false)
  }

  function leaveRoom() { setToken(null); setConnected(false) }

  return (
    <div className={styles.page}>
      {!connected ? (
        /* ── Join State ────────────────────────────────── */
        <div className={styles.joinState}>
          <div className={styles.firePlaceholder}>🔥</div>
          <h2 className={styles.joinTitle}>Town Bonfire</h2>
          <p className={styles.joinSubtitle}>Gather around the fire. Everyone is welcome.</p>
          {error && <p className={styles.error}>⚠ {error}</p>}
          <button
            id="join-voice-btn"
            className="btn btn-primary"
            onClick={joinRoom}
            disabled={loading}
          >
            {loading ? 'Connecting...' : '→ Join the Conversation'}
          </button>
        </div>
      ) : (
        /* ── Connected State ───────────────────────────── */
        <LiveKitRoom token={token!} serverUrl={serverUrl} connect audio video={false} onDisconnected={leaveRoom}>
          <RoomAudioRenderer />
          <VoiceRoomUI onLeave={leaveRoom} />
        </LiveKitRoom>
      )}
    </div>
  )
}

function VoiceRoomUI({ onLeave }: { onLeave: () => void }) {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const [muted, setMuted] = useState(false)
  const [profileMap, setProfileMap] = useState<Record<string, CharacterConfig>>({})
  const supabase = createClient()

  useEffect(() => {
    async function fetchProfiles() {
      const { data } = await supabase.from('profiles').select('id, character_config')
      if (data) {
        const map: Record<string, CharacterConfig> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((p: any) => { if (p.character_config) map[p.id] = p.character_config })
        setProfileMap(map)
      }
    }
    fetchProfiles()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleMute = useCallback(async () => {
    await localParticipant.setMicrophoneEnabled(muted)
    setMuted(!muted)
  }, [localParticipant, muted])

  return (
    <div className={styles.roomWrap}>
      {/* Bonfire Circle */}
      <div className={styles.bonfireArea}>
        <div className={styles.fire}>🔥</div>

        {seats.map((seat, i) => {
          const participant = participants.find(p => stringHashToIndex(p.identity, TOTAL_SEATS) === i)
          return (
            <SeatSlot
              key={i}
              seat={seat}
              participant={participant ?? null}
              config={participant ? (profileMap[participant.identity] ?? {}) : null}
            />
          )
        })}
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <button id="toggle-mute-btn" className={styles.ctrlBtn} onClick={toggleMute}>
          {muted ? '🔇 Unmute' : '🎙️ Mute'}
        </button>
        <button className={styles.ctrlBtn}>
          🎧 Deafen
        </button>
        <button id="leave-voice-btn" className={`${styles.ctrlBtn} ${styles.leaveBtn}`} onClick={onLeave}>
          🪵 Leave Bonfire
        </button>
      </div>
    </div>
  )
}

function SeatSlot({
  seat, participant, config,
}: {
  seat: { x: number; y: number }
  participant: RemoteParticipant | LocalParticipant | null
  config: Partial<CharacterConfig> | null
}) {
  const speaking = participant?.isSpeaking ?? false

  return (
    <div
      className={`${styles.seat} ${participant ? styles.seatOccupied : styles.seatEmpty} ${speaking ? styles.speaking : ''}`}
      style={{
        left: `calc(50% + ${seat.x}%)`,
        top:  `calc(50% + ${seat.y}%)`,
      }}
    >
      {participant ? (
        <>
          <CharacterSprite config={config ?? {}} size="sm" animated={speaking} />
          <span className={styles.seatLabel}>{participant.name ?? participant.identity}</span>
        </>
      ) : (
        <div className={styles.emptyPlot} />
      )}
    </div>
  )
}
