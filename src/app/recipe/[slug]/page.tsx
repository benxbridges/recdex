'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

// ===== DESIGN TOKENS =====
const C = {
  bg: '#FEFDFB', warm: '#F5F2EC', cool: '#F8F6F1',
  text: '#1A1A18', text2: '#5C5647', text3: '#9C9585',
  rule: '#D4CDBE', ruleLight: '#E8E4DB',
  accent: '#C84A2A', accentBg: '#FDF3F0', accentMed: 'rgba(200,74,42,0.2)',
  green: '#4A6741', greenBg: '#F0F5EE',
  gold: '#A8862A', goldBg: '#FBF7ED',
  eggPoint: '#E8A44A',
}
const SERIF = "'Source Serif 4', Georgia, serif"
const SANS = "'DM Sans', system-ui, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

// ===== TYPES =====
type IngredientItem = { name: string; amount: string; unit: string; notes?: string }
type Step = { step: number; text: string; timer_minutes: number | null }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawIngredients = any[]

type Recipe = {
  id: string; slug: string; title: string; description: string | null
  cuisine: string | null; category_id: string | null; difficulty: string
  time_total: number | null; time_active: number | null
  time_passive: number | null; time_passive_label: string | null
  image_url: string | null; servings: number | null; servings_label: string | null
  tags: string[] | null
  ingredients: RawIngredients; steps: Step[]
}

// ===== HELPERS =====
function getIngredientItems(ingredients: RawIngredients): IngredientItem[] {
  if (!ingredients || ingredients.length === 0) return []
  if (ingredients[0]?.group) return ingredients.flatMap((g: { items: IngredientItem[] }) => g.items || [])
  return ingredients as IngredientItem[]
}

