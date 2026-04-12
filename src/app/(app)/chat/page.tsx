'use client'
import React, { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import type { MessageWithProfile } from '@/types/database'
import styles from './ChatPage.module.css'
import PixelEmojiPicker from '@/components/ui/PixelEmojiPicker'
import PixelButton from '@/components/ui/PixelButton'
import PixelPanel from '@/components/ui/PixelPanel'
import { Stack } from '@/components/ui/Layout/Stack'
import { Box } from '@/components/ui/Layout/Box'
import { Text } from '@/components/ui/Typography/Text'
import { PageContainer } from '@/components/ui/Layout/PageContainer'
import { PageHeader } from '@/components/ui/Layout/PageHeader'
import { PageContent } from '@/components/ui/Layout/PageContent'
import { parseEmojisToHtml } from '@/utils/emojiParser'

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
        // Silently handle or use a proper logger in prod
      } else {
        setMessages((data as MessageWithProfile[]) ?? [])
        setLastReadTs(new Date()) // Mark current time as read boundary
      }
    } catch (err) {
      // Unexpected error
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  async function sendMessage() {
    if (!editorRef.current || !user) {
      return
    }
    const content = editorRef.current.innerHTML.trim()
    if (!content || content === '<br>') return
    
    editorRef.current.innerHTML = ''
    
    try {
      // @ts-expect-error Supabase types misaligned
      const { data, error } = await supabase.from('messages').insert({ user_id: user.id, content }).select().single()
      
      if (error) {
        // Error inserting
      } else {
        // Success
      }
    } catch (e) {
      // Exception
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

    // Keyboard Shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          execFormat('bold')
          break
        case 'i':
          e.preventDefault()
          execFormat('italic')
          break
        case 'u':
          e.preventDefault()
          execFormat('underline')
          break
      }
    }
  }

  function handleInput(e: React.FormEvent<HTMLDivElement>) {
    const target = e.currentTarget
    
    // Basic Markdown Detection (Simple regex on the fly)
    // We only check for the patterns when a space or special char is typed potentially, 
    // but here we can just check if the last sequence matches.
    // For simplicity in a contentEditable, we can use a more robust logic if needed,
    // but let's try a simple one first.
    const content = target.innerHTML
    
    // Bold: **text** -> <strong>text</strong>
    if (content.match(/\*\*(.*?)\*\*/)) {
      target.innerHTML = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Move cursor to end? In a simple contentEditable this might jump.
      // Better way: document.execCommand if we can find the specific range.
    }
    
    // Italic: *text* -> <em>text</em>
    if (content.match(/\*(.*?)\*/)) {
      // Avoid matching **
      if (!content.match(/\*\*(.*?)\*\*/)) {
         target.innerHTML = content.replace(/\*(.*?)\*/g, '<em>$1</em>')
      }
    }
  }

  function execFormat(cmd: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false)
  }

  function addEmoji(unicode: string) {
    if (editorRef.current) {
      editorRef.current.innerHTML += unicode
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
    <PageContainer>
      <PageHeader title="💬 Chat Room" subtitle="Global · All messages are public" />

      <PageContent className={styles.messages}>
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
                <Box p="space-2" className={styles.unreadDivider}>
                  <Text variant="caption" color="red">New Messages</Text>
                </Box>
              )}
              <Stack direction="row" gap="space-3" className={`${styles.messageRow} ${isGroupStart ? styles.groupStart : styles.groupFollowup}`}>
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
                    <Stack direction="row" align="center" gap="space-2" mb="space-1" className={styles.messageHeader}>
                      <Text variant="caption" color="gold" style={{ fontSize: '0.6rem' }}>{msg.profile?.username}</Text>
                      <Text variant="caption" color="muted" style={{ fontSize: '0.55rem' }}>{formatTime(msg.created_at)}</Text>
                    </Stack>
                  )}
                  <PixelPanel
                    variant="solid-tertiary"
                    style={{ padding: 'var(--space-2) var(--space-3)', maxWidth: '500px', fontSize: '0.9rem', lineHeight: '1.2' }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: parseEmojisToHtml(msg.content) }} />
                  </PixelPanel>
                </div>
              </Stack>
            </React.Fragment>
          )
        })}
        <div ref={bottomRef} />
      </PageContent>

      <Box className={styles.inputArea}>
        <div className={styles.inputContainer}>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className={styles.editorWrap}
            data-placeholder="Say something cozy..."
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            role="textbox"
            aria-multiline="true"
            aria-label="Message input"
            id="message-input"
          />
          
          <div className={styles.actions}>
            <div className={styles.emojiWrapper}>
              <PixelButton 
                type="button" 
                variant="ghost" 
                className={styles.toolBtn} 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                title="Emoji"
              >
                😀
              </PixelButton>
              {showEmojiPicker && (
                <div className={styles.emojiPickerMenu}>
                  <PixelEmojiPicker onEmojiSelect={addEmoji} />
                </div>
              )}
            </div>
            
            <PixelButton type="button" variant="ghost" className={styles.toolBtn} onClick={() => execFormat('bold')} title="Bold">
              <strong>B</strong>
            </PixelButton>
            <PixelButton type="button" variant="ghost" className={styles.toolBtn} onClick={() => execFormat('italic')} title="Italic">
              <em>I</em>
            </PixelButton>
            
            <PixelButton 
              id="send-message-btn" 
              variant="primary" 
              size="sm"
              onClick={sendMessage}
              style={{ padding: '0 var(--space-2)', marginLeft: 'var(--space-1)' }}
            >
              Send →
            </PixelButton>
          </div>
        </div>
        
        <Box px="space-1">
          <Text variant="caption" color="muted" style={{ fontSize: '0.5rem' }}>
            Markdown (**bold**) supported · Ctrl+B for Bold · Enter to send
          </Text>
        </Box>
      </Box>
    </PageContainer>
  )
}
