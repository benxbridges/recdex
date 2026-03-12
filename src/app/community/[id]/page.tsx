'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import ThemeToggle from '@/app/components/ThemeToggle'

// ===== TYPES =====
type Thread = {
  id: string
  title: string
  body: string
  tag: string | null
  author_display_name: string
  upvote_count: number
  reply_count: number
  created_at: string
}

type Reply = {
  id: string
  thread_id: string
  body: string
  author_display_name: string
  created_at: string
}

// ===== HELPERS =====
function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function EggDot({ size = 8 }: { size?: number }) {
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: C.accent, marginLeft: 2, verticalAlign: 'super' }} />
}

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [thread, setThread] = useState<Thread | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [replyBody, setReplyBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [hasUpvoted, setHasUpvoted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('recdex-display-name')
    if (saved) setDisplayName(saved)
  }, [])

  const fetchThread = useCallback(async () => {
    setLoading(true)
    const [threadRes, repliesRes] = await Promise.all([
      supabase.from('threads').select('*').eq('id', id).single(),
      supabase.from('thread_replies').select('*').eq('thread_id', id).order('created_at', { ascending: true }),
    ])
    if (threadRes.data) setThread(threadRes.data)
    if (repliesRes.data) setReplies(repliesRes.data)
    setLoading(false)
  }, [id])

  useEffect(() => { fetchThread() }, [fetchThread])

  // Check if user has upvoted
  useEffect(() => {
    if (!displayName || !id) return
    supabase.from('thread_upvotes').select('id').eq('thread_id', id).eq('display_name', displayName).single()
      .then(({ data }) => setHasUpvoted(!!data))
  }, [displayName, id])

  async function handleReply() {
    if (!replyBody.trim()) return
    if (!displayName) { setShowNamePrompt(true); return }

    setPosting(true)
    const { data, error } = await supabase.from('thread_replies').insert({
      thread_id: id,
      body: replyBody.trim(),
      author_display_name: displayName,
    }).select().single()

    if (!error && data) {
      // Increment reply count
      await supabase.rpc('increment_reply_count', { p_thread_id: id })
      setReplies(prev => [...prev, data])
      setThread(prev => prev ? { ...prev, reply_count: prev.reply_count + 1 } : prev)
      setReplyBody('')
    }
    setPosting(false)
  }

  async function handleUpvote() {
    if (!displayName) { setShowNamePrompt(true); return }
    const { data: added } = await supabase.rpc('toggle_thread_upvote', {
      p_thread_id: id,
      p_display_name: displayName,
    })
    setHasUpvoted(!!added)
    setThread(prev => prev ? { ...prev, upvote_count: prev.upvote_count + (added ? 1 : -1) } : prev)
  }

  function saveName(name: string) {
    setDisplayName(name)
    localStorage.setItem('recdex-display-name', name)
    setShowNamePrompt(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: C.warm,
    border: `1px solid ${C.rule}`,
    borderRadius: 8,
    color: C.text,
    fontSize: 14,
    fontFamily: SANS,
    outline: 'none',
  } as const

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: SANS, fontSize: 14, color: C.text3 }}>Loading...</span>
      </div>
    )
  }

  if (!thread) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontFamily: SERIF, fontSize: 20, color: C.text2 }}>Thread not found</span>
        <Link href="/community" style={{ fontFamily: SANS, fontSize: 13, color: C.accent, textDecoration: 'none' }}>Back to community</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* HEADER */}
      <header style={{ borderBottom: `1.5px solid ${C.text}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '18px clamp(16px,4vw,24px) 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
              <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -1, lineHeight: 1 }}>
                Recipe Index<EggDot size={9} />
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, fontFamily: SANS }}>
              <Link href="/community" style={{ color: C.text2, textDecoration: 'none', fontSize: 11, fontWeight: 500 }}>← Community</Link>
              <div style={{ width: 1, height: 14, background: C.rule }} />
              <Link href="/browse" style={{ color: C.text2, textDecoration: 'none', fontSize: 11, fontWeight: 500 }}>Browse</Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* THREAD CONTENT */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* Thread header */}
        <div style={{ padding: '32px 0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            {thread.tag && (
              <span style={{
                fontSize: 9, fontWeight: 700, fontFamily: MONO, color: C.accent,
                textTransform: 'uppercase', letterSpacing: 0.5, padding: '2px 6px',
                background: C.accentBg, borderRadius: 4,
              }}>
                {thread.tag}
              </span>
            )}
            <span style={{ fontFamily: MONO, fontSize: 11, color: C.text3 }}>
              @{thread.author_display_name}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: C.text3 }}>
              {timeAgo(thread.created_at)}
            </span>
          </div>

          <h2 style={{
            fontFamily: SERIF, fontSize: 'clamp(22px,4vw,30px)', fontWeight: 700,
            color: C.text, margin: '0 0 16px', lineHeight: 1.2,
          }}>
            {thread.title}
          </h2>

          <p style={{
            fontFamily: SANS, fontSize: 15, color: C.text2, lineHeight: 1.7,
            margin: '0 0 20px', whiteSpace: 'pre-wrap',
          }}>
            {thread.body}
          </p>

          {/* Upvote + reply count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottom: `1px solid ${C.ruleLight}` }}>
            <button
              onClick={handleUpvote}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: hasUpvoted ? C.accentBg : 'none',
                border: `1px solid ${hasUpvoted ? C.accent : C.rule}`,
                borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
                color: hasUpvoted ? C.accent : C.text2,
                fontFamily: MONO, fontSize: 12, fontWeight: 600,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={hasUpvoted ? C.accent : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M12 4l-8 8h5v8h6v-8h5z" />
              </svg>
              {thread.upvote_count}
            </button>
            <span style={{ fontFamily: SANS, fontSize: 12, color: C.text3, display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
            </span>
          </div>
        </div>

        {/* Name Prompt */}
        {showNamePrompt && (
          <div style={{
            background: C.warm, border: `1px solid ${C.rule}`, borderRadius: 12,
            padding: 24, marginBottom: 20,
          }}>
            <p style={{ fontFamily: SANS, fontSize: 13, color: C.text2, margin: '0 0 12px' }}>
              Choose a display name to participate:
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="your_name"
                maxLength={20}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                    saveName((e.target as HTMLInputElement).value.trim())
                  }
                }}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={e => {
                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement)
                  if (input.value.trim()) saveName(input.value.trim())
                }}
                style={{
                  background: C.accent, color: '#fff', border: 'none', padding: '10px 18px',
                  borderRadius: 8, fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Set name
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        <div>
          {replies.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3 }}>No replies yet. Be the first to respond.</p>
            </div>
          ) : (
            replies.map((reply, i) => (
              <div
                key={reply.id}
                style={{
                  padding: '16px 0',
                  borderBottom: i < replies.length - 1 ? `1px solid ${C.ruleLight}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: C.text2 }}>
                    @{reply.author_display_name}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3 }}>
                    {timeAgo(reply.created_at)}
                  </span>
                </div>
                <p style={{
                  fontFamily: SANS, fontSize: 14, color: C.text, lineHeight: 1.6,
                  margin: 0, whiteSpace: 'pre-wrap',
                }}>
                  {reply.body}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Reply form */}
        <div style={{
          padding: '24px 0 48px',
          borderTop: replies.length > 0 ? `1px solid ${C.ruleLight}` : 'none',
          marginTop: replies.length > 0 ? 8 : 0,
        }}>
          <textarea
            placeholder={displayName ? 'Write a reply...' : 'Set a display name to reply'}
            value={replyBody}
            onChange={e => setReplyBody(e.target.value)}
            rows={3}
            disabled={!displayName && !showNamePrompt}
            onClick={() => { if (!displayName) setShowNamePrompt(true) }}
            style={{
              ...inputStyle,
              resize: 'vertical',
              lineHeight: 1.6,
              marginBottom: 12,
              opacity: displayName ? 1 : 0.6,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {displayName && (
              <span style={{ fontFamily: SANS, fontSize: 11, color: C.text3 }}>
                Replying as <span style={{ color: C.text2, fontWeight: 600 }}>@{displayName}</span>
              </span>
            )}
            <button
              onClick={handleReply}
              disabled={posting || !replyBody.trim() || !displayName}
              style={{
                background: (!replyBody.trim() || !displayName) ? C.rule : C.accent,
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: 8,
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 600,
                cursor: (!replyBody.trim() || !displayName) ? 'not-allowed' : 'pointer',
                opacity: posting ? 0.6 : 1,
                marginLeft: 'auto',
              }}
            >
              {posting ? 'Posting...' : 'Reply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
