/**
 * sprites.ts — Single Source of Truth for all sprite assets.
 *
 * To add a new sprite: add one entry to the relevant array below.
 * The CharacterSprite component and Profile customizer pick up changes automatically.
 *
 * IMPORTANT: All paths are served through /api/sprites/... (authenticated, protected).
 * Never use /public paths for character art.
 */

const BASE = '/api/sprites'

// ─── BASE BODY ──────────────────────────────────────────────────────────────
export const PLAYER_BASE = `${BASE}/Player/Player_Base/Player_Base_animations.png`

// Sprite sheet layout for Player_Base_animations.png
// Total: 576 × 3584px | Frame: 48 × 64px | 12 frames/row | 56 rows
export const SPRITE_FRAME_W = 48
export const SPRITE_FRAME_H = 64
export const SPRITE_COLS = 12 // frames per animation row

// Which row index (0-based) corresponds to which animation
export const ANIMATION_ROWS: Record<string, number> = {
  idle_down:  0,
  walk_down:  1,
  walk_left:  5,
  walk_right: 9,
  walk_up:    13,
}

// ─── HAIR ───────────────────────────────────────────────────────────────────
export const HAIR_COLORS = ['Black', 'Blonde', 'Brown', 'Ginger', 'Grey'] as const
export type HairColor = typeof HAIR_COLORS[number]

export const HAIR_STYLES = [
  { id: 'Hair_1', label: 'Short' },
  { id: 'Hair_2', label: 'Wavy' },
  { id: 'Hair_3', label: 'Medium' },
  { id: 'Hair_4', label: 'Long' },
  { id: 'Hair_5', label: 'Ponytail' },
  { id: 'Hair_6', label: 'Wild' },
] as const
export type HairStyleId = typeof HAIR_STYLES[number]['id']

// ─── TOPS ────────────────────────────────────────────────────────────────────
export const TOP_STYLES = [
  {
    id: 'Farmer_Shirt', label: 'Farmer',
    colors: ['Black', 'Blue', 'Green', 'Orange', 'Pink', 'Purple', 'Red', 'White_and_Brown'],
    filePrefix: 'Farmer_Shirt_1',
  },
  {
    id: 'Lumberjack_Shirt', label: 'Lumberjack',
    colors: ['Black', 'Blue', 'Brown', 'Green', 'Orange', 'Pink', 'Purple', 'Red', 'White'],
    filePrefix: 'Lumberjack_Shirt_1',
  },
  {
    id: 'OG_Shirt', label: 'Classic',
    colors: ['Black', 'Blue', 'Brown', 'Green', 'Orange', 'Pink', 'Purple', 'Red'],
    filePrefix: 'Shirt_1',
  },
  {
    id: 'Royal_Shirt', label: 'Royal',
    colors: ['Black', 'Blue', 'Green', 'Orange', 'Purple', 'Red', 'White'],
    filePrefix: 'Royal_Shirt_1',
  },
  {
    id: 'Plate_Chest', label: 'Plate Armour',
    colors: ['Blue', 'Bronze', 'Gold', 'Green', 'Iron', 'Orange', 'Purple', 'Red'],
    filePrefix: 'Plate_Chest',
  },
] as const
export type TopStyleId = typeof TOP_STYLES[number]['id']

// ─── BOTTOMS ─────────────────────────────────────────────────────────────────
export const BOTTOM_STYLES = [
  {
    id: 'Farmer_Pants', label: 'Farmer',
    colors: ['Black', 'Blue', 'Green', 'Orange', 'Pink', 'Purple', 'Red', 'White_and_Brown'],
    filePrefix: 'Farmer_Pants_1',
  },
  {
    id: 'OG_Pants', label: 'Classic',
    colors: ['Black', 'Blue', 'Brown', 'Green', 'Orange', 'Pink', 'Purple', 'Red'],
    filePrefix: 'Pants_1',
  },
  {
    id: 'Royal_Pants', label: 'Royal',
    colors: ['Black', 'Blue', 'Green', 'Orange', 'Purple', 'Red', 'White'],
    filePrefix: 'Royal_Pants_1',
  },
  {
    id: 'Plate_Legs', label: 'Plate Armour',
    colors: ['Blue', 'Bronze', 'Gold', 'Green', 'Iron', 'Orange', 'Purple', 'Red'],
    filePrefix: 'Plate_Legs',
  },
] as const
export type BottomStyleId = typeof BOTTOM_STYLES[number]['id']

