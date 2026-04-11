'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import type { Profile } from '@/types/database'
import styles from './ProfilePage.module.css'
import PixelButton from '@/components/ui/PixelButton'
import PixelPanel from '@/components/ui/PixelPanel'
import { Stack } from '@/components/ui/Layout/Stack'
import { Box } from '@/components/ui/Layout/Box'
import { Text } from '@/components/ui/Typography/Text'
import { PageContainer } from '@/components/ui/Layout/PageContainer'
import { PageHeader } from '@/components/ui/Layout/PageHeader'
import { PageContent } from '@/components/ui/Layout/PageContent'

export default function ProfilePage() {
  const { user, profile: myProfile, refreshProfile } = useAuth()
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [members, setMembers] = useState<Profile[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (myProfile) setUsername(myProfile.username)
    // Load all members
    supabase.from('profiles').select('*').order('created_at').then(({ data }) => {
      setMembers((data ?? []) as Profile[])
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfile])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError('')

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .neq('id', user.id)
      .maybeSingle()
    if (existing) { setError('Username taken!'); setSaving(false); return }

    let avatarUrl = myProfile?.avatar_url
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      await supabase.storage.from('avatars').upload(`${user.id}.${ext}`, avatarFile, { upsert: true })
      const { data } = supabase.storage.from('avatars').getPublicUrl(`${user.id}.${ext}`)
      avatarUrl = data.publicUrl
    }

    // @ts-expect-error Supabase types misaligned
    await supabase.from('profiles').update({ username: username.trim(), avatar_url: avatarUrl }).eq('id', user.id)
    await refreshProfile()
    setEditing(false)
    setSaving(false)
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  if (!myProfile) return <div className="loading-screen"><div className="pixel-spinner" /></div>

  return (
    <PageContainer>
      <PageHeader title="🪴 Profile" />

      <PageContent centered className={styles.body}>
        {/* My profile card */}
        <PixelPanel variant="standard" className={styles.myCard} style={{ maxWidth: '400px', width: '100%', padding: 'var(--space-6)' }}>
          <div className={styles.avatarWrap}>
            <div className="avatar avatar-md" style={{ margin: '0 auto' }}>
              {(avatarPreview ?? myProfile.avatar_url)
                ? <img src={avatarPreview ?? myProfile.avatar_url!} alt={myProfile.username} />
                : <span>🌱</span>}
            </div>
            {editing && (
              <>
                <PixelButton type="button" variant="secondary" className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
                  Change Photo
                </PixelButton>
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
              </>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave} className={styles.editForm}>
              <div className="form-group">
                <label className="input-label" htmlFor="profile-username">Username</label>
                <input
                  id="profile-username"
                  className="input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  maxLength={20}
                  required
                />
              </div>
              {error && <p className={styles.error}>⚠ {error}</p>}
              <div className={styles.editActions}>
                <PixelButton type="submit" variant="primary" id="save-profile-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </PixelButton>
                <PixelButton type="button" variant="ghost" onClick={() => { setEditing(false); setUsername(myProfile.username); setAvatarFile(null); setAvatarPreview(null) }}>
                  Cancel
                </PixelButton>
              </div>
            </form>
          ) : (
            <div className={styles.viewProfile}>
              <h3 className={styles.profileUsername}>{myProfile.username}</h3>
              <p className={styles.joined}>Member since {new Date(myProfile.created_at!).toLocaleDateString()}</p>
              <PixelButton variant="secondary" id="edit-profile-btn" onClick={() => setEditing(true)}>
                ✏️ Edit Profile
              </PixelButton>
            </div>
          )}
        </PixelPanel>

        {/* Community members */}
        <div className={styles.membersSection}>
          <h3 className={styles.sectionTitle}>Community Members</h3>
          <div className={styles.memberGrid}>
            {members.map(m => (
              <PixelPanel key={m.id} variant="warm" className={styles.memberCard}>
                <Stack direction="row" align="center" gap="space-3">
                  <div className="avatar">
                    {m.avatar_url ? <img src={m.avatar_url} alt={m.username} /> : <span>🌱</span>}
                  </div>
                  <Stack direction="column" gap="space-1" className={styles.memberInfo}>
                    <Text variant="body" color="primary">{m.username}</Text>
                    {m.id === user?.id && <span className={styles.youBadge}>You</span>}
                  </Stack>
                </Stack>
              </PixelPanel>
            ))}
          </div>
        </div>
      </PageContent>
    </PageContainer>
  )
}
