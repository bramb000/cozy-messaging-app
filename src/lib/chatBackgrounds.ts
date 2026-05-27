/**
 * Chat panel ocean backgrounds — assets live in /public/Chat Background/.
 *
 * Per scene folder: images are numbered 1…N serially.
 * - N (last) is a reference sheet — never rendered.
 * - 1–2 are fixed layers (sky, ground).
 * - 3…N−1 sway gently left/right (except Ocean_7 — all rocks, fully static).
 */

/** Scenes where middle layers are fixed (no horizontal sway). */
const STATIC_MIDDLE_SCENES = new Set<ChatBackgroundId>(['Ocean_7'])

export const DEFAULT_CHAT_BACKGROUND = 'Ocean_1' as const

export type ChatBackgroundId =
  | 'Ocean_1'
  | 'Ocean_2'
  | 'Ocean_3'
  | 'Ocean_4'
  | 'Ocean_5'
  | 'Ocean_6'
  | 'Ocean_7'
  | 'Ocean_8'

export const CHAT_BACKGROUND_SCENES: { id: ChatBackgroundId; label: string }[] = [
  { id: 'Ocean_1', label: 'Ocean 1' },
  { id: 'Ocean_2', label: 'Ocean 2' },
  { id: 'Ocean_3', label: 'Ocean 3' },
  { id: 'Ocean_4', label: 'Ocean 4' },
  { id: 'Ocean_5', label: 'Ocean 5' },
  { id: 'Ocean_6', label: 'Ocean 6' },
  { id: 'Ocean_7', label: 'Ocean 7' },
  { id: 'Ocean_8', label: 'Ocean 8' },
]

const CHAT_BG_BASE = '/Chat Background'

/** Layer indices present per folder (last entry is the reference sheet). */
const SCENE_LAYER_INDICES: Record<ChatBackgroundId, number[]> = {
  Ocean_1: [1, 2, 3, 4],
  Ocean_2: [2, 3, 4, 5],
  Ocean_3: [1, 2, 3, 4, 5],
  Ocean_4: [1, 2, 3, 4, 5],
  Ocean_5: [1, 2, 3, 4, 5],
  Ocean_6: [1, 2, 3, 4, 5],
  Ocean_7: [1, 2, 3, 4, 5, 6],
  Ocean_8: [1, 2, 3, 4, 5, 6],
}

const VALID_IDS = new Set<string>(CHAT_BACKGROUND_SCENES.map(s => s.id))

export function resolveChatBackground(stored: string | null | undefined): ChatBackgroundId {
  if (stored && VALID_IDS.has(stored)) return stored as ChatBackgroundId
  return DEFAULT_CHAT_BACKGROUND
}

function layerUrl(sceneId: ChatBackgroundId, index: number): string {
  return `${CHAT_BG_BASE}/${sceneId}/${index}.png`
}

export interface ChatSceneLayers {
  sky: string
  ground: string
  middle: string[]
  animateMiddle: boolean
}

export function getChatSceneLayers(sceneId: ChatBackgroundId): ChatSceneLayers {
  const indices = SCENE_LAYER_INDICES[sceneId]
  const used = indices.slice(0, -1)
  const [skyIndex, groundIndex, ...middleIndices] = used
  return {
    sky: layerUrl(sceneId, skyIndex),
    ground: layerUrl(sceneId, groundIndex),
    middle: middleIndices.map(i => layerUrl(sceneId, i)),
    animateMiddle: !STATIC_MIDDLE_SCENES.has(sceneId),
  }
}
