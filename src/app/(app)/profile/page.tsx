'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import styles from './ProfilePage.module.css'
import { CharacterSprite } from '@/components/character/CharacterSprite'
import {
  HAIR_STYLES, HAIR_COLORS,
  TOP_STYLES, BOTTOM_STYLES, SHOE_COLORS,
  DEFAULT_CHARACTER_CONFIG,
  type CharacterConfig,
} from '@/lib/sprites'
import {
  CHAT_BACKGROUND_SCENES,
  DEFAULT_CHAT_BACKGROUND,
  resolveChatBackground,
  type ChatBackgroundId,
} from '@/lib/chatBackgrounds'

type TabId = 'hair' | 'top' | 'bottom' | 'shoes' | 'hat'
const TABS: { id: TabId; label: string }[] = [
  { id: 'hair',   label: 'Hair'   },
  { id: 'top',    label: 'Top'    },
  { id: 'bottom', label: 'Bottom' },
  { id: 'shoes',  label: 'Shoes'  },
  { id: 'hat',    label: 'Hat'    },
]

const HEADWEAR_STYLES = [
  { id: null, type: 'none' as const, label: 'None', colors: null },
  { id: 'Farmer_Hat_1', type: 'hat' as const, label: 'Farmer Hat', colors: null },
  { id: 'Plate_Helmet_1', type: 'helmet' as const, label: 'Plate I', colors: ['Blue', 'Bronze', 'Gold', 'Green', 'Iron', 'Orange', 'Purple', 'Red'] },
  { id: 'Plate_Helmet_2', type: 'helmet' as const, label: 'Plate II', colors: ['Blue', 'Bronze', 'Gold', 'Green', 'Iron', 'Orange', 'Purple', 'Red'] },
]

