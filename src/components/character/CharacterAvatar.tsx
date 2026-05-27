'use client'
import { CharacterSprite, type SpriteSize } from './CharacterSprite'
import type { CharacterConfig } from '@/lib/sprites'
import styles from './CharacterAvatar.module.css'

// Avatar display variants — each maps to a specific inner sprite size and viewport
export type AvatarVariant = 'roster' | 'chat' | 'panel' | 'preview'

const VARIANT_MAP: Record<AvatarVariant, {
  spriteSize: SpriteSize  // which CharacterSprite size to render inside
  viewW: number           // viewport clip width fallback
  viewH: number           // viewport clip height fallback
  cssWidthVar: string     // CSS token variable for width
  cssHeightVar: string    // CSS token variable for height
}> = {
  // Roster sidebar: compact, shows head only. Sprite is 48×64, we clip to 40×44.
  roster: { spriteSize: 'sm', viewW: 40, viewH: 44, cssWidthVar: '--avatar-size-sm-w', cssHeightVar: '--avatar-size-sm-h' },
  // Chat bubbles: rich details at 2x scale, chest-up crop (64x72).
  chat:   { spriteSize: 'md', viewW: 64, viewH: 72, cssWidthVar: '--avatar-size-md-w', cssHeightVar: '--avatar-size-md-h' },
  // Sidebar user panel: 1x scale chest-up crop (48x56) to fit sidebar perfectly.
  panel:  { spriteSize: 'sm', viewW: 48, viewH: 56, cssWidthVar: '--avatar-size-panel-w', cssHeightVar: '--avatar-size-panel-h' },
  // Profile preview: full lg sprite, centered in the appearance panel.
  preview: { spriteSize: 'lg', viewW: 144, viewH: 192, cssWidthVar: '--avatar-size-lg-w', cssHeightVar: '--avatar-size-lg-h' },
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
  const { spriteSize, viewW, viewH, cssWidthVar, cssHeightVar } = VARIANT_MAP[variant]

  const styleDimension = {
    width: `var(${cssWidthVar}, ${viewW}px)`,
    height: `var(${cssHeightVar}, ${viewH}px)`,
  }

  return (
    <div
      className={`${styles.avatar} ${styles[variant]} ${className}`}
      style={styleDimension}
    >
      {/* The sprite is rendered at its natural size then the viewport clips it */}
      <div className={styles.spriteViewport} style={styleDimension}>
        <CharacterSprite config={config} size={spriteSize} animated={false} />
      </div>
      {showDot && (
        <span className={`${styles.dot} ${dotOnline ? styles.dotOnline : styles.dotOffline}`} />
      )}
    </div>
  )
}
