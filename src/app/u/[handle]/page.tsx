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

type PublicList = {
  id: string
  name: string
  description: string | null
  recipeIds: string[]
  updated_at: string
}

type RecipeLite = {
  id: string; slug: string; title: string; image_url: string | null; cuisine: string | null
}

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

  // Public lists from this profile's user. RLS allows everyone to read
  // user_lists rows where is_public = true.
  const [publicLists, setPublicLists] = useState<PublicList[]>([])
  const [listRecipes, setListRecipes] = useState<Map<string, RecipeLite>>(new Map())

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('user_lists')
        .select('id, name, description, is_public, updated_at, user_list_recipes (recipe_id, position)')
        .eq('user_id', profile.id)
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
      if (cancelled) return
      if (error) { console.error('[u/handle] public lists failed:', error); return }
      const lists: PublicList[] = (data ?? []).map((row: { id: string; name: string; description: string | null; updated_at: string; user_list_recipes?: { recipe_id: string; position: number }[] }) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        updated_at: row.updated_at,
        recipeIds: (row.user_list_recipes ?? [])
          .slice()
          .sort((a, b) => a.position - b.position)
          .map(m => m.recipe_id),
      }))
      setPublicLists(lists)

      // Hydrate recipe details for thumbnails.
      const allIds = [...new Set(lists.flatMap(l => l.recipeIds))]
      if (allIds.length === 0) { setListRecipes(new Map()); return }
      const { data: recipes } = await supabase
        .from('recipes')
        .select('id, slug, title, image_url, cuisine')
        .in('id', allIds)
      if (cancelled || !recipes) return
      const m = new Map<string, RecipeLite>()
      ;(recipes as RecipeLite[]).forEach(r => m.set(r.id, r))
      setListRecipes(m)
    }
    load()
    return () => { cancelled = true }
  }, [profile.id])

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
        {publicLists.length > 0 ? (
          <PublicListsShelf
            lists={publicLists}
            recipes={listRecipes}
            isOwner={isOwner}
            displayName={profile.display_name || profile.handle}
            isMobile={isMobile}
          />
        ) : (
          <EmptyShelf
            title="Lists"
            empty={isOwner
              ? 'You haven’t made any public lists yet. Edit a list and check "Make this list public" to share it here.'
              : `${profile.display_name || profile.handle} hasn’t made any public lists yet.`}
          />
        )}
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

function PublicListsShelf({ lists, recipes, isOwner, displayName, isMobile }: {
  lists: PublicList[]
  recipes: Map<string, RecipeLite>
  isOwner: boolean
  displayName: string
  isMobile: boolean
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: 2, margin: 0 }}>Lists</h2>
        {isOwner && (
          <Link href="/lists" style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.accent, textDecoration: 'none' }}>Manage all →</Link>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lists.map(list => {
          const previewRecipes = list.recipeIds.map(id => recipes.get(id)).filter(Boolean) as RecipeLite[]
          return (
            <div key={list.id} style={{
              background: C.warm, border: `1px solid ${C.ruleLight}`, borderRadius: RADIUS.md,
              padding: isMobile ? '14px 14px' : '16px 18px',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: C.text, margin: 0 }}>{list.name}</h3>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.accent, fontWeight: 600 }}>{list.recipeIds.length} recipes</span>
              </div>
              {list.description && (
                <p style={{ fontFamily: SANS, fontSize: 13, color: C.text2, margin: 0, lineHeight: 1.5 }}>{list.description}</p>
              )}
              {previewRecipes.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                  {previewRecipes.slice(0, 6).map(r => (
                    <Link key={r.id} href={`/recipe/${r.slug}`} style={{
                      textDecoration: 'none', fontFamily: SANS, fontSize: 11, color: C.text2,
                      background: C.bg, padding: '3px 9px', borderRadius: 4, border: `1px solid ${C.ruleLight}`,
                    }}>
                      {r.title}
                    </Link>
                  ))}
                  {previewRecipes.length > 6 && (
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, padding: '3px 6px' }}>
                      +{previewRecipes.length - 6} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {!isOwner && lists.length > 0 && (
        <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, margin: '12px 0 0' }}>
          {lists.length} public list{lists.length !== 1 ? 's' : ''} by {displayName}
        </p>
      )}
    </div>
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
