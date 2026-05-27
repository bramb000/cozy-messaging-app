'use client'
import React, { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { ChatSceneBackground } from '@/components/chat/ChatSceneBackground'
import { readChatBackgroundFromProfile } from '@/lib/chatBackgrounds'
import type { MessageWithProfile } from '@/types/database'
import styles from './ChatPage.module.css'
import PixelEmojiPicker from '@/components/ui/PixelEmojiPicker'
import { CharacterAvatar } from '@/components/character/CharacterAvatar'
import { parseEmojisToHtml } from '@/utils/emojiParser'

const CHAIN_GAP_MS = 20_000 // 20 seconds — messages within this window are chained

export default function ChatPage() {
  const { user, profile } = useAuth()
  const chatBackground = readChatBackgroundFromProfile(profile)
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

  /**
   * Format timestamp — shows full date + time on chain-start headers.
   * e.g. "21 May 2025 at 09:41 AM"
   */
  function formatTimestamp(ts: string | null): string {
    if (!ts || !mounted) return ''
    const d = new Date(ts)
    const today     = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const isSameDay = (a: Date, b: Date) =>
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    if (isSameDay(d, today)) return `Today at ${timeStr}`
    if (isSameDay(d, yesterday)) return `Yesterday at ${timeStr}`

    const dateStr = d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
    return `${dateStr} at ${timeStr}`
  }

  /** Compact hover timestamp shown for chained messages */
  function formatHoverTime(ts: string | null): string {
    if (!ts || !mounted) return ''
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isMe = (msg: MessageWithProfile) => msg.user_id === user?.id

  return (
    <div className={styles.page}>
      <ChatSceneBackground sceneId={chatBackground} />
      <div className={styles.scrim} aria-hidden="true" />

      {/* ── Message history ──────────────────────────────── */}
      <div className={styles.messages}>
        {loading && <div className="loading-screen"><div className="pixel-spinner" /></div>}

        {messages.map((msg, i) => {
          const me       = isMe(msg)
          const prevMsg  = i > 0 ? messages[i - 1] : null
          const nextMsg  = i < messages.length - 1 ? messages[i + 1] : null

          const timeDiff = prevMsg
            ? new Date(msg.created_at || 0).getTime() - new Date(prevMsg.created_at || 0).getTime()
            : Infinity

          // New chain if: different user OR more than 20s since last message
          const isSameUser    = prevMsg?.user_id === msg.user_id
          const isChainStart  = !isSameUser || timeDiff > CHAIN_GAP_MS

          // Is next message part of the same chain? (used for bottom padding)
          const nextTimeDiff  = nextMsg
            ? new Date(nextMsg.created_at || 0).getTime() - new Date(msg.created_at || 0).getTime()
            : Infinity
          const isChainEnd    = !nextMsg || nextMsg.user_id !== msg.user_id || nextTimeDiff > CHAIN_GAP_MS

          const msgDate  = new Date(msg.created_at || 0)
          const prevDate = prevMsg ? new Date(prevMsg.created_at || 0) : new Date(0)
          const isUnread = lastReadTs && msgDate > lastReadTs && prevDate <= lastReadTs

          return (
            <React.Fragment key={msg.id}>
              {isUnread && <div className={styles.unreadDivider}>New Messages</div>}

              <div className={`${styles.row} ${isChainStart ? styles.chainStart : styles.chainFollow} ${isChainEnd ? styles.chainEnd : ''} ${me ? styles.rowMe : ''}`}>

                {/* Avatar column — always on the left */}
                <div className={styles.avatarSlot}>
                  {isChainStart ? (
                    <CharacterAvatar
                      config={(msg.profile?.character_config as Record<string, unknown>) ?? {}}
                      variant="chat"
                    />
                  ) : (
                    /* Blank indent + hover timestamp for chained messages */
                    <span className={styles.chainTime} aria-hidden="true">
                      {formatHoverTime(msg.created_at)}
                    </span>
                  )}
                </div>

                {/* Message content column */}
                <div className={styles.bubble}>
                  {isChainStart && (
                    <div className={styles.bubbleHeader}>
                      <span className={`${styles.bubbleUser} ${me ? styles.bubbleUserMe : ''}`}>
                        {me ? 'You' : msg.profile?.username}
                      </span>
                      <span className={styles.bubbleTime}>{formatTimestamp(msg.created_at)}</span>
                    </div>
                  )}
                  <div
                    className={styles.bubbleContent}
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