// ─── SHOES ───────────────────────────────────────────────────────────────────
export const SHOE_COLORS = [
  'Black', 'Blue', 'Brown', 'Green', 'Orange', 'Pink', 'Purple', 'Red', 'White',
] as const
export type ShoeColor = typeof SHOE_COLORS[number]

// ─── HATS / HELMETS ──────────────────────────────────────────────────────────
export const HAT_STYLES = [
  { id: null, label: 'None', src: null },
  { id: 'Farmer_Hat_1', label: 'Farmer Hat', src: `${BASE}/Player/Accessories/Farmer_Hat_1.png`, colors: null },
] as const

export const HELMET_STYLES = [
  { id: null, label: 'None', colors: [] },
  { id: 'Plate_Helmet_1', label: 'Plate I', colors: ['Blue', 'Bronze', 'Gold', 'Green', 'Iron', 'Orange', 'Purple', 'Red'] },
  { id: 'Plate_Helmet_2', label: 'Plate II', colors: ['Blue', 'Bronze', 'Gold', 'Green', 'Iron', 'Orange', 'Purple', 'Red'] },
] as const

// ─── CHARACTER CONFIG SCHEMA ──────────────────────────────────────────────────
export interface CharacterConfig {
  hairStyle: string
  hairColor: string
  topStyle: string
  topColor: string
  bottomStyle: string
  bottomColor: string
  shoeColor: string
  hatStyle: string | null
  helmetStyle: string | null
  helmetColor: string | null
}

export const DEFAULT_CHARACTER_CONFIG: CharacterConfig = {
  hairStyle: 'Hair_1',
  hairColor: 'Brown',
  topStyle: 'Farmer_Shirt',
  topColor: 'Green',
  bottomStyle: 'Farmer_Pants',
  bottomColor: 'Blue',
  shoeColor: 'Brown',
  hatStyle: null,
  helmetStyle: null,
  helmetColor: null,
}

// ─── PATH RESOLVER ────────────────────────────────────────────────────────────
/**
 * Given a character config, returns all sprite layer src paths in render order.
 * Each layer is an absolutely positioned image stacked on top of the previous.
 */
export function resolveCharacterLayers(config: CharacterConfig): string[] {
  const layers: string[] = []

  // 1. Base body (always)
  layers.push(PLAYER_BASE)

  // 2. Top (shirt/chest)
  const topStyle = TOP_STYLES.find(t => t.id === config.topStyle)
  if (topStyle) {
    layers.push(`${BASE}/Player/Chest/${config.topStyle}/${topStyle.filePrefix}_${config.topColor}.png`)
  }

  // 3. Bottom (pants/legs)
  const bottomStyle = BOTTOM_STYLES.find(b => b.id === config.bottomStyle)
  if (bottomStyle) {
    layers.push(`${BASE}/Player/Legs/${config.bottomStyle}/${bottomStyle.filePrefix}_${config.bottomColor}.png`)
  }

  // 4. Shoes
  layers.push(`${BASE}/Player/Feet/Shoes_1_${config.shoeColor}.png`)

  // 5. Hands (bare)
  layers.push(`${BASE}/Player/Hands/Hands_1_Bare.png`)

  // 6. Hair (skip if wearing helmet)
  if (!config.helmetStyle) {
    layers.push(`${BASE}/Player/Head/${config.hairStyle}/${config.hairStyle}_${config.hairColor}.png`)
  }

  // 7. Hat (if set, no helmet takes priority)
  if (config.hatStyle && !config.helmetStyle) {
    const hat = HAT_STYLES.find(h => h.id === config.hatStyle)
    if (hat?.src) layers.push(hat.src)
  }

  // 8. Helmet (overrides hair and hat)
  if (config.helmetStyle && config.helmetColor) {
    layers.push(`${BASE}/Player/Head/${config.helmetStyle}/${config.helmetStyle}_${config.helmetColor}.png`)
  }

  return layers
}