function formatTime(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes >= 60) { const h = Math.floor(minutes / 60), m = minutes % 60; return m > 0 ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}` }
  return `${minutes} min`
}

// ===== SMALL COMPONENTS =====
function EggDot({ size = 9 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <span style={{ display: 'inline-block', width: size, height: h, marginLeft: 2, background: C.accent, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', verticalAlign: 'baseline', marginBottom: -1 }} />
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles: Record<string, { color: string; bg: string }> = {
    easy: { color: C.green, bg: C.greenBg }, medium: { color: C.gold, bg: C.goldBg }, hard: { color: C.accent, bg: C.accentBg },
  }
  const s = styles[difficulty] || styles.easy
  return <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: s.color, background: s.bg, padding: '3px 8px', borderRadius: 2, fontFamily: MONO }}>{difficulty}</span>
}

function BrokenEggSVG({ width = 60 }: { width?: number }) {
  const h = width * 0.75
  return (
    <svg width={width} height={h} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="115" rx="55" ry="18" fill="#E8E4DB" opacity="0.5" />
      <ellipse cx="100" cy="113" rx="48" ry="14" fill="#F5F2EC" />
      <g transform="translate(42, 30) rotate(-8)">
        <path d="M0 50 C0 22, 12 0, 28 0 C44 0, 56 22, 56 50 L50 52 L42 48 L34 54 L26 46 L18 52 L10 48 L0 50Z" fill="#F5F2EC" stroke="#D4CDBE" strokeWidth="1.5" />
        <path d="M8 45 C8 25, 16 8, 28 8 C40 8, 48 25, 48 45" fill="none" stroke="#E8E4DB" strokeWidth="1" />
      </g>
      <g transform="translate(102, 35) rotate(12)">
        <path d="M0 48 L8 44 L16 50 L24 42 L32 48 L40 44 L48 50 C48 22, 36 0, 20 0 C4 0, -8 22, 0 48Z" fill="#F5F2EC" stroke="#D4CDBE" strokeWidth="1.5" />
        <path d="M8 42 C4 24, 10 8, 20 8 C30 8, 40 24, 40 42" fill="none" stroke="#E8E4DB" strokeWidth="1" />
      </g>
      <ellipse cx="100" cy="108" rx="16" ry="12" fill="#E8A44A" opacity="0.3" />
      <ellipse cx="100" cy="106" rx="13" ry="10" fill="#E8A44A" opacity="0.5" />
      <ellipse cx="98" cy="104" rx="4" ry="3" fill="#F5F2EC" opacity="0.3" />
    </svg>
  )
}

function ContributePhotoCTA() {
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ width: '100%', height: '100%', background: hovered ? '#F0EDE6' : C.warm, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s', gap: 10 }}>
      <BrokenEggSVG width={50} />
      <div style={{ padding: '8px 16px', borderRadius: 6, border: `1.5px dashed ${hovered ? C.accent : C.rule}`, background: hovered ? C.accentBg : 'rgba(255,255,255,0.6)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hovered ? C.accent : C.text3} strokeWidth="2" strokeLinecap="round" style={{ transition: 'stroke 0.15s' }}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
        </svg>
        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: SANS, color: hovered ? C.accent : C.text3, transition: 'color 0.15s' }}>Add a photo</span>
      </div>
    </div>
  )
}

function RecipeBoxNav() {
  return (
    <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 10px', borderRadius: 4, border: `1.5px solid ${C.rule}`, background: C.warm }}>
      <div style={{ position: 'relative', width: 26, height: 22 }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 14, background: '#D4A574', borderRadius: '2px 2px 3px 3px', border: '1.5px solid #B8956A' }} />
        <div style={{ position: 'absolute', top: 2, left: -1, right: -1, height: 8, background: '#C49660', borderRadius: '3px 3px 0 0', border: '1.5px solid #B8956A', borderBottom: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 4, width: 5, height: 5, background: '#F5EDE3', borderRadius: '2px 2px 0 0', border: '1px solid #D4CDBE', borderBottom: 'none' }} />
        <div style={{ position: 'absolute', top: -1, left: 11, width: 5, height: 6, background: '#fff', borderRadius: '2px 2px 0 0', border: '1px solid #D4CDBE', borderBottom: 'none' }} />
        <div style={{ position: 'absolute', top: 1, left: 18, width: 5, height: 4, background: '#F5EDE3', borderRadius: '2px 2px 0 0', border: '1px solid #D4CDBE', borderBottom: 'none' }} />
      </div>
      <div>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.text, fontFamily: SANS, lineHeight: 1 }}>My Box</span>
      </div>
    </div>
  )
}

// ===== GROCERY LIST MODAL =====
function GroceryListModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const items = getIngredientItems(recipe.ingredients)
  const toggle = (i: number) => setChecked(prev => ({ ...prev, [i]: !prev[i] }))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{`@keyframes listIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes backdropIn{from{opacity:0}to{opacity:1}}`}</style>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,24,0.4)', backdropFilter: 'blur(10px)', animation: 'backdropIn 0.2s ease' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, maxHeight: '85vh', background: C.bg, borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', animation: 'listIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.rule}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 4px', fontFamily: SANS }}>Grocery List</p>
              <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>{recipe.title}</h3>
              <p style={{ fontSize: 11, fontFamily: MONO, color: C.text3, marginTop: 2 }}>Serves {recipe.servings || 4} · {items.length} items</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: C.text3, cursor: 'pointer', padding: 4 }}>×</button>
          </div>
        </div>
        <div style={{ padding: '12px 24px 20px', overflowY: 'auto', flex: 1 }}>
          {items.map((ing, i) => (
            <div key={i} onClick={() => toggle(i)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.ruleLight}`, cursor: 'pointer' }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, border: `2px solid ${checked[i] ? C.green : C.rule}`, background: checked[i] ? C.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                {checked[i] && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: 14, fontFamily: SANS, color: checked[i] ? C.text3 : C.text, textDecoration: checked[i] ? 'line-through' : 'none', transition: 'all 0.15s' }}>
                {ing.amount && <strong>{ing.amount} {ing.unit} </strong>}{ing.name}
                {ing.notes && <span style={{ color: C.text3 }}> ({ing.notes})</span>}
              </span>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 24px 20px', borderTop: `1px solid ${C.rule}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ flex: 1, padding: '11px 16px', borderRadius: 6, border: 'none', background: C.text, color: C.bg, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></svg>
              Text to myself
            </button>
            <button style={{ flex: 1, padding: '11px 16px', borderRadius: 6, border: `1.5px solid ${C.rule}`, background: 'transparent', color: C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>
              Email
            </button>
          </div>
          <button style={{ width: '100%', marginTop: 8, padding: '10px 16px', borderRadius: 6, border: `1.5px solid ${C.rule}`, background: 'transparent', color: C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: SANS }}>Copy to clipboard</button>
        </div>
      </div>
    </div>
  )
}


