'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import styles from './OnboardingPage.module.css'

const SKIN_TONES = ['#FDBCB4','#F1C27D','#E0AC69','#C68642','#8D5524','#4A2912']
const HAIR_COLORS = ['#4A3728','#2C1810','#8B4513','#D2691E','#F4C430','#FF6B6B','#9B59B6','#2ECC71','#ECF0F1']
const OUTFIT_COLORS = ['#5A7A3A','#8B5E3C','#2C3E7A','#C0392B','#F39C12','#8E44AD','#1ABC9C','#2C3E50']
const HAIR_STYLES = ['Short','Medium','Long','Curly','Braids']
const HATS = ['None','🎩','⛑️','👒','🎓','🪖']

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, refreshProfile } = useAuth()

  const [username, setUsername] = useState('')
  const [skinTone, setSkinTone] = useState(SKIN_TONES[0])
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0])
  const [hairStyle, setHairStyle] = useState(0)
  const [outfitColor, setOutfitColor] = useState(OUTFIT_COLORS[0])
  const [pantsColor, setPantsColor] = useState(OUTFIT_COLORS[1])
  const [hatIndex, setHatIndex] = useState(0)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)

    // Check username unique
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .neq('id', user.id)
      .single()

    if (existing) {
      setError('That username is already taken!')
      setLoading(false)
      return
    }

    // Upload avatar if provided
    let avatarUrl: string | null = null
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${user.id}.${ext}`, avatarFile, { upsert: true })
      if (!uploadError) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(`${user.id}.${ext}`)
        avatarUrl = data.publicUrl
      }
    }

    const characterConfig = { skinTone, hairColor, hairStyle, outfitColor, pantsColor, hatIndex }

    const { error: profileError } = await supabase
      .from('profiles')
      // @ts-expect-error Supabase types misaligned
      .update({ username: username.trim(), avatar_url: avatarUrl, character_config: characterConfig })
      .eq('id', user.id)

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    await refreshProfile()
    router.push('/chat')
  }

  return (
    <div className={styles.container}>
      <div className={`pixel-panel ${styles.card}`}>
        <div className={styles.header}>
          <span className={styles.icon}>🌱</span>
          <h1>Create Your Character</h1>
          <p className={styles.sub}>Set up your profile before entering the world</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Username */}
          <div className="form-group">
            <label className="input-label" htmlFor="username">Choose a Username</label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="YourName"
              maxLength={20}
              required
            />
          </div>

          {/* Avatar upload */}
          <div className={styles.section}>
            <label className="input-label">Profile Picture (optional)</label>
            <div className={styles.avatarRow}>
              <div className={`avatar avatar-lg ${styles.avatarPreview}`}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="preview" />
                  : <span>🌱</span>}
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
                Upload Image
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
            </div>
          </div>

          {/* Character customisation */}
          <div className={styles.section}>
            <label className="input-label">Character</label>
            <div className={styles.charPreview}>
              <CharacterPreview skinTone={skinTone} hairColor={hairColor} hairStyle={hairStyle} outfitColor={outfitColor} pantsColor={pantsColor} hatIndex={hatIndex} />
            </div>

            <div className={styles.swatchRow}>
              <span className={styles.swatchLabel}>Skin</span>
              {SKIN_TONES.map(c => (
                <button key={c} type="button" title={c}
                  className={`${styles.swatch} ${skinTone === c ? styles.swatchActive : ''}`}
                  style={{ background: c }} onClick={() => setSkinTone(c)} />
              ))}
            </div>

            <div className={styles.swatchRow}>
              <span className={styles.swatchLabel}>Hair</span>
              {HAIR_COLORS.map(c => (
                <button key={c} type="button" title={c}
                  className={`${styles.swatch} ${hairColor === c ? styles.swatchActive : ''}`}
                  style={{ background: c }} onClick={() => setHairColor(c)} />
              ))}
            </div>

            <div className={styles.swatchRow}>
              <span className={styles.swatchLabel}>Style</span>
              {HAIR_STYLES.map((s, i) => (
                <button key={s} type="button"
                  className={`btn btn-ghost ${styles.tagBtn} ${hairStyle === i ? styles.tagActive : ''}`}
                  onClick={() => setHairStyle(i)}>{s}</button>
              ))}
            </div>

            <div className={styles.swatchRow}>
              <span className={styles.swatchLabel}>Shirt</span>
              {OUTFIT_COLORS.map(c => (
                <button key={c} type="button" title={c}
                  className={`${styles.swatch} ${outfitColor === c ? styles.swatchActive : ''}`}
                  style={{ background: c }} onClick={() => setOutfitColor(c)} />
              ))}
            </div>

            <div className={styles.swatchRow}>
              <span className={styles.swatchLabel}>Pants</span>
              {OUTFIT_COLORS.map(c => (
                <button key={c} type="button" title={c}
                  className={`${styles.swatch} ${pantsColor === c ? styles.swatchActive : ''}`}
                  style={{ background: c }} onClick={() => setPantsColor(c)} />
              ))}
            </div>

            <div className={styles.swatchRow}>
              <span className={styles.swatchLabel}>Hat</span>
              {HATS.map((h, i) => (
                <button key={i} type="button"
                  className={`btn btn-ghost ${styles.tagBtn} ${hatIndex === i ? styles.tagActive : ''}`}
                  onClick={() => setHatIndex(i)}>{h}</button>
              ))}
            </div>
          </div>

          {error && <p className={styles.error}>⚠ {error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading} id="create-character-btn">
            {loading ? 'Saving...' : 'Enter the World →'}
          </button>
        </form>
      </div>
    </div>
  )
}

function CharacterPreview({ skinTone, hairColor, hairStyle, outfitColor, pantsColor, hatIndex }: {
  skinTone: string; hairColor: string; hairStyle: number
  outfitColor: string; pantsColor: string; hatIndex: number
}) {
  const hat = ['','🎩','⛑️','👒','🎓','🪖'][hatIndex] || ''
  return (
    <canvas
      width={48} height={64}
      ref={canvas => {
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0,0,48,64)
        // Pants
        ctx.fillStyle = pantsColor
        ctx.fillRect(14, 42, 9, 18)
        ctx.fillRect(25, 42, 9, 18)
        // Shirt/body
        ctx.fillStyle = outfitColor
        ctx.fillRect(12, 26, 24, 18)
        // Arms
        ctx.fillStyle = skinTone
        ctx.fillRect(6, 28, 6, 14)
        ctx.fillRect(36, 28, 6, 14)
        // Head
        ctx.fillStyle = skinTone
        ctx.fillRect(14, 8, 20, 20)
        // Hair
        ctx.fillStyle = hairColor
        if (hairStyle === 0) { ctx.fillRect(14,8,20,6) } // short
        else if (hairStyle === 1) { ctx.fillRect(12,8,24,8) } // medium
        else if (hairStyle === 2) { ctx.fillRect(10,8,28,10); ctx.fillRect(10,18,4,12); ctx.fillRect(34,18,4,12) } // long
        else if (hairStyle === 3) { ctx.fillRect(12,6,24,10); ctx.fillRect(10,12,6,8); ctx.fillRect(32,12,6,8) } // curly
        else { ctx.fillRect(14,8,4,22); ctx.fillRect(30,8,4,22) } // braids
        // Eyes
        ctx.fillStyle = '#2C1810'
        ctx.fillRect(17,16,4,3); ctx.fillRect(27,16,4,3)
        // Hat
        if (hat) {
          ctx.font = '14px serif'
          ctx.fillText(hat, 13, 10)
        }
      }}
      style={{ imageRendering: 'pixelated', width: 96, height: 128 }}
    />
  )
}
