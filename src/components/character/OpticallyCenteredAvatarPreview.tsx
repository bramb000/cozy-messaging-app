'use client'

import { useEffect, useMemo, useState } from 'react'
import { CharacterAvatar } from '@/components/character/CharacterAvatar'
import { useSpriteUrlMap } from '@/context/SpriteUrlContext'
import {
  resolveCharacterLayers,
  SPRITE_FRAME_W,
  SPRITE_FRAME_H,
  ANIMATION_ROWS,
  DEFAULT_CHARACTER_CONFIG,
  type CharacterConfig,
} from '@/lib/sprites'

type Props = {
  config?: Partial<CharacterConfig>
}

// We centre based on the first idle_down frame (same as non-animated preview).
const FRAME_SCALE = 3 // lg
const OUT_W = SPRITE_FRAME_W * FRAME_SCALE
const OUT_H = SPRITE_FRAME_H * FRAME_SCALE

async function fetchImageBitmap(url: string): Promise<ImageBitmap> {
  const res = await fetch(url, { mode: 'cors', cache: 'force-cache' })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const blob = await res.blob()
  return await createImageBitmap(blob)
}

function computeOpticalCenterOffsetPx(imgData: ImageData): number {
  const { width, height, data } = imgData
  let minX = width
  let maxX = -1

  // Find bbox of non-transparent pixels.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3]
      if (a > 0) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
      }
    }
  }

  if (maxX < 0) return 0
  const contentCx = (minX + maxX) / 2
  const frameCx = (width - 1) / 2
  return Math.round(frameCx - contentCx)
}

export function OpticallyCenteredAvatarPreview({ config }: Props) {
  const urlMap = useSpriteUrlMap()
  const mergedConfig: CharacterConfig = useMemo(
    () => ({ ...DEFAULT_CHARACTER_CONFIG, ...config }),
    [config],
  )

  const layers = useMemo(() => resolveCharacterLayers(mergedConfig), [mergedConfig])
  const [opticalX, setOpticalX] = useState<number>(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        // Compose the visible frame into a canvas, then measure non-transparent bbox.
        const canvas = document.createElement('canvas')
        canvas.width = OUT_W
        canvas.height = OUT_H
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return

        ctx.clearRect(0, 0, OUT_W, OUT_H)

        const row = ANIMATION_ROWS.idle_down ?? 0
        const srcX = 0
        const srcY = row * SPRITE_FRAME_H

        for (const proxyUrl of layers) {
          const src = urlMap[proxyUrl] ?? proxyUrl
          const bmp = await fetchImageBitmap(src)

          // Draw first frame scaled to lg size.
          ctx.drawImage(
            bmp,
            srcX,
            srcY,
            SPRITE_FRAME_W,
            SPRITE_FRAME_H,
            0,
            0,
            OUT_W,
            OUT_H,
          )
        }

        const imgData = ctx.getImageData(0, 0, OUT_W, OUT_H)
        const offset = computeOpticalCenterOffsetPx(imgData)
        if (!cancelled) setOpticalX(offset)
      } catch {
        if (!cancelled) setOpticalX(0)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [layers, urlMap])

  return <CharacterAvatar config={mergedConfig} variant="preview" opticalCenterX={opticalX} />
}