export default function ProfilePage() {
  const { user, profile: myProfile, refreshProfile } = useAuth()
  const supabase = createClient()

  const [username, setUsername]     = useState('')
  const [config, setConfig]         = useState<CharacterConfig>(DEFAULT_CHARACTER_CONFIG)
  const [chatBackground, setChatBackground] = useState<ChatBackgroundId>(DEFAULT_CHAT_BACKGROUND)
  const [activeTab, setActiveTab]   = useState<TabId>('hair')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [saved, setSaved]           = useState(false)

  useEffect(() => {
    if (!myProfile) return
    const timer = setTimeout(() => {
      setUsername(myProfile.username)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cc = (myProfile as any).character_config
      if (cc) setConfig({ ...DEFAULT_CHARACTER_CONFIG, ...cc })
      setChatBackground(resolveChatBackground(myProfile.chat_background))
    }, 0);
    return () => clearTimeout(timer);
  }, [myProfile])

  function set<K extends keyof CharacterConfig>(key: K, value: CharacterConfig[K]) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const activeHeadwear = config.helmetStyle
    ? HEADWEAR_STYLES.find(h => h.id === config.helmetStyle)
    : config.hatStyle
    ? HEADWEAR_STYLES.find(h => h.id === config.hatStyle)
    : HEADWEAR_STYLES[0]

  function handleSelectHeadwear(h: typeof HEADWEAR_STYLES[number]) {
    if (h.type === 'none') {
      setConfig(prev => ({
        ...prev,
        hatStyle: null,
        helmetStyle: null,
      }))
    } else if (h.type === 'hat') {
      setConfig(prev => ({
        ...prev,
        hatStyle: h.id,
        helmetStyle: null,
      }))
    } else if (h.type === 'helmet') {
      setConfig(prev => ({
        ...prev,
        hatStyle: null,
        helmetStyle: h.id,
        helmetColor: prev.helmetColor || (h.colors ? h.colors[0] : null),
      }))
    }
  }

  async function handleSave() {
    if (!user) return
    setSaving(true); setError(''); setSaved(false)

    // Check username uniqueness
    const { data: existing } = await supabase
      .from('profiles').select('id')
      .eq('username', username.trim()).neq('id', user.id).maybeSingle()
    if (existing) { setError('Username already taken!'); setSaving(false); return }

    // @ts-expect-error Supabase types misaligned
    await supabase.from('profiles').update({
      username: username.trim(),
      character_config: config,
      chat_background: chatBackground,
    }).eq('id', user.id)

    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!myProfile) return <div className="loading-screen"><div className="pixel-spinner" /></div>

  // Resolve available styles/colors for the current tab
  const currentTop    = TOP_STYLES.find(t => t.id === config.topStyle)
  const currentBottom = BOTTOM_STYLES.find(b => b.id === config.bottomStyle)

  return (
    <div className={styles.page}>
      {/* ── Left: Character Preview ──────────────────── */}
      <div className={styles.previewPanel}>
        <div className={styles.spriteStage}>
          <CharacterSprite config={config} size="lg" animated={false} />
        </div>
        <div className={styles.previewName}>{username || myProfile.username}</div>
      </div>

      {/* ── Right: Customizer ───────────────────────── */}
      <div className={styles.customizerPanel}>
        {/* Username */}
        <div className={styles.usernameRow}>
          <label className="input-label" htmlFor="profile-username">Username</label>
          <div className={styles.usernameInputRow}>
            <input
              id="profile-username"
              className={`input ${styles.usernameInput}`}
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={20}
              placeholder="YourName"
            />
            <button
              className={`btn btn-primary ${styles.saveBtn}`}
              id="save-profile-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '...' : saved ? '✓ Saved' : 'Save'}
            </button>
          </div>
          {error && <p className={styles.error}>⚠ {error}</p>}
        </div>

        {/* Chat background */}
        <div className={styles.sectionHeading}>Chat background</div>
        <div className={styles.chatBgSection}>
          <div className={styles.optionLabel}>Scene</div>
          <div className={styles.optionGrid}>
            {CHAT_BACKGROUND_SCENES.map(scene => (
              <button
                key={scene.id}
                className={`${styles.optionChip} ${chatBackground === scene.id ? styles.optionActive : ''}`}
                onClick={() => setChatBackground(scene.id)}
                type="button"
              >
                {scene.label}
              </button>
            ))}
          </div>
        </div>

        {/* Appearance heading */}
        <div className={styles.sectionHeading}>Appearance</div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.id)}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className={styles.tabBody}>
          {/* ── HAIR ── */}
          {activeTab === 'hair' && (
            <>
              <div className={styles.optionLabel}>Style</div>
              <div className={styles.optionGrid}>
                {HAIR_STYLES.map(h => (
                  <button
                    key={h.id}
                    className={`${styles.optionChip} ${config.hairStyle === h.id ? styles.optionActive : ''}`}
                    onClick={() => set('hairStyle', h.id)}
                    type="button"
                  >
                    {h.label}
                  </button>
                ))}
              </div>
              <div className={styles.optionLabel}>Colour</div>
              <div className={styles.colorRow}>
                {HAIR_COLORS.map(c => (
                  <button
                    key={c}
                    className={`${styles.colorSwatch} ${config.hairColor === c ? styles.swatchActive : ''}`}
                    title={c}
                    style={{ background: colorHex(c, 'hair') }}
                    onClick={() => set('hairColor', c)}
                    type="button"
                  />
                ))}
              </div>
            </>
          )}

          {/* ── TOP ── */}
          {activeTab === 'top' && (
            <>
              <div className={styles.optionLabel}>Style</div>
              <div className={styles.optionGrid}>
                {TOP_STYLES.map(t => (
                  <button
                    key={t.id}
                    className={`${styles.optionChip} ${config.topStyle === t.id ? styles.optionActive : ''}`}
                    onClick={() => set('topStyle', t.id)}
                    type="button"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className={styles.optionLabel}>Colour</div>
              <div className={styles.colorRow}>
                {(currentTop?.colors ?? []).map(c => (
                  <button
                    key={c}
                    className={`${styles.colorSwatch} ${config.topColor === c ? styles.swatchActive : ''}`}
                    title={c}
                    style={{ background: colorHex(c, 'outfit') }}
                    onClick={() => set('topColor', c)}
                    type="button"
                  />
                ))}
              </div>
            </>
          )}

          {/* ── BOTTOM ── */}
          {activeTab === 'bottom' && (
            <>
              <div className={styles.optionLabel}>Style</div>
              <div className={styles.optionGrid}>
                {BOTTOM_STYLES.map(b => (
                  <button
                    key={b.id}
                    className={`${styles.optionChip} ${config.bottomStyle === b.id ? styles.optionActive : ''}`}
                    onClick={() => set('bottomStyle', b.id)}
                    type="button"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <div className={styles.optionLabel}>Colour</div>
              <div className={styles.colorRow}>
                {(currentBottom?.colors ?? []).map(c => (
                  <button
                    key={c}
                    className={`${styles.colorSwatch} ${config.bottomColor === c ? styles.swatchActive : ''}`}
                    title={c}
                    style={{ background: colorHex(c, 'outfit') }}
                    onClick={() => set('bottomColor', c)}
                    type="button"
                  />
                ))}
              </div>
            </>
          )}

          {/* ── SHOES ── */}
          {activeTab === 'shoes' && (
            <>
              <div className={styles.optionLabel}>Colour</div>
              <div className={styles.colorRow}>
                {SHOE_COLORS.map(c => (
                  <button
                    key={c}
                    className={`${styles.colorSwatch} ${config.shoeColor === c ? styles.swatchActive : ''}`}
                    title={c}
                    style={{ background: colorHex(c, 'shoe') }}
                    onClick={() => set('shoeColor', c)}
                    type="button"
                  />
                ))}
              </div>
            </>
          )}

          {/* ── HAT ── */}
          {activeTab === 'hat' && (
            <>
              <div className={styles.optionLabel}>Style</div>
              <div className={styles.optionGrid}>
                {HEADWEAR_STYLES.map(h => (
                  <button
                    key={h.id ?? 'none'}
                    className={`${styles.optionChip} ${
                      (h.type === 'none' && !config.hatStyle && !config.helmetStyle) ||
                      (h.type === 'hat' && config.hatStyle === h.id) ||
                      (h.type === 'helmet' && config.helmetStyle === h.id)
                        ? styles.optionActive
                        : ''
                    }`}
                    onClick={() => handleSelectHeadwear(h)}
                    type="button"
                  >
                    {h.label}
                  </button>
                ))}
              </div>
              {activeHeadwear?.type === 'helmet' && activeHeadwear.colors && (
                <>
                  <div className={styles.optionLabel}>Colour</div>
                  <div className={styles.colorRow}>
                    {activeHeadwear.colors.map(c => (
                      <button
                        key={c}
                        className={`${styles.colorSwatch} ${config.helmetColor === c ? styles.swatchActive : ''}`}
                        title={c}
                        style={{ background: colorHex(c, 'outfit') }}
                        onClick={() => set('helmetColor', c)}
                        type="button"
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Save Appearance */}
        <div className={styles.saveRow}>
          <button
            className="btn btn-primary btn-full"
            id="save-appearance-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : saved ? '✓ Appearance Saved!' : 'Save Appearance'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Approximate hex values for display swatches based on the color name
const HAIR_HEX: Record<string, string> = {
  Black: '#1a1a1a', Blonde: '#f4d03f', Brown: '#7b5234', Ginger: '#c0392b', Grey: '#aab7b8',
}
const OUTFIT_HEX: Record<string, string> = {
  Black: '#2d2d2d', Blue: '#2e86c1', Brown: '#784212', Green: '#27ae60',
  Orange: '#e67e22', Pink: '#e91e8c', Purple: '#7d3c98', Red: '#c0392b',
  White: '#f0f0f0', White_and_Brown: '#d5c5a1', Bronze: '#a87c4f',
  Gold: '#d4af37', Iron: '#8d8d8d',
}
const SHOE_HEX: Record<string, string> = {
  Black: '#1a1a1a', Blue: '#2e86c1', Brown: '#7b5234', Green: '#27ae60',
  Orange: '#e67e22', Pink: '#e91e8c', Purple: '#7d3c98', Red: '#c0392b', White: '#f0f0f0',
}

function colorHex(name: string, type: 'hair' | 'outfit' | 'shoe'): string {
  if (type === 'hair')   return HAIR_HEX[name]   ?? '#888'
  if (type === 'shoe')   return SHOE_HEX[name]   ?? '#888'
  return OUTFIT_HEX[name] ?? '#888'
}
