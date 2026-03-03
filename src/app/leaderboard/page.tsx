'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'

// ===== EGG SYSTEM (shared with profile) =====
const EGG_TIERS = [
  { name: 'Home Cook', min: 0, color: C.text3 },
  { name: 'Line Cook', min: 25, color: C.gold },
  { name: 'Sous Chef', min: 100, color: C.green },
  { name: 'Chef', min: 500, color: C.blue },
  { name: 'Executive Chef', min: 2000, color: C.accent },
]

function getEggTier(eggs: number) {
  let tier = EGG_TIERS[0]
  for (const t of EGG_TIERS) {
    if (eggs >= t.min) tier = t
  }
  return tier
}

function EggBadge({ eggs, size = 11 }: { eggs: number; size?: number }) {
  const tier = getEggTier(eggs)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '1px 5px 1px 3px', borderRadius: 7,
      background: `${tier.color}15`,
    }}>
      <svg width={size} height={Math.round(size * 1.3)} viewBox="0 0 12 16" fill="none">
        <path d="M6 0.5C4.2 0.5 1 4.5 1 9.5C1 12.5 3.2 15 6 15C8.8 15 11 12.5 11 9.5C11 4.5 7.8 0.5 6 0.5Z"
          fill={tier.color} />
        <ellipse cx="4.5" cy="8.5" rx="1.5" ry="2" fill="white" opacity="0.25" />
      </svg>
      <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: tier.color, lineHeight: 1 }}>
        {eggs}
      </span>
    </span>
  )
}