// ===== RECIPE PAGE =====
export default function RecipePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [showGroceryList, setShowGroceryList] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    async function fetchRecipe() {
      setLoading(true)
      const { data } = await supabase.from('recipes').select('*').eq('slug', slug).eq('status', 'published').single()
      if (data) setRecipe(data)
      setLoading(false)
    }
    if (slug) fetchRecipe()
  }, [slug])

  // Check local storage for saved state
  useEffect(() => {
    if (!recipe) return
    const box = JSON.parse(localStorage.getItem('recdex-box') || '[]')
    setSaved(box.includes(recipe.id))
  }, [recipe])

  const toggleSave = () => {
    if (!recipe) return
    const box = JSON.parse(localStorage.getItem('recdex-box') || '[]')
    if (saved) {
      localStorage.setItem('recdex-box', JSON.stringify(box.filter((id: string) => id !== recipe.id)))
    } else {
      localStorage.setItem('recdex-box', JSON.stringify([...box, recipe.id]))
    }
    setSaved(!saved)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: C.text3 }}>Loading...</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <BrokenEggSVG width={80} />
        <p style={{ fontSize: 16, color: C.text2, fontFamily: SERIF }}>Recipe not found</p>
        <button onClick={() => router.push('/')} style={{ padding: '10px 20px', borderRadius: 4, border: 'none', background: C.text, color: C.bg, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS }}>← Back to home</button>
      </div>
    )
  }

  const ingredientItems = getIngredientItems(recipe.ingredients)
  const hasSteps = recipe.steps && recipe.steps.length > 0
  const hasIngredients = ingredientItems.length > 0

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, fontFamily: SANS }}>
              <span onClick={() => router.push('/')} style={{ color: C.text2, cursor: 'pointer' }}>← Home</span>
              <div style={{ width: 1, height: 14, background: C.rule }} />
              <RecipeBoxNav />
            </div>
          </div>
        </div>
      </header>

      {/* HERO IMAGE */}
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ width: '100%', aspectRatio: isMobile ? '16/10' : '21/9', background: C.warm, overflow: 'hidden' }}>
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <ContributePhotoCTA />
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* Title section */}
        <div style={{ paddingTop: 28, paddingBottom: 20, animation: 'fadeIn 0.3s ease' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 11, fontFamily: SANS, color: C.text3 }}>
            <span style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>Home</span>
            <span>›</span>
            {recipe.cuisine && <><span style={{ cursor: 'pointer' }}>{recipe.cuisine}</span><span>›</span></>}
            <span style={{ color: C.text2 }}>{recipe.title}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <DifficultyBadge difficulty={recipe.difficulty} />
            {recipe.time_total && <span style={{ fontSize: 12, fontFamily: MONO, color: C.text2 }}>{formatTime(recipe.time_total)}</span>}
            {recipe.time_active && <><span style={{ color: C.rule }}>·</span><span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{formatTime(recipe.time_active)} active</span></>}
            {recipe.cuisine && <><span style={{ color: C.rule }}>·</span><span style={{ fontSize: 12, fontFamily: SANS, color: C.text3 }}>{recipe.cuisine}</span></>}
          </div>

          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, color: C.text, lineHeight: 1.1, letterSpacing: -0.5, marginBottom: 10 }}>
            {recipe.title}
          </h1>

          {recipe.description && (
            <p style={{ fontFamily: SERIF, fontSize: 16, color: C.text2, lineHeight: 1.65, fontStyle: 'italic', maxWidth: 520, marginBottom: 16 }}>
              &ldquo;{recipe.description}&rdquo;
            </p>
          )}

          {recipe.time_passive_label && recipe.time_passive && (
            <div style={{ padding: '8px 14px', background: C.accentBg, border: `1px solid ${C.accentMed}`, borderRadius: 4, fontSize: 12, color: C.accent, fontFamily: SANS, marginBottom: 16, display: 'inline-block' }}>
              + {formatTime(recipe.time_passive)} {recipe.time_passive_label}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {hasSteps ? (
              <button onClick={() => router.push(`/recipe/${slug}/cook`)} style={{
                padding: '12px 28px', borderRadius: 6, border: 'none',
                background: C.text, color: C.bg,
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
              }}>Cook this →</button>
            ) : (
              <button disabled style={{
                padding: '12px 28px', borderRadius: 6, border: `1.5px solid ${C.ruleLight}`,
                background: 'transparent', color: C.text3,
                fontSize: 14, fontWeight: 500, fontFamily: SANS, cursor: 'default',
              }}>Steps coming soon</button>
            )}
            {hasIngredients && (
              <button onClick={() => setShowGroceryList(true)} style={{
                padding: '12px 20px', borderRadius: 6,
                border: `1.5px solid ${C.green}`, background: C.greenBg,
                color: C.green, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6" /><path d="M9 16h6" />
                </svg>
                Grocery list
              </button>
            )}
            <button onClick={toggleSave} style={{
              padding: '12px 16px', borderRadius: 6,
              border: `1.5px solid ${saved ? C.accent : C.rule}`,
              background: saved ? C.accentBg : 'transparent',
              color: saved ? C.accent : C.text3,
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? C.accent : 'none'} stroke={saved ? C.accent : 'currentColor'} strokeWidth="2" strokeLinecap="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: C.rule }} />

        {/* Ingredients */}
        {hasIngredients && (
          <div style={{ paddingTop: 24, paddingBottom: 24, animation: 'fadeIn 0.3s ease 0.05s both' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text }}>Ingredients</h2>
              <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>serves {recipe.servings || 4}{recipe.servings_label ? ` ${recipe.servings_label}` : ''}</span>
            </div>
            <div style={{ columns: isMobile ? 1 : 2, columnGap: 32 }}>
              {ingredientItems.map((item, i) => (
                <p key={i} style={{ fontSize: 15, color: C.text, margin: '6px 0', fontFamily: SANS, lineHeight: 1.5, breakInside: 'avoid' as const }}>
                  {item.amount && <span style={{ fontWeight: 600 }}>{item.amount} {item.unit} </span>}{item.name}
                  {item.notes && <span style={{ color: C.text3, fontSize: 13 }}> ({item.notes})</span>}
                </p>
              ))}
            </div>
          </div>
        )}

        {hasIngredients && hasSteps && <div style={{ height: 1, background: C.rule }} />}

        {/* Steps preview */}
        {hasSteps && (
          <div style={{ paddingTop: 24, paddingBottom: 24, animation: 'fadeIn 0.3s ease 0.1s both' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.text }}>Steps</h2>
              <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>{recipe.steps.length} steps</span>
            </div>
            {recipe.steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 4, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: MONO, fontSize: 12, fontWeight: 700,
                  background: C.ruleLight, color: C.text3,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: C.text, margin: 0 }}>{s.text}</p>
                  {s.timer_minutes && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, fontFamily: MONO, color: C.accent }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M12 2v2" /></svg>
                      {formatTime(s.timer_minutes)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <button onClick={() => router.push(`/recipe/${slug}/cook`)} style={{
              width: '100%', marginTop: 8, padding: '14px', borderRadius: 6, border: 'none',
              background: C.text, color: C.bg,
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
            }}>Start cooking →</button>
          </div>
        )}

        <div style={{ height: 1, background: C.rule }} />

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div style={{ paddingTop: 20, paddingBottom: 20 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {recipe.tags.map(tag => (
                <span key={tag} style={{ fontSize: 11, fontFamily: MONO, color: C.text3, padding: '4px 10px', background: C.cool, borderRadius: 3 }}>{tag}</span>
              ))}
            </div>
          </div>
        )}
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
              <p style={{ margin: 0 }}><span style={{ color: C.accent, cursor: 'pointer' }} onClick={() => router.push('/')}>Home</span> · <span style={{ color: C.accent, cursor: 'pointer' }}>About</span></p>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: SANS }}>© 2026 RecDex · Public Benefit Corporation</span>
            <span style={{ fontSize: 10, color: C.text3, fontFamily: MONO }}>recipeindex.org</span>
          </div>
        </div>
      </footer>

      {/* GROCERY LIST MODAL */}
      {showGroceryList && <GroceryListModal recipe={recipe} onClose={() => setShowGroceryList(false)} />}
    </div>
  )
}
