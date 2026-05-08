'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import SiteHeader from '@/app/components/SiteHeader'

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
  updated_at: string
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

// ===== COMPONENT =====
export default function CommunityPage() {
  const router = useRouter()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'new' | 'top'>('new')
  const [showCompose, setShowCompose] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [myUpvotes, setMyUpvotes] = useState<Set<string>>(new Set())

  // Load display name
  useEffect(() => {
    const saved = localStorage.getItem('recdex-display-name')
    if (saved) setDisplayName(saved)
  }, [])

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    setLoading(true)
    const orderCol = sortBy === 'top' ? 'upvote_count' : 'created_at'
    try {
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .order(orderCol, { ascending: false })
        .limit(50)
      if (error) throw error
      if (data) setThreads(data)
    } catch (err) {
      console.error('[community] Failed to load threads:', err)
    }
    setLoading(false)
  }, [sortBy])

  useEffect(() => { fetchThreads() }, [fetchThreads])

  // Fetch user's upvotes
  useEffect(() => {
    if (!displayName) return
    supabase
      .from('thread_upvotes')
      .select('thread_id')
      .eq('display_name', displayName)
      .then(({ data }) => {
        if (data) setMyUpvotes(new Set(data.map(u => u.thread_id)))
      })
  }, [displayName])

  async function handlePost() {
    if (!title.trim() || !body.trim()) return
    if (!displayName) { setShowNamePrompt(true); return }

    setPosting(true)
    const { data, error } = await supabase.from('threads').insert({
      title: title.trim(),
      body: body.trim(),
      author_display_name: displayName,
    }).select().single()

    if (error) { console.error(error); setPosting(false); return }
    setTitle('')
    setBody('')
    setShowCompose(false)
    setPosting(false)
    if (data) router.push(`/community/${data.id}`)
  }

  function saveName(name: string) {
    setDisplayName(name)
    localStorage.setItem('recdex-display-name', name)
    setShowNamePrompt(false)
  }

  async function handleUpvote(threadId: string) {
    if (!displayName) { setShowNamePrompt(true); return }
    const { data: added } = await supabase.rpc('toggle_thread_upvote', {
      p_thread_id: threadId,
      p_display_name: displayName,
    })
    // Optimistic update
    setThreads(prev => prev.map(t => {
      if (t.id !== threadId) return t
      return { ...t, upvote_count: t.upvote_count + (added ? 1 : -1) }
    }))
    setMyUpvotes(prev => {
      const next = new Set(prev)
      if (added) next.add(threadId); else next.delete(threadId)
      return next
    })
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

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <SiteHeader />

      {/* CONTENT */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* Title + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 0 24px' }}>
          <div>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(24px,4vw,32px)', fontWeight: 700, color: C.text, margin: 0 }}>Community</h2>
            <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3, margin: '6px 0 0' }}>
              Cooking talk, gear recs, and kitchen wisdom
            </p>
          </div>
          <button
            onClick={() => {
              if (!displayName) { setShowNamePrompt(true); return }
              setShowCompose(!showCompose)
            }}
            style={{
              background: showCompose ? C.warm : C.text,
              color: showCompose ? C.text : C.bg,
              border: showCompose ? `1px solid ${C.rule}` : 'none',
              padding: '10px 20px',
              borderRadius: 8,
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showCompose ? 'Cancel' : '+ New thread'}
          </button>
        </div>

        {/* Name Prompt Modal */}
        {showNamePrompt && (
          <div style={{
            background: C.warm,
            border: `1px solid ${C.rule}`,
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
          }}>
            <p style={{ fontFamily: SANS, fontSize: 13, color: C.text2, margin: '0 0 12px' }}>
              Choose a display name to post:
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

        {/* Compose form */}
        {showCompose && (
          <div style={{
            background: C.warm,
            border: `1px solid ${C.rule}`,
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}>
            <input
              type="text"
              placeholder="Thread title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
              style={{ ...inputStyle, fontSize: 16, fontWeight: 600, marginBottom: 12 }}
            />
            <textarea
              placeholder="What's on your mind?"
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, marginBottom: 16 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: SANS, fontSize: 11, color: C.text3 }}>
                Posting as <span style={{ color: C.text2, fontWeight: 600 }}>@{displayName}</span>
              </span>
              <button
                onClick={handlePost}
                disabled={posting || !title.trim() || !body.trim()}
                style={{
                  background: (!title.trim() || !body.trim()) ? C.rule : C.accent,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: 8,
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: (!title.trim() || !body.trim()) ? 'not-allowed' : 'pointer',
                  opacity: posting ? 0.6 : 1,
                }}
              >
                {posting ? 'Posting...' : 'Post thread'}
              </button>
            </div>
          </div>
        )}

        {/* Sort tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.ruleLight}`, marginBottom: 8 }}>
          {(['new', 'top'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                padding: '10px 18px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: sortBy === s ? 600 : 400,
                color: sortBy === s ? C.text : C.text3,
                borderBottom: sortBy === s ? `2px solid ${C.accent}` : '2px solid transparent',
                marginBottom: -1,
                textTransform: 'capitalize',
              }}
            >
              {s === 'new' ? 'New' : 'Top'}
            </button>
          ))}
        </div>

        {/* Thread list */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 18, height: 18, border: `2px solid ${C.rule}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <span style={{ fontFamily: SANS, fontSize: 13, color: C.text3 }}>Loading threads</span>
          </div>
        ) : threads.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: SERIF, fontSize: 20, color: C.text2, margin: '0 0 8px' }}>No threads yet</p>
            <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3 }}>Be the first to start a conversation.</p>
          </div>
        ) : (
          <div>
            {threads.map(thread => (
              <div
                key={thread.id}
                style={{
                  padding: '18px 0',
                  borderBottom: `1px solid ${C.ruleLight}`,
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                }}
              >
                {/* Upvote */}
                <div
                  onClick={e => { e.stopPropagation(); handleUpvote(thread.id) }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    minWidth: 36,
                    cursor: 'pointer',
                    paddingTop: 2,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={myUpvotes.has(thread.id) ? C.accent : 'none'} stroke={myUpvotes.has(thread.id) ? C.accent : C.text3} strokeWidth="2">
                    <path d="M12 4l-8 8h5v8h6v-8h5z" />
                  </svg>
                  <span style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    fontWeight: 700,
                    color: myUpvotes.has(thread.id) ? C.accent : C.text2,
                  }}>
                    {thread.upvote_count}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {thread.tag && (
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        fontFamily: MONO,
                        color: C.accent,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        padding: '2px 6px',
                        background: C.accentBg,
                        borderRadius: 4,
                      }}>
                        {thread.tag}
                      </span>
                    )}
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3 }}>
                      @{thread.author_display_name}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3 }}>
                      {timeAgo(thread.created_at)}
                    </span>
                  </div>
                  <Link
                    href={`/community/${thread.id}`}
                    style={{
                      fontFamily: SERIF,
                      fontSize: 16,
                      fontWeight: 600,
                      color: C.text,
                      textDecoration: 'none',
                      lineHeight: 1.3,
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    {thread.title}
                  </Link>
                  <p style={{
                    fontFamily: SANS,
                    fontSize: 13,
                    color: C.text3,
                    margin: 0,
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {thread.body}
                  </p>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link href={`/community/${thread.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, color: C.text3, fontSize: 11, fontFamily: SANS }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px clamp(16px,4vw,24px) 24px', borderTop: `1px solid ${C.ruleLight}`, marginTop: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: C.text3, fontFamily: SANS }}>RecDex Community</span>
          <Link href="/" style={{ fontSize: 10, color: C.text3, fontFamily: SANS, textDecoration: 'none' }}>Back to recipes</Link>
        </div>
      </div>
    </div>
  )
}
