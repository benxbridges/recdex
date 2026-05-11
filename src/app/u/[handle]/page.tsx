'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { C, SERIF, SANS, MONO, MOBILE_BREAKPOINT, RADIUS } from '@/app/lib/theme'
import SiteHeader from '@/app/components/SiteHeader'
import Button from '@/app/components/Button'
import { supabase } from '@/app/lib/supabase'
import { useAuth, type Profile } from '@/app/lib/auth'
import { useSavedRecipes } from '@/app/lib/saved-recipes'

export default function PublicProfilePage() {
  const params = useParams<{ handle: string }>()
  const handle = (params?.handle || '').toLowerCase()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const c = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('handle', handle)
        .maybeSingle()
      if (cancelled) return
      if (error) console.error('[u/handle] profile load failed:', error)
      setProfile((data as Profile | null) ?? null)
      setLoading(false)
    }
    if (handle) load()
    return () => { cancelled = true }
  }, [handle])

  const isOwner = !!(user && profile && user.id === profile.id)

  return (
    <main style={{ background: C.bg, minHeight: '100vh' }}>
      <SiteHeader />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: `clamp(28px, 5vw, 48px) ${isMobile ? 16 : 24}px 80px` }}>
        {loading ? (
          <p style={{ fontFamily: SANS, fontSize: 14, color: C.text3 }}>Loading…</p>
        ) : !profile ? (
          <NotFound handle={handle} />
        ) : (
          <ProfileView profile={profile} isOwner={isOwner} isMobile={isMobile} />
        )}
      </div>
    </main>
  )
}

function ProfileView({ profile, isOwner, isMobile }: { profile: Profile; isOwner: boolean; isMobile: boolean }) {
  const initials = (profile.display_name || profile.handle).slice(0, 2).toUpperCase()
  // Owner-only: surface the Box count with a link to the full /profile list.
  // RLS hides other people's saves from this query, so non-owners always see 0.
  const { savedIds } = useSavedRecipes()
  const savedCount = isOwner ? savedIds.size : 0
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? 16 : 24, marginBottom: 28 }}>
        <div aria-hidden style={{
          flexShrink: 0,
          width: isMobile ? 72 : 96, height: isMobile ? 72 : 96,
          borderRadius: '50%', background: C.accentBg, color: C.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isMobile ? 24 : 32, fontWeight: 700, fontFamily: MONO, letterSpacing: 0.5,
          border: `2px solid ${C.accent}`,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? 26 : 32, fontWeight: 700, color: C.text, margin: 0, letterSpacing: -0.5 }}>
            {profile.display_name || profile.handle}
          </h1>
          <p style={{ fontFamily: MONO, fontSize: 12, color: C.text3, margin: '4px 0 0' }}>@{profile.handle}</p>
          {profile.bio && (
            <p style={{ fontFamily: SERIF, fontSize: 15, color: C.text2, margin: '12px 0 0', lineHeight: 1.55 }}>{profile.bio}</p>
          )}
          {isOwner && (
            <div style={{ marginTop: 14 }}>
              <Link href="/profile">
                <Button variant="secondary" size="sm">Edit profile</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: C.rule, margin: '8px 0 24px' }} />

      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <EmptyShelf
          title="Lists"
          empty={isOwner ? 'You haven’t made any public lists yet.' : `${profile.display_name || profile.handle} hasn’t made any public lists yet.`}
        />
        <EmptyShelf
          title="Recently cooked"
          empty={isOwner ? 'Your cooking log will appear here once you cook a recipe.' : `${profile.display_name || profile.handle} hasn’t shared any cooks yet.`}
        />
        {isOwner && savedCount > 0 ? (
          <CountShelf
            title="Saved recipes"
            count={savedCount}
            href="/profile"
            ctaLabel="Open your Box →"
          />
        ) : (
          <EmptyShelf
            title="Saved recipes"
            empty={isOwner ? 'Recipes you save will appear here.' : ''}
          />
        )}
      </section>
    </>
  )
}

function EmptyShelf({ title, empty }: { title: string; empty: string }) {
  if (!empty) return null
  return (
    <div>
      <h2 style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 10px' }}>{title}</h2>
      <p style={{ fontFamily: SERIF, fontSize: 14, color: C.text3, fontStyle: 'italic', margin: 0, padding: '20px', border: `1px dashed ${C.ruleLight}`, borderRadius: RADIUS.md }}>{empty}</p>
    </div>
  )
}

function CountShelf({ title, count, href, ctaLabel }: { title: string; count: number; href: string; ctaLabel: string }) {
  return (
    <div>
      <h2 style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 10px' }}>{title}</h2>
      <Link
        href={href}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          border: `1px solid ${C.rule}`, borderRadius: RADIUS.md,
          background: C.warm,
          textDecoration: 'none',
        }}
      >
        <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.text }}>{count} recipe{count !== 1 ? 's' : ''} saved</span>
        <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.accent }}>{ctaLabel}</span>
      </Link>
    </div>
  )
}

function NotFound({ handle }: { handle: string }) {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px' }}>404</p>
      <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>No cook here.</h1>
      <p style={{ fontFamily: SANS, fontSize: 14, color: C.text2, margin: 0, lineHeight: 1.5 }}>
        We couldn&apos;t find anyone with the handle <span style={{ fontFamily: MONO, color: C.text }}>@{handle}</span>.
      </p>
    </div>
  )
}
