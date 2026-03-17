'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import styles from './CharacterCustomizer.module.css'
import { PhysicalCard } from '../ui/PhysicalCard'
import { TactileButton } from '../ui/TactileButton'
import { RevealText } from '../ui/RevealText'

const SKIN_TONES = ['#FDBCB4','#F1C27D','#E0AC69','#C68642','#8D5524','#4A2912']
const HAIR_COLORS = ['#4A3728','#2C1810','#8B4513','#D2691E','#F4C430','#FF6B6B','#9B59B6','#2ECC71','#ECF0F1']
const OUTFIT_COLORS = ['#5A7A3A','#8B5E3C','#2C3E7A','#C0392B','#F39C12','#8E44AD','#1ABC9C','#2C3E50']
const HAIR_STYLES = ['Short','Medium','Long','Curly','Braids']
const HATS = ['None','🎩','⛑️','👒','🎓','🪖']

interface CharacterCustomizerProps {
  initialData?: any
  onComplete?: () => void
  buttonText?: string
}

export default function CharacterCustomizer({ initialData, onComplete, buttonText = 'Save Character' }: CharacterCustomizerProps) {
  const supabase = createClient()
  const { user, refreshProfile } = useAuth()

  const [username, setUsername] = useState(initialData?.username || '')
  const [skinTone, setSkinTone] = useState(initialData?.character_config?.skinTone || SKIN_TONES[0])
  const [hairColor, setHairColor] = useState(initialData?.character_config?.hairColor || HAIR_COLORS[0])
  const [hairStyle, setHairStyle] = useState(initialData?.character_config?.hairStyle || 0)
  const [outfitColor, setOutfitColor] = useState(initialData?.character_config?.outfitColor || OUTFIT_COLORS[0])
  const [pantsColor, setPantsColor] = useState(initialData?.character_config?.pantsColor || OUTFIT_COLORS[1])
  const [hatIndex, setHatIndex] = useState(initialData?.character_config?.hatIndex || 0)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatar_url || null)
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

    // Check username unique if it changed
    if (username.trim() !== initialData?.username) {
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
    }

    // Upload avatar if provided
    let avatarUrl: string | null = avatarPreview
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${user.id}.${Date.now()}.${ext}`, avatarFile, { upsert: true })
      if (!uploadError) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(`${user.id}.${Date.now()}.${ext}`)
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
    setLoading(false)
    if (onComplete) onComplete()
  }

  return (
    <PhysicalCard variant="parchment" animateEntrance={true}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <RevealText text="Character Profile" className="input-label" speed={0.05} />
        </div>

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
          <TactileButton type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
            Upload Image
          </TactileButton>
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
            <TactileButton key={s} type="button" variant="ghost"
              className={`${styles.tagBtn} ${hairStyle === i ? styles.tagActive : ''}`}
              onClick={() => setHairStyle(i)}>{s}</TactileButton>
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
            <TactileButton key={i} type="button" variant="ghost"
              className={`${styles.tagBtn} ${hatIndex === i ? styles.tagActive : ''}`}
              onClick={() => setHatIndex(i)}>{h}</TactileButton>
          ))}
        </div>
      </div>

      {error && <p className={styles.error}>⚠ {error}</p>}

      <TactileButton type="submit" variant="primary" fullWidth disabled={loading} id="save-character-btn">
        {loading ? 'Saving...' : buttonText}
      </TactileButton>
    </form>
  </PhysicalCard>
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
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0,0,48,64)
        
        // Pants
        ctx.fillStyle = pantsColor
        ctx.fillRect(14, 42, 9, 18)
        ctx.fillRect(25, 42, 9, 18)
        // Pants Shading
        ctx.fillStyle = 'rgba(0,0,0,0.1)'
        ctx.fillRect(14, 55, 9, 5)
        ctx.fillRect(25, 55, 9, 5)

        // Shirt
        ctx.fillStyle = outfitColor
        ctx.fillRect(12, 26, 24, 18)
        // Shirt Shading
        ctx.fillStyle = 'rgba(0,0,0,0.1)'
        ctx.fillRect(12, 40, 24, 4)

        // Arms
        ctx.fillStyle = skinTone
        ctx.fillRect(6, 28, 6, 14)
        ctx.fillRect(36, 28, 6, 14)

        // Head
        ctx.fillStyle = skinTone
        ctx.fillRect(14, 8, 20, 20)
        
        // Face (Blush)
        ctx.fillStyle = 'rgba(255,0,0,0.1)'
        ctx.fillRect(17, 21, 4, 2)
        ctx.fillRect(27, 21, 4, 2)

        // Hair
        ctx.fillStyle = hairColor
        if (hairStyle === 0) { // Short
          ctx.fillRect(14, 8, 20, 6)
          ctx.fillRect(12, 12, 2, 4)
          ctx.fillRect(34, 12, 2, 4)
        } 
        else if (hairStyle === 1) { // Medium
          ctx.fillRect(12, 8, 24, 8)
          ctx.fillRect(12, 16, 4, 6)
          ctx.fillRect(32, 16, 4, 6)
        } 
        else if (hairStyle === 2) { // Long
          ctx.fillRect(10, 8, 28, 10)
          ctx.fillRect(10, 18, 4, 18)
          ctx.fillRect(34, 18, 4, 18)
        } 
        else if (hairStyle === 3) { // Curly
          ctx.fillRect(12, 6, 24, 10)
          ctx.fillRect(10, 12, 6, 12)
          ctx.fillRect(32, 12, 6, 12)
          ctx.fillRect(14, 4, 20, 2)
        } 
        else { // Braids
          ctx.fillRect(14, 8, 20, 6)
          ctx.fillRect(14, 14, 4, 28)
          ctx.fillRect(30, 14, 4, 28)
        } 

        // Eyes
        ctx.fillStyle = '#2C1810'
        ctx.fillRect(18, 17, 3, 3)
        ctx.fillRect(27, 17, 3, 3)

        // Hat
        if (hat) {
          ctx.font = '18px serif'
          ctx.textAlign = 'center'
          ctx.fillText(hat, 24, 12)
        }
      }}
      style={{ imageRendering: 'pixelated', width: 96, height: 128 }}
    />
  )
}