function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <span style={{ display: 'inline-block', width: size, height: h, marginLeft: 2, background: C.accent, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', verticalAlign: 'baseline', marginBottom: -1 }} />
}

// ===== TYPES =====
type ContributorRow = { display_name: string; comment_count: number; eggs: number }
type RecipeRow = { recipe_id: string; title: string; slug: string; comment_count: number }
type BookRow = { book_key: string; like_count: number; own_count: number }

// Book metadata (same as homepage)
const BOOKS: Record<string, { title: string; author: string }> = {
  'salt-fat-acid-heat': { title: 'Salt, Fat, Acid, Heat', author: 'Samin Nosrat' },
  'the-food-lab': { title: 'The Food Lab', author: 'J. Kenji López-Alt' },
  'essentials-of-classic-italian': { title: 'Essentials of Classic Italian Cooking', author: 'Marcella Hazan' },
  'ottolenghi-simple': { title: 'Ottolenghi Simple', author: 'Yotam Ottolenghi' },
  'six-seasons': { title: 'Six Seasons', author: 'Joshua McFadden' },
  'flour-water-salt-yeast': { title: 'Flour Water Salt Yeast', author: 'Ken Forkish' },
  'the-wok': { title: 'The Wok', author: 'J. Kenji López-Alt' },
  'indian-ish': { title: 'Indian-ish', author: 'Priya Krishna' },
}

// Podium medal colors
const MEDAL = ['#D4A835', '#A8A8A8', '#CD7F32'] // gold, silver, bronze

// ===== MAIN PAGE =====
export default function LeaderboardPage() {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(true)

  // Data
  const [contributors, setContributors] = useState<ContributorRow[]>([])
  const [topRecipes, setTopRecipes] = useState<RecipeRow[]>([])
  const [topBooks, setTopBooks] = useState<BookRow[]>([])

  // Tab state
  const [activeTab, setActiveTab] = useState<'contributors' | 'recipes' | 'cookbooks'>('contributors')
  const [showEggInfo, setShowEggInfo] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch all comments for aggregation
        const { data: comments } = await supabase
          .from('comments')
          .select('display_name, recipe_id')

        // Fetch all recipes for title/slug mapping
        const { data: recipes } = await supabase
          .from('recipes')
          .select('id, title, slug')
          .eq('status', 'published')

        // Fetch book shelf data
        const { data: shelves } = await supabase
          .from('book_shelves')
          .select('book_key, liked, owned')

        const recipeMap = new Map<string, { title: string; slug: string }>()
        if (recipes) recipes.forEach(r => recipeMap.set(r.id, { title: r.title, slug: r.slug }))

        // Aggregate contributors
        if (comments) {
          const contribMap = new Map<string, number>()
          comments.forEach(c => {
            if (c.display_name) {
              contribMap.set(c.display_name, (contribMap.get(c.display_name) || 0) + 1)
            }
          })
          const contribList: ContributorRow[] = Array.from(contribMap.entries())
            .map(([name, count]) => ({
              display_name: name,
              comment_count: count,
              // Egg estimate: 1 per comment interaction (simplified for leaderboard)
              eggs: count,
            }))
            .sort((a, b) => b.comment_count - a.comment_count)
            .slice(0, 20)
          setContributors(contribList)

          // Aggregate recipe comments
          const recipeCommentMap = new Map<string, number>()
          comments.forEach(c => {
            recipeCommentMap.set(c.recipe_id, (recipeCommentMap.get(c.recipe_id) || 0) + 1)
          })
          const recipeList: RecipeRow[] = Array.from(recipeCommentMap.entries())
            .map(([recipeId, count]) => {
              const info = recipeMap.get(recipeId)
              return {
                recipe_id: recipeId,
                title: info?.title || 'Unknown Recipe',
                slug: info?.slug || '',
                comment_count: count,
              }
            })
            .filter(r => r.slug)
            .sort((a, b) => b.comment_count - a.comment_count)
            .slice(0, 20)
          setTopRecipes(recipeList)
        }

        // Aggregate book shelves
        if (shelves) {
          const bookMap = new Map<string, { likes: number; owns: number }>()
          shelves.forEach(s => {
            const existing = bookMap.get(s.book_key) || { likes: 0, owns: 0 }
            if (s.liked) existing.likes++
            if (s.owned) existing.owns++
            bookMap.set(s.book_key, existing)
          })
          const bookList: BookRow[] = Array.from(bookMap.entries())
            .map(([key, stats]) => ({
              book_key: key,
              like_count: stats.likes,
              own_count: stats.owns,
            }))
            .sort((a, b) => (b.like_count + b.own_count) - (a.like_count + a.own_count))
            .slice(0, 10)
          setTopBooks(bookList)
        }
      } catch (err) {
        console.error('Leaderboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const tabs = [
    { key: 'contributors' as const, label: 'Contributors', count: contributors.length },
    { key: 'recipes' as const, label: 'Recipes', count: topRecipes.length },
    { key: 'cookbooks' as const, label: 'Cookbooks', count: topBooks.length },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}body{margin:0;background:${C.bg}}::selection{background:rgba(200,74,42,0.15);color:${C.text}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

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
              <span onClick={() => router.push('/')} style={{ color: C.text2, cursor: 'pointer' }}>← Home</span>
              <div style={{ width: 1, height: 14, background: C.rule }} />
              <Link href="/lists" style={{ textDecoration: 'none', color: C.text2, fontSize: 11, fontWeight: 500 }}>Lists</Link>
              <Link href="/profile" style={{ textDecoration: 'none', color: C.text2, fontSize: 11, fontWeight: 500 }}>Profile</Link>
            </div>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* Title */}
        <div style={{ paddingTop: 28, paddingBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 5vw, 32px)', fontWeight: 700, color: C.text, margin: 0, letterSpacing: -0.5 }}>
              Community
            </h2>
            <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>THIS WEEK</span>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 14, color: C.text2, margin: 0, lineHeight: 1.6 }}>
            See what people are cooking, discussing, and reading.
          </p>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 0, borderBottom: `1.5px solid ${C.rule}`, marginBottom: 24,
        }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: isMobile ? 1 : 'none',
              padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: SANS, fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? C.text : C.text3,
              borderBottom: activeTab === tab.key ? `2px solid ${C.accent}` : '2px solid transparent',
              marginBottom: -1.5, transition: 'all 0.15s ease',
            }}>
              {tab.label}
              {tab.count > 0 && (
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.text3, marginLeft: 6 }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontFamily: SANS, fontSize: 14, color: C.text3 }}>Loading leaderboard...</p>
          </div>
        ) : (
          <>
            {/* ========== CONTRIBUTORS TAB ========== */}
            {activeTab === 'contributors' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                {contributors.length === 0 ? (
                  <EmptyState icon="👨‍🍳" title="No contributors yet" subtitle="Be the first to leave a Community Note on a recipe." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {/* Column headers */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: isMobile ? '32px 1fr 60px' : '40px 1fr 80px',
                      padding: '0 14px 8px', gap: 8,
                    }}>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: C.text3, textTransform: 'uppercase' }}>#</span>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: C.text3, textTransform: 'uppercase' }}>Contributor</span>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: C.text3, textTransform: 'uppercase', textAlign: 'right' }}>Notes</span>
                    </div>

                    {contributors.map((c, i) => (
                      <div key={c.display_name} style={{
                        display: 'grid', gridTemplateColumns: isMobile ? '32px 1fr 60px' : '40px 1fr 80px',
                        padding: '12px 14px', gap: 8, alignItems: 'center',
                        background: i < 3 ? `${MEDAL[i]}08` : (i % 2 === 0 ? C.warm : 'transparent'),
                        borderRadius: 8, animation: `fadeIn 0.3s ease ${i * 0.03}s both`,
                      }}>
                        {/* Rank */}
                        <span style={{
                          fontFamily: MONO, fontSize: i < 3 ? 14 : 12, fontWeight: 700,
                          color: i < 3 ? MEDAL[i] : C.text3, textAlign: 'center',
                        }}>
                          {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                        </span>

                        {/* Name + avatar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                            background: i < 3 ? `${MEDAL[i]}25` : C.ruleLight,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: SANS, fontSize: 13, fontWeight: 700,
                            color: i < 3 ? MEDAL[i] : C.text3,
                          }}>
                            {c.display_name[0].toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <span style={{
                              fontFamily: MONO, fontSize: 13, fontWeight: 600,
                              color: i < 3 ? C.text : C.text2,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                            }}>
                              @{c.display_name}
                            </span>
                            <span style={{ fontFamily: SANS, fontSize: 10, color: C.text3 }}>
                              {c.comment_count} note{c.comment_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Notes count */}
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: C.text }}>
                            {c.comment_count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========== RECIPES TAB ========== */}
            {activeTab === 'recipes' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                {topRecipes.length === 0 ? (
                  <EmptyState icon="📝" title="No discussed recipes yet" subtitle="Community Notes on recipes will show up here." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {/* Column headers */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: isMobile ? '32px 1fr 60px' : '40px 1fr 80px',
                      padding: '0 14px 8px', gap: 8,
                    }}>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: C.text3, textTransform: 'uppercase' }}>#</span>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: C.text3, textTransform: 'uppercase' }}>Recipe</span>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: C.text3, textTransform: 'uppercase', textAlign: 'right' }}>Notes</span>
                    </div>

                    {topRecipes.map((r, i) => (
                      <Link key={r.recipe_id} href={`/recipe/${r.slug}`} style={{
                        textDecoration: 'none',
                        display: 'grid', gridTemplateColumns: isMobile ? '32px 1fr 60px' : '40px 1fr 80px',
                        padding: '12px 14px', gap: 8, alignItems: 'center',
                        background: i < 3 ? `${MEDAL[i]}08` : (i % 2 === 0 ? C.warm : 'transparent'),
                        borderRadius: 8, animation: `fadeIn 0.3s ease ${i * 0.03}s both`,
                      }}>
                        {/* Rank */}
                        <span style={{
                          fontFamily: MONO, fontSize: i < 3 ? 14 : 12, fontWeight: 700,
                          color: i < 3 ? MEDAL[i] : C.text3, textAlign: 'center',
                        }}>
                          {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                        </span>

                        {/* Recipe title */}
                        <div style={{ minWidth: 0 }}>
                          <span style={{
                            fontFamily: SERIF, fontSize: 15, fontWeight: 600,
                            color: C.text, lineHeight: 1.3,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                          }}>
                            {r.title}
                          </span>
                        </div>

                        {/* Comment count */}
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          <span style={{ fontSize: 12, opacity: 0.6 }}>💬</span>
                          <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: C.text }}>
                            {r.comment_count}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========== COOKBOOKS TAB ========== */}
            {activeTab === 'cookbooks' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                {topBooks.length === 0 ? (
                  <EmptyState icon="📚" title="No cookbook activity yet" subtitle="Like and collect cookbooks from the homepage to see them here." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {/* Column headers */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: isMobile ? '32px 1fr 50px 50px' : '40px 1fr 80px 80px',
                      padding: '0 14px 8px', gap: 8,
                    }}>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: C.text3, textTransform: 'uppercase' }}>#</span>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: C.text3, textTransform: 'uppercase' }}>Cookbook</span>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: C.text3, textTransform: 'uppercase', textAlign: 'right' }}>Likes</span>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: C.text3, textTransform: 'uppercase', textAlign: 'right' }}>Owned</span>
                    </div>

                    {topBooks.map((b, i) => {
                      const bookInfo = BOOKS[b.book_key]
                      return (
                        <div key={b.book_key} style={{
                          display: 'grid', gridTemplateColumns: isMobile ? '32px 1fr 50px 50px' : '40px 1fr 80px 80px',
                          padding: '12px 14px', gap: 8, alignItems: 'center',
                          background: i < 3 ? `${MEDAL[i]}08` : (i % 2 === 0 ? C.warm : 'transparent'),
                          borderRadius: 8, animation: `fadeIn 0.3s ease ${i * 0.03}s both`,
                        }}>
                          {/* Rank */}
                          <span style={{
                            fontFamily: MONO, fontSize: i < 3 ? 14 : 12, fontWeight: 700,
                            color: i < 3 ? MEDAL[i] : C.text3, textAlign: 'center',
                          }}>
                            {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                          </span>

                          {/* Book info */}
                          <div style={{ minWidth: 0 }}>
                            <span style={{
                              fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.3,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                            }}>
                              {bookInfo?.title || b.book_key}
                            </span>
                            <span style={{ fontFamily: SANS, fontSize: 11, color: C.text3 }}>
                              {bookInfo?.author || ''}
                            </span>
                          </div>

                          {/* Likes */}
                          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                            <span style={{ fontSize: 11, color: C.accent }}>♥</span>
                            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: C.text }}>
                              {b.like_count}
                            </span>
                          </div>

                          {/* Owned */}
                          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                            <span style={{ fontSize: 11, color: C.green }}>📖</span>
                            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: C.text }}>
                              {b.own_count}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ========== EGG INFO — subtle, collapsible ========== */}
        <div style={{ marginTop: 48, marginBottom: 40, paddingTop: 20, borderTop: `1px solid ${C.rule}` }}>
          <div
            onClick={() => setShowEggInfo(!showEggInfo)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              opacity: 0.5, transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = showEggInfo ? '0.8' : '0.5')}
          >
            <svg width={12} height={16} viewBox="0 0 12 16" fill="none">
              <path d="M6 0.5C4.2 0.5 1 4.5 1 9.5C1 12.5 3.2 15 6 15C8.8 15 11 12.5 11 9.5C11 4.5 7.8 0.5 6 0.5Z" fill={C.text3} />
            </svg>
            <span style={{ fontFamily: SANS, fontSize: 12, color: C.text3 }}>What are eggs?</span>
            <span style={{ fontSize: 8, color: C.text3 }}>{showEggInfo ? '▲' : '▼'}</span>
          </div>

          {showEggInfo && (
            <div style={{ marginTop: 16, animation: 'fadeIn 0.2s ease' }}>
              <p style={{ fontFamily: SANS, fontSize: 12, color: C.text3, margin: '0 0 14px', lineHeight: 1.6 }}>
                Eggs are a quiet way to track your contributions to the community. Cook, contribute recipes, and get your notes liked to earn them.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {EGG_TIERS.map(tier => (
                  <div key={tier.name} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8,
                    background: `${tier.color}08`, border: `1px solid ${tier.color}15`,
                  }}>
                    <svg width={11} height={14} viewBox="0 0 12 16" fill="none">
                      <path d="M6 0.5C4.2 0.5 1 4.5 1 9.5C1 12.5 3.2 15 6 15C8.8 15 11 12.5 11 9.5C11 4.5 7.8 0.5 6 0.5Z" fill={tier.color} />
                    </svg>
                    <span style={{ fontFamily: SANS, fontSize: 11, color: tier.color, fontWeight: 500 }}>{tier.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: C.text3 }}>{tier.min}+</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', background: C.warm, borderRadius: 8, border: `1px solid ${C.ruleLight}` }}>
                {[
                  { action: 'Contribute a recipe', eggs: '+100' },
                  { action: 'Someone cooks your recipe', eggs: '+5' },
                  { action: 'Someone saves your recipe', eggs: '+2' },
                  { action: 'Someone likes your note', eggs: '+1' },
                  { action: 'Cook a recipe', eggs: '+1' },
                ].map(row => (
                  <div key={row.action} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${C.ruleLight}` }}>
                    <span style={{ fontFamily: SANS, fontSize: 11, color: C.text3 }}>{row.action}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: C.text3 }}>{row.eggs}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `1.5px solid ${C.text}`, marginTop: 32 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px clamp(16px,4vw,24px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Recipe Index<EggDot size={6} /></p>
              <p style={{ fontSize: 11, color: C.text3, margin: 0, maxWidth: 320, lineHeight: 1.5, fontFamily: SANS }}>Recipes are free to read, use, and share. No ads. No paywalls. Always.</p>
            </div>
            <div style={{ fontSize: 11, color: C.text3, fontFamily: MONO }}>
              <p style={{ margin: 0 }}><span style={{ color: C.accent, cursor: 'pointer' }} onClick={() => router.push('/')}>Home</span> · <span style={{ color: C.accent, cursor: 'pointer' }} onClick={() => router.push('/profile')}>Profile</span></p>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: SANS }}>© 2026 RecDex · Public Benefit Corporation</span>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: MONO }}>recipeindex.org</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ===== EMPTY STATE =====
function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.6 }}>{icon}</div>
      <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text, margin: '0 0 8px' }}>{title}</h3>
      <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3, lineHeight: 1.6, margin: 0 }}>{subtitle}</p>
    </div>
  )
}
