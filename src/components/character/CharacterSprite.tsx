'use client'
import { useMemo } from 'react'
import styles from './CharacterSprite.module.css'
import {
  resolveCharacterLayers,
  SPRITE_FRAME_W,
  SPRITE_FRAME_H,
  SPRITE_COLS,
  ANIMATION_ROWS,
  DEFAULT_CHARACTER_CONFIG,
  type CharacterConfig,
} from '@/lib/sprites'
import { useSpriteUrlMap } from '@/context/SpriteUrlContext'

export type SpriteSize = 'sm' | 'md' | 'lg'

// Display pixel sizes — each is an exact integer multiple of the native 48×64 frame
const SIZE_MAP: Record<SpriteSize, { w: number; h: number; scale: number }> = {
  sm: { w: 48,  h: 64,  scale: 1 },
  md: { w: 96,  h: 128, scale: 2 },
  lg: { w: 144, h: 192, scale: 3 },
}

// Per-size animation CSS classes (avoids CSS custom props inside steps())
const ANIMATED_CLASS: Record<SpriteSize, string> = {
  sm: styles.animatedSm,
  md: styles.animatedMd,
  lg: styles.animatedLg,
}

interface CharacterSpriteProps {
  config?: Partial<CharacterConfig>
  size?: SpriteSize
  /** If true, plays the walk cycle animation. Static single frame if false. */
  animated?: boolean
  /** Which animation row of the sheet to play (only when animated=true) */
  animation?: keyof typeof ANIMATION_ROWS
  className?: string
}

export function CharacterSprite({
  config,
  size = 'md',
  animated = false,
  animation = 'idle_down',
  className = '',
}: CharacterSpriteProps) {
  // CDN URL map — populated once by SpriteUrlContext on app mount.
  // Falls back to the /api/sprites proxy silently if context isn't ready yet.
  const urlMap = useSpriteUrlMap()

  const layers = useMemo(() => {
    const mergedConfig: CharacterConfig = { ...DEFAULT_CHARACTER_CONFIG, ...config }
    return resolveCharacterLayers(mergedConfig)
  }, [config])

  const { w, h, scale } = SIZE_MAP[size]
  const sheetW = SPRITE_FRAME_W * SPRITE_COLS * scale                    // full sheet width at scale
  const rowY   = (ANIMATION_ROWS[animation] ?? 0) * SPRITE_FRAME_H * scale // y-offset for animation row

  return (
    <div
      className={`${styles.spriteContainer} ${className}`}
      style={{ width: w, height: h }}
      aria-hidden="true"
    >
      {layers.map((proxyUrl, i) => {
        // Prefer the signed CDN URL; fall back to the server proxy route
        const src = urlMap[proxyUrl] ?? proxyUrl
        return (
          <div
            key={`${proxyUrl}-${i}`}
            className={`${styles.layer} ${animated ? ANIMATED_CLASS[size] : ''}`}
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: `${sheetW}px auto`,
              backgroundPositionY: `-${rowY}px`,
              backgroundPositionX: '0px',
            }}
          />
        )
      })}
    </div>
  )
}
