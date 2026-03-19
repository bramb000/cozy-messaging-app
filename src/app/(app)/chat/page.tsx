'use client'
import React, { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import type { MessageWithProfile } from '@/types/database'
import styles from './ChatPage.module.css'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

export default function ChatPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [messages, setMessages] = useState<MessageWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [lastReadTs, setLastReadTs] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  async function fetchMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profile:profiles(*)')
        .order('created_at', { ascending: true })
        .limit(100)
      
      if (error) {
        console.error('Error fetching messages:', error)
      } else {
        setMessages((data as MessageWithProfile[]) ?? [])
        setLastReadTs(new Date()) // Mark current time as read boundary
      }
    } catch (err) {
      console.error('Unexpected error fetching messages:', err)
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  async function sendMessage() {
    if (!editorRef.current || !user) {
      console.warn('--- Chat: sendMessage blocked (no editor or user)', !!editorRef.current, !!user)
      return
    }
    const content = editorRef.current.innerHTML.trim()
    if (!content || content === '<br>') return
    
    console.log('--- Chat: Sending message...')
    editorRef.current.innerHTML = ''
    
    try {
      // @ts-expect-error Supabase types misaligned
      const { data, error } = await supabase.from('messages').insert({ user_id: user.id, content }).select().single()
      
      if (error) {
        console.error('--- Chat: Send error:', error.message, error.details)
      } else {
        console.log('--- Chat: Message sent successfully')
      }
    } catch (e) {
      console.error('--- Chat: sendMessage exception:', e)
    }
  }

  function scrollToBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function execFormat(cmd: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false)
  }

  function addEmoji(emoji: any) {
    if (editorRef.current) {
      editorRef.current.innerHTML += emoji.native
      // Need to move cursor to the end, but appending raw is okay for simple editor
      editorRef.current.focus()
    }
    setShowEmojiPicker(false)
  }

  useEffect(() => {
    setMounted(true)
    fetchMessages()
    const channel = supabase
      .channel('chat-room')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, profile:profiles(*)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages(prev => [...prev, data as MessageWithProfile])
            scrollToBottom()
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function formatTime(ts: string | null) {
    if (!ts || !mounted) return ''
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>💬 Chat Room</h2>
        <span className={styles.subtitle}>Global · All messages are public</span>
      </header>

      <div className={styles.messages}>
        {loading && (
          <div className="loading-screen">
            <div className="pixel-spinner" />
          </div>
        )}
        {messages.map((msg, i) => {
          const isSameUser = i > 0 && messages[i-1].user_id === msg.user_id
          const timeDiff = i > 0 ? new Date(msg.created_at || 0).getTime() - new Date(messages[i-1].created_at || 0).getTime() : 0
          const isGroupStart = i === 0 || !isSameUser || timeDiff > 60000 // 1 min

          const msgDate = new Date(msg.created_at || 0)
          const prevDate = i > 0 ? new Date(messages[i-1].created_at || 0) : new Date(0)
          const isUnreadBoundary = lastReadTs && msgDate > lastReadTs && prevDate <= lastReadTs

          return (
            <React.Fragment key={msg.id}>
              {isUnreadBoundary && (
                <div className={styles.unreadDivider}>
                  <span>New Messages</span>
                </div>
              )}
              <div className={`${styles.messageRow} ${isGroupStart ? styles.groupStart : styles.groupFollowup}`}>
                <div className={styles.avatarCol}>
                  {isGroupStart && (
                    <div className="avatar avatar-sm">
                      {msg.profile?.avatar_url
                        ? <img src={msg.profile.avatar_url} alt={msg.profile.username} />
                        : <span>🌱</span>}
                    </div>
                  )}
                </div>
                <div className={styles.messageBody}>
                  {isGroupStart && (
                    <div className={styles.messageHeader}>
                      <span className={styles.msgUsername}>{msg.profile?.username}</span>
                      <span className={styles.time}>{formatTime(msg.created_at)}</span>
                    </div>
                  )}
                  <div
                    className={`${styles.msgContent} pixel-border-light`}
                    dangerouslySetInnerHTML={{ __html: msg.content }}
                  />
                </div>
              </div>
            </React.Fragment>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputArea}>
        <div className={styles.toolbar}>
          <button type="button" className={`btn btn-icon ${styles.toolBtn}`} onClick={() => execFormat('bold')} title="Bold" id="format-bold-btn">
            <strong>B</strong>
          </button>
          <button type="button" className={`btn btn-icon ${styles.toolBtn}`} onClick={() => execFormat('italic')} title="Italic" id="format-italic-btn">
            <em>I</em>
          </button>
          <button type="button" className={`btn btn-icon ${styles.toolBtn}`} onClick={() => execFormat('underline')} title="Underline" id="format-underline-btn">
            <u>U</u>
          </button>
          <div className={styles.emojiWrapper}>
            <button type="button" className={`btn btn-icon ${styles.toolBtn}`} onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji">
              😀
            </button>
            {showEmojiPicker && (
              <div className={styles.emojiPickerMenu}>
                <Picker data={data} onEmojiSelect={addEmoji} theme="dark" />
              </div>
            )}
          </div>
        </div>
        <div className={styles.editorRow}>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className={styles.editorWrap}
            data-placeholder="Say something cozy..."
            onKeyDown={handleKeyDown}
            role="textbox"
            aria-multiline="true"
            aria-label="Message input"
            id="message-input"
          />
          <button id="send-message-btn" className="btn btn-primary" onClick={sendMessage}>Send →</button>
        </div>
        <p className={styles.hint}>Enter to send · Shift+Enter for new line · B / I / U for formatting</p>
      </div>
    </div>
  )
}
