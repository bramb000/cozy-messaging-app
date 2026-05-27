'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

type OpticalOffset = { x: number; y: number }

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

function computeOpticalCenterOffset(imgData: ImageData): OpticalOffset {
  const { width, height, data } = imgData
  let minX = width
  let maxX = -1
  let minY = height
  let maxY = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3]
      if (a > 0) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < 0) return { x: 0, y: 0 }

  const contentCx = (minX + maxX) / 2
  const contentCy = (minY + maxY) / 2
  const frameCx = (width - 1) / 2
  const frameCy = (height - 1) / 2

  return {
    x: Math.round(frameCx - contentCx),
    y: Math.round(frameCy - contentCy),
  }
}

async function measureOpticalOffset(
  layers: string[],
  urlMap: Record<string, string>,
): Promise<OpticalOffset> {
  const canvas = document.createElement('canvas')
  canvas.width = OUT_W
  canvas.height = OUT_H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { x: 0, y: 0 }

  ctx.clearRect(0, 0, OUT_W, OUT_H)

  const row = ANIMATION_ROWS.idle_down ?? 0
  const srcY = row * SPRITE_FRAME_H

  for (const proxyUrl of layers) {
    const src = urlMap[proxyUrl] ?? proxyUrl
    const bmp = await fetchImageBitmap(src)
    ctx.drawImage(bmp, 0, srcY, SPRITE_FRAME_W, SPRITE_FRAME_H, 0, 0, OUT_W, OUT_H)
  }

  return computeOpticalCenterOffset(ctx.getImageData(0, 0, OUT_W, OUT_H))
}

export function OpticallyCenteredAvatarPreview({ config }: Props) {
  const urlMap = useSpriteUrlMap()
  const mergedConfig: CharacterConfig = useMemo(
    () => ({ ...DEFAULT_CHARACTER_CONFIG, ...config }),
    [config],
  )

  const layers = useMemo(() => resolveCharacterLayers(mergedConfig), [mergedConfig])
  const layersKey = useMemo(() => layers.join('|'), [layers])

  const requestIdRef = useRef(0)
  const [display, setDisplay] = useState<{ config: CharacterConfig; offset: OpticalOffset }>(() => ({
    config: mergedConfig,
    offset: { x: 0, y: 0 },
  }))

  useEffect(() => {
    const requestId = ++requestIdRef.current
    let cancelled = false

    async function run() {
      try {
        const offset = await measureOpticalOffset(layers, urlMap)
        if (cancelled || requestId !== requestIdRef.current) return
        setDisplay({ config: mergedConfig, offset })
      } catch {
        // Keep the previous frame if measurement fails — avoids snapping to (0,0).
      }
    }

    const debounce = window.setTimeout(run, 48)

    return () => {
      cancelled = true
      window.clearTimeout(debounce)
    }
  }, [layersKey, urlMap, mergedConfig, layers])

  return (
    <CharacterAvatar
      config={display.config}
      variant="preview"
      opticalCenterX={display.offset.x}
      opticalCenterY={display.offset.y}
    />
  )
}
