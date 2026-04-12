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

// Display pixel sizes per size variant
const SIZE_MAP: Record<SpriteSize, { w: number; h: number }> = {
  sm: { w: 48,  h: 64  },
  md: { w: 96,  h: 128 },
  lg: { w: 144, h: 192 },
}

interface CharacterSpriteProps {
  config?: Partial<CharacterConfig>
  size?: SpriteSize
  /** If true, plays the idle animation. If false, renders a single still frame. */
  animated?: boolean
  /** Which animation row to play when animated=true */
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

  const { w, h } = SIZE_MAP[size]

  // Scale factor: native sprite is SPRITE_FRAME_W × SPRITE_FRAME_H
  const scaleX = w / SPRITE_FRAME_W
  const scaleY = h / SPRITE_FRAME_H

  // For animated layers the sheet is scrolled horizontally across the row
  const sheetW = SPRITE_FRAME_W * SPRITE_COLS * scaleX
  const frameW = SPRITE_FRAME_W * scaleX
  const animRowY = (ANIMATION_ROWS[animation] ?? 0) * SPRITE_FRAME_H * scaleY

  return (
    <div
      className={`${styles.spriteContainer} ${className}`}
      style={{ width: w, height: h }}
      aria-hidden="true"
    >
      {layers.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className={`${styles.layer} ${animated ? styles.animated : ''}`}
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: `${sheetW}px auto`,
            backgroundPositionY: `-${animRowY}px`,
            // Animated: let CSS animation scroll X. Static: frame 0
            backgroundPositionX: animated ? undefined : '0px',
            // Animation inline vars for CSS
            ['--frame-w' as string]: `${frameW}px`,
            ['--total-w' as string]: `${sheetW}px`,
            ['--cols' as string]: SPRITE_COLS,
          }}
        />
      ))}
    </div>
  )
}
