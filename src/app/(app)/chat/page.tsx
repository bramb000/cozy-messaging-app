'use client'
import React, { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import type { MessageWithProfile } from '@/types/database'
import styles from './ChatPage.module.css'
import PixelEmojiPicker from '@/components/ui/PixelEmojiPicker'
import PixelButton from '@/components/ui/PixelButton'
import { CharacterSprite } from '@/components/character/CharacterSprite'
import { parseEmojisToHtml } from '@/utils/emojiParser'

export default function ChatPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [messages, setMessages] = useState<MessageWithProfile[]>([])
  const [loading, setLoading]   = useState(true)
  const [showEmoji, setShowEmoji] = useState(false)
  const [lastReadTs, setLastReadTs] = useState<Date | null>(null)
  const [mounted, setMounted]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  async function fetchMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: true })
      .limit(100)
    if (!error) {
      setMessages((data as MessageWithProfile[]) ?? [])
      setLastReadTs(new Date())
    }
    setLoading(false)
    scrollToBottom()
  }

  async function sendMessage() {
    if (!editorRef.current || !user) return
    const content = editorRef.current.innerHTML.trim()
    if (!content || content === '<br>') return
    editorRef.current.innerHTML = ''
    // @ts-expect-error Supabase types misaligned
    await supabase.from('messages').insert({ user_id: user.id, content })
  }

  function scrollToBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); return }
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase()
      if (key === 'b') { e.preventDefault(); document.execCommand('bold', false) }
      if (key === 'i') { e.preventDefault(); document.execCommand('italic', false) }
      if (key === 'u') { e.preventDefault(); document.execCommand('underline', false) }
    }
  }

  function handleInput(e: React.FormEvent<HTMLDivElement>) {
    const el = e.currentTarget
    let html = el.innerHTML
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    if (html !== el.innerHTML) el.innerHTML = html
  }

  function addEmoji(unicode: string) {
    if (editorRef.current) {
      editorRef.current.innerHTML += unicode
      editorRef.current.focus()
    }
    setShowEmoji(false)
  }

  useEffect(() => {
    setMounted(true)
    fetchMessages()
    const channel = supabase.channel('chat-room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const { data } = await supabase.from('messages').select('*, profile:profiles(*)').eq('id', payload.new.id).single()
        if (data) { setMessages(prev => [...prev, data as MessageWithProfile]); scrollToBottom() }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function formatTime(ts: string | null) {
    if (!ts || !mounted) return ''
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isMe = (msg: MessageWithProfile) => msg.user_id === user?.id

  return (
    <div className={styles.page}>
      {/* ── Message history ──────────────────────────────── */}
      <div className={styles.messages}>
        {loading && <div className="loading-screen"><div className="pixel-spinner" /></div>}

        {messages.map((msg, i) => {
          const me = isMe(msg)
          const prevMsg = i > 0 ? messages[i - 1] : null
          const isSameUser = prevMsg?.user_id === msg.user_id
          const timeDiff = prevMsg
            ? new Date(msg.created_at || 0).getTime() - new Date(prevMsg.created_at || 0).getTime()
            : Infinity
          const isGroupStart = !isSameUser || timeDiff > 60000
          const msgDate = new Date(msg.created_at || 0)
          const prevDate = prevMsg ? new Date(prevMsg.created_at || 0) : new Date(0)
          const isUnread = lastReadTs && msgDate > lastReadTs && prevDate <= lastReadTs

          return (
            <React.Fragment key={msg.id}>
              {isUnread && <div className={styles.unreadDivider}>New Messages</div>}

              <div className={`${styles.row} ${me ? styles.rowMe : styles.rowOther} ${isGroupStart ? styles.groupStart : styles.groupFollow}`}>
                {/* Avatar (other users only, on group start) */}
                {!me && (
                  <div className={styles.avatarSlot}>
                    {isGroupStart && (
                      <div className={styles.avatarWrap}>
                        <CharacterSprite
                          config={(msg.profile as any)?.character_config ?? {}}
                          size="sm"
                          animated={false}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.bubble}>
                  {isGroupStart && (
                    <div className={styles.bubbleHeader}>
                      <span className={styles.bubbleUser}>{me ? 'You' : msg.profile?.username}</span>
                      <span className={styles.bubbleTime}>{formatTime(msg.created_at)}</span>
                    </div>
                  )}
                  <div
                    className={`${styles.bubbleContent} ${me ? styles.bubbleMe : styles.bubbleOther}`}
                    dangerouslySetInnerHTML={{ __html: parseEmojisToHtml(msg.content) }}
                  />
                </div>
              </div>
            </React.Fragment>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ────────────────────────────────────── */}
      <div className={styles.inputBar}>
        <div className={styles.inputInner}>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className={styles.editor}
            data-placeholder="Say something cozy..."
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            role="textbox"
            aria-multiline="true"
            aria-label="Message input"
            id="message-input"
          />

          <div className={styles.inputActions}>
            <div className={styles.emojiWrap}>
              <button className="btn-icon" type="button" onClick={() => setShowEmoji(!showEmoji)} title="Emoji">😀</button>
              {showEmoji && (
                <div className={styles.emojiMenu}>
                  <PixelEmojiPicker onEmojiSelect={addEmoji} />
                </div>
              )}
            </div>

            <button className="btn-icon" type="button" onClick={() => document.execCommand('bold', false)} title="Bold (Ctrl+B)">
              <strong>B</strong>
            </button>
            <button className="btn-icon" type="button" onClick={() => document.execCommand('italic', false)} title="Italic (Ctrl+I)">
              <em>I</em>
            </button>

            <button
              className="btn btn-primary"
              type="button"
              id="send-message-btn"
              onClick={sendMessage}
            >
              Send →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
