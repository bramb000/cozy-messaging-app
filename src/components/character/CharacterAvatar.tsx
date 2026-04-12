'use client'
import { CharacterSprite, type SpriteSize } from './CharacterSprite'
import type { CharacterConfig } from '@/lib/sprites'
import styles from './CharacterAvatar.module.css'

// Avatar display variants — each maps to a specific inner sprite size and viewport
export type AvatarVariant = 'roster' | 'chat' | 'panel'

const VARIANT_MAP: Record<AvatarVariant, {
  spriteSize: SpriteSize  // which CharacterSprite size to render inside
  viewW: number           // viewport clip width
  viewH: number           // viewport clip height
}> = {
  // Roster sidebar: compact, shows head only. Sprite is 48×64, we clip to 40×44.
  roster: { spriteSize: 'sm', viewW: 40, viewH: 44 },
  // Chat bubbles: natural sprite size, no box.
  chat:   { spriteSize: 'sm', viewW: 48, viewH: 64 },
  // Sidebar user panel: slight scale-up, no clipping box.
  panel:  { spriteSize: 'sm', viewW: 48, viewH: 64 },
}

interface CharacterAvatarProps {
  config?: Partial<CharacterConfig>
  variant?: AvatarVariant
  /** Optional online/offline dot */
  showDot?: boolean
  dotOnline?: boolean
  className?: string
}

export function CharacterAvatar({
  config = {},
  variant = 'chat',
  showDot = false,
  dotOnline = false,
  className = '',
}: CharacterAvatarProps) {
  const { spriteSize, viewW, viewH } = VARIANT_MAP[variant]

  return (
    <div
      className={`${styles.avatar} ${styles[variant]} ${className}`}
      style={{ width: viewW, height: viewH }}
    >
      {/* The sprite is rendered at its natural size then the viewport clips it */}
      <div className={styles.spriteViewport} style={{ width: viewW, height: viewH }}>
        <CharacterSprite config={config} size={spriteSize} animated={false} />
      </div>
      {showDot && (
        <span className={`${styles.dot} ${dotOnline ? styles.dotOnline : styles.dotOffline}`} />
      )}
    </div>
  )
}
