'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import type { Profile } from '@/types/database'
import styles from './WorldPage.module.css'

const TILE = 32
const WORLD_W = 40
const WORLD_H = 30
const SPEED = 2

interface PlayerState {
  userId: string
  username: string
  x: number
  y: number
  direction: string
  skinTone?: string
  hairColor?: string
  hairStyle?: number
  outfitColor?: string
  pantsColor?: string
  hatIndex?: number
}

export default function WorldPage() {
  const { user, profile } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playersRef = useRef<Map<string, PlayerState>>(new Map())
  const myPosRef = useRef({ x: 10 * TILE, y: 10 * TILE, direction: 'down' })
  const keysRef = useRef<Set<string>>(new Set())
  const supabase = createClient()
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null)
  const animFrameRef = useRef<number>(0)
  const updateThrottleRef = useRef(0)

  useEffect(() => {
    if (!user || !profile) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    // --- Load initial positions ---
    async function loadPositions() {
      const { data } = await supabase
        .from('world_positions')
        .select('*, profile:profiles(username, character_config)')
      if (data) {
        data.forEach((p: any) => {
          playersRef.current.set(p.user_id, {
            userId: p.user_id,
            username: p.profile?.username ?? 'unknown',
            x: (p.x ?? 10) * TILE,
            y: (p.y ?? 10) * TILE,
            direction: p.direction ?? 'down',
            skinTone: p.profile?.character_config?.skinTone,
            hairColor: p.profile?.character_config?.hairColor,
            hairStyle: p.profile?.character_config?.hairStyle,
            outfitColor: p.profile?.character_config?.outfitColor,
            pantsColor: p.profile?.character_config?.pantsColor,
            hatIndex: p.profile?.character_config?.hatIndex,
          })
        })
      }
      // Set self
      const self = playersRef.current.get(user!.id)
      if (self) {
        myPosRef.current = { x: self.x, y: self.y, direction: self.direction }
      }
    }
    loadPositions()

    // --- Realtime channel for positions ---
    const channel = supabase.channel('world-positions', { config: { broadcast: { self: false } } })
    channel
      .on('broadcast', { event: 'move' }, ({ payload }: { payload: PlayerState }) => {
        playersRef.current.set(payload.userId, payload)
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'world_positions' }, (payload) => {
        playersRef.current.delete((payload.old as any).user_id)
      })
      .subscribe()

    // Add self to players map
    playersRef.current.set(user.id, {
      userId: user.id,
      username: profile.username,
      x: myPosRef.current.x,
      y: myPosRef.current.y,
      direction: myPosRef.current.direction,
      skinTone: (profile.character_config as any)?.skinTone,
      hairColor: (profile.character_config as any)?.hairColor,
      hairStyle: (profile.character_config as any)?.hairStyle,
      outfitColor: (profile.character_config as any)?.outfitColor,
      pantsColor: (profile.character_config as any)?.pantsColor,
      hatIndex: (profile.character_config as any)?.hatIndex,
    })

    // --- Key handling ---
    const onKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key)
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    // --- Drawing ---
    function drawTile(x: number, y: number, color: string) {
      ctx.fillStyle = color
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE)
    }

    function drawWorld() {
      // Background grass
      ctx.fillStyle = '#3a5c2a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Path (horizontal + vertical cross)
      for (let t = 0; t < WORLD_W; t++) {
        drawTile(t, Math.floor(WORLD_H / 2), '#8B7355')
      }
      for (let t = 0; t < WORLD_H; t++) {
        drawTile(Math.floor(WORLD_W / 2), t, '#8B7355')
      }

      // Trees in corners
      const treeTiles = [
        [2, 2],[3, 2],[4, 2],[2, 3],[2, 4],
        [WORLD_W-3, 2],[WORLD_W-4, 2],[WORLD_W-3, 3],[WORLD_W-3, 4],
        [2, WORLD_H-3],[3, WORLD_H-3],[2, WORLD_H-4],[2, WORLD_H-5],
        [WORLD_W-3, WORLD_H-3],[WORLD_W-4, WORLD_H-3],[WORLD_W-3, WORLD_H-4],
      ]
      treeTiles.forEach(([tx, ty]) => {
        ctx.fillStyle = '#2d4a1e'
        ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE)
        ctx.fillStyle = '#1a2d12'
        ctx.fillRect(tx * TILE + 2, ty * TILE + 2, TILE - 4, TILE - 4)
      })

      // Pond
      for (let px = 18; px <= 21; px++) {
        for (let py = 12; py <= 14; py++) {
          drawTile(px, py, '#4A90D9')
        }
      }

      // Grid lines (subtle)
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'
      ctx.lineWidth = 0.5
      for (let gx = 0; gx <= WORLD_W; gx++) {
        ctx.beginPath(); ctx.moveTo(gx * TILE, 0); ctx.lineTo(gx * TILE, WORLD_H * TILE); ctx.stroke()
      }
      for (let gy = 0; gy <= WORLD_H; gy++) {
        ctx.beginPath(); ctx.moveTo(0, gy * TILE); ctx.lineTo(WORLD_W * TILE, gy * TILE); ctx.stroke()
      }
    }

    function drawPlayer(p: PlayerState, isMe: boolean) {
      const cx = p.x + TILE / 2
      const cy = p.y + TILE / 2

      const skinTone = p.skinTone ?? '#FDBCB4'
      const hairColor = p.hairColor ?? '#4A3728'
      const hairStyle = p.hairStyle ?? 0
      const outfitColor = p.outfitColor ?? '#5A7A3A'
      const pantsColor = p.pantsColor ?? '#8B5E3C'
      const hatIndex = p.hatIndex ?? -1
      const hat = ['','🎩','⛑️','👒','🎓','🪖'][hatIndex] || ''

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.beginPath()
      ctx.ellipse(cx, p.y + TILE - 4, 10, 5, 0, 0, Math.PI * 2)
      ctx.fill()

      // The character sprite is 48x64. We scale it by 0.5 to 24x32.
      ctx.save()
      ctx.translate(p.x + 4, p.y - 4)
      ctx.scale(0.5, 0.5)

      // Pants
      ctx.fillStyle = pantsColor
      ctx.fillRect(14, 42, 9, 18)
      ctx.fillRect(25, 42, 9, 18)
      // Pants Shading
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(14, 55, 9, 5)
      ctx.fillRect(25, 55, 9, 5)

      // Shirt
      ctx.fillStyle = outfitColor
      ctx.fillRect(12, 26, 24, 18)
      // Shirt Shading
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(12, 40, 24, 4)

      // Arms
      ctx.fillStyle = skinTone
      ctx.fillRect(6, 28, 6, 14)
      ctx.fillRect(36, 28, 6, 14)

      // Head
      ctx.fillStyle = skinTone
      ctx.fillRect(14, 8, 20, 20)
      
      // Face (Blush) - don't show if walking up
      if (p.direction !== 'up') {
        ctx.fillStyle = 'rgba(255,0,0,0.1)'
        ctx.fillRect(17, 21, 4, 2)
        ctx.fillRect(27, 21, 4, 2)
      }

      // Hair
      ctx.fillStyle = hairColor
      if (hairStyle === 0) { // Short
        ctx.fillRect(14, 8, 20, 6)
        if (p.direction !== 'up') { ctx.fillRect(12, 12, 2, 4); ctx.fillRect(34, 12, 2, 4); }
      } 
      else if (hairStyle === 1) { // Medium
        ctx.fillRect(12, 8, 24, 8)
        if (p.direction !== 'up') { ctx.fillRect(12, 16, 4, 6); ctx.fillRect(32, 16, 4, 6); }
      } 
      else if (hairStyle === 2) { // Long
        ctx.fillRect(10, 8, 28, 10)
        ctx.fillRect(10, 18, 4, 18)
        ctx.fillRect(34, 18, 4, 18)
      } 
      else if (hairStyle === 3) { // Curly
        ctx.fillRect(12, 6, 24, 10)
        ctx.fillRect(10, 12, 6, 12)
        ctx.fillRect(32, 12, 6, 12)
        if (p.direction !== 'up') ctx.fillRect(14, 4, 20, 2);
      } 
      else { // Braids
        ctx.fillRect(14, 8, 20, 6)
        ctx.fillRect(14, 14, 4, 28)
        ctx.fillRect(30, 14, 4, 28)
      } 

      // Eyes - don't show if walking up
      if (p.direction !== 'up') {
        ctx.fillStyle = '#2C1810'
        ctx.fillRect(18, 17, 3, 3)
        ctx.fillRect(27, 17, 3, 3)
      }

      // Hat
      if (hat) {
        ctx.font = '18px serif'
        ctx.textAlign = 'center'
        // Slight offset if walking up
        const hatY = p.direction === 'up' ? 10 : 12
        ctx.fillText(hat, 24, hatY)
      }

      ctx.restore()

      // Nametag
      ctx.fillStyle = isMe ? 'rgba(90,122,58,0.85)' : 'rgba(26,26,46,0.85)'
      const tagW = ctx.measureText(p.username).width + 8
      ctx.fillRect(cx - tagW / 2 - 1, p.y - 14, tagW + 2, 13)
      ctx.fillStyle = '#F5E6C8'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(p.username.slice(0, 10), cx, p.y - 4)
      ctx.textAlign = 'left'

      // My indicator
      if (isMe) {
        ctx.fillStyle = '#D4AF37'
        ctx.fillRect(cx - 2, p.y - 22, 4, 4)
      }
    }

    // --- Game loop ---
    function loop(time: number) {
      // Movement
      const keys = keysRef.current
      let dx = 0; let dy = 0; let dir = myPosRef.current.direction
      if (keys.has('ArrowLeft') || keys.has('a')) { dx = -SPEED; dir = 'left' }
      if (keys.has('ArrowRight') || keys.has('d')) { dx = SPEED; dir = 'right' }
      if (keys.has('ArrowUp') || keys.has('w')) { dy = -SPEED; dir = 'up' }
      if (keys.has('ArrowDown') || keys.has('s')) { dy = SPEED; dir = 'down' }

      if (dx || dy) {
        const nx = Math.max(0, Math.min(myPosRef.current.x + dx, (WORLD_W - 1) * TILE))
        const ny = Math.max(0, Math.min(myPosRef.current.y + dy, (WORLD_H - 1) * TILE))
        myPosRef.current = { x: nx, y: ny, direction: dir }

        const me = playersRef.current.get(user!.id)
        if (me) { me.x = nx; me.y = ny; me.direction = dir }

        // Throttle DB + broadcast updates
        if (time - updateThrottleRef.current > 100) {
          updateThrottleRef.current = time
          const tileX = Math.round(nx / TILE)
          const tileY = Math.round(ny / TILE)
          // @ts-expect-error Supabase types misaligned
          supabase.from('world_positions').upsert({ user_id: user!.id, x: tileX, y: tileY, direction: dir, updated_at: new Date().toISOString() })
          const payloadData = { 
             userId: user!.id, 
             username: profile!.username, 
             x: nx, y: ny, direction: dir, 
             skinTone: (profile!.character_config as any)?.skinTone,
             hairColor: (profile!.character_config as any)?.hairColor,
             hairStyle: (profile!.character_config as any)?.hairStyle,
             outfitColor: (profile!.character_config as any)?.outfitColor,
             pantsColor: (profile!.character_config as any)?.pantsColor,
             hatIndex: (profile!.character_config as any)?.hatIndex
          }
          channel.send({ type: 'broadcast', event: 'move', payload: payloadData })
        }
      }

      // Render
      drawWorld()
      playersRef.current.forEach((p, id) => drawPlayer(p, id === user!.id))

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    // --- Canvas click → tooltip ---
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const mx = (e.clientX - rect.left) * scaleX
      const my = (e.clientY - rect.top) * scaleY
      let found: PlayerState | null = null
      playersRef.current.forEach(p => {
        if (mx >= p.x && mx <= p.x + TILE && my >= p.y && my <= p.y + TILE) found = p
      })
      setTooltip(found ? { name: (found as PlayerState).username, x: e.clientX, y: e.clientY } : null)
    }
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('click', onClick)
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>🗺️ The World</h2>
        <span className={styles.hint}>WASD / Arrow keys to move · Click a player to see their name</span>
      </header>
      <div className={styles.canvasWrap} onClick={() => setTooltip(null)}>
        <canvas
          ref={canvasRef}
          width={WORLD_W * TILE}
          height={WORLD_H * TILE}
          className={styles.canvas}
          id="world-canvas"
        />
        {tooltip && (
          <div className={`pixel-panel ${styles.tooltip}`} style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}>
            🌱 {tooltip.name}
          </div>
        )}
      </div>
      <div className={styles.controls}>
        <kbd className={styles.kbd}>W</kbd><kbd className={styles.kbd}>A</kbd><kbd className={styles.kbd}>S</kbd><kbd className={styles.kbd}>D</kbd> or <kbd className={styles.kbd}>↑</kbd><kbd className={styles.kbd}>←</kbd><kbd className={styles.kbd}>↓</kbd><kbd className={styles.kbd}>→</kbd> to walk
      </div>
    </div>
  )
}
