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

export type SpriteSize = 'sm' | 'md' | 'lg'

// Display pixel sizes — each is an exact integer multiple of the native 48×64 frame
const SIZE_MAP: Record<SpriteSize, { w: number; h: number; scale: number }> = {
  sm: { w: 48,  h: 64,  scale: 1 },
  md: { w: 96,  h: 128, scale: 2 },
  lg: { w: 144, h: 192, scale: 3 },
}

// Map size → per-size animation CSS class (avoids CSS custom props in keyframes)
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
  /** Which row of the sheet to play (only used when animated=true) */
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
  const layers = useMemo(() => {
    const mergedConfig: CharacterConfig = { ...DEFAULT_CHARACTER_CONFIG, ...config }
    return resolveCharacterLayers(mergedConfig)
  }, [config])

  const { w, h, scale } = SIZE_MAP[size]

  // Full sprite sheet scaled width (all 12 frames side by side)
  const sheetW = SPRITE_FRAME_W * SPRITE_COLS * scale   // e.g. sm: 576px

  // Y offset to select the correct animation row from the sheet
  const rowY = (ANIMATION_ROWS[animation] ?? 0) * SPRITE_FRAME_H * scale

  return (
    <div
      className={`${styles.spriteContainer} ${className}`}
      style={{ width: w, height: h }}
      aria-hidden="true"
    >
      {layers.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className={`${styles.layer} ${animated ? ANIMATED_CLASS[size] : ''}`}
          style={{
            backgroundImage: `url(${src})`,
            // Scale the sheet so one row = container height
            backgroundSize: `${sheetW}px auto`,
            // Select animation row (Y) and first frame (X) for static
            backgroundPositionY: `-${rowY}px`,
            backgroundPositionX: '0px',
          }}
        />
      ))}
    </div>
  )
}
