'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'
import ThemeToggle from '@/app/components/ThemeToggle'

type Ingredient = { name: string; amount: string; unit: string; notes?: string }
type Step = { step: number; text: string; timer_minutes: number | null; phase?: string }
type ScannedRecipe = {
  title: string
  description?: string
  cuisine?: string
  difficulty?: string
  servings?: number | null
  prep_time?: number | null
  cook_time?: number | null
  time_total?: number | null
  source_author?: string | null
  source_book?: string | null
  ingredients: Ingredient[]
  steps: Step[]
}

const TEMP_RECIPE_KEY = 'recdex-temp-recipe'

function formatTime(minutes: number | null | undefined): string {
  if (!minutes) return ''
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h} hr ${m} min` : `${h} hr${h > 1 ? 's' : ''}`
  }
  return `${minutes} min`
}

function getIngredientItems(ingredients: Ingredient[]): Ingredient[] {
  if (!ingredients || ingredients.length === 0) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((ingredients[0] as any)?.group) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (ingredients as any[]).flatMap((g: { items: Ingredient[] }) => g.items || [])
  }
  return ingredients
}

// ─── Camera icon ──────────────────────────────────────────────────────────

function CameraIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

// ─── Gallery icon ─────────────────────────────────────────────────────────

function GalleryIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

const MAX_PAGES = 4

export default function ScanPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const addPageInputRef = useRef<HTMLInputElement>(null)

  const [images, setImages] = useState<string[]>([])
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState('')
  const [recipe, setRecipe] = useState<ScannedRecipe | null>(null)
  const [rawText, setRawText] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    // Reset the input so picking the same file again still fires onChange
    e.target.value = ''
    if (files.length === 0) return

    setError(null)
    setRecipe(null)
    setRawText('')

    const remaining = MAX_PAGES - images.length
    if (remaining <= 0) {
      setError(`You can add up to ${MAX_PAGES} pages.`)
      return
    }
    const toAdd = files.slice(0, remaining)

    for (const file of toAdd) {
      if (!file.type.startsWith('image/')) {
        setError('Please select image files only.')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Each image must be under 10MB.')
        return
      }
    }

    Promise.all(
      toAdd.map(file => new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      }))
    ).then(dataUrls => {
      setImages(prev => [...prev, ...dataUrls].slice(0, MAX_PAGES))
    }).catch(() => setError('Could not read image. Try another file.'))
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
    setError(null)
  }

  async function handleScan() {
    if (images.length === 0) return

    setScanning(true)
    setError(null)
    setScanProgress(images.length > 1 ? `Analyzing ${images.length} pages...` : 'Analyzing image...')

    try {
      const progressTimer = setTimeout(() => setScanProgress('Extracting recipe details...'), 3000)
      const progressTimer2 = setTimeout(() => setScanProgress('Structuring ingredients and steps...'), 7000)

      const res = await fetch('/api/scan-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      })

      clearTimeout(progressTimer)
      clearTimeout(progressTimer2)

      const data = await res.json()

      if (data.error) {
        if (data.error === 'no_recipe_found') {
          setError('No recipe found in this image. Try a clearer photo of a recipe page.')
        } else {
          setError('Failed to extract recipe. Please try again with a clearer photo.')
        }
        return
      }

      if (data.recipe) {
        setRecipe(data.recipe)
        setRawText(data.raw_text || '')
        // Bring the freshly-extracted recipe into view
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setScanning(false)
      setScanProgress('')
    }
  }

  function handleCookNow() {
    if (!recipe) return

    // Build a recipe object compatible with the cook mode page
    const tempRecipe = {
      id: 'temp-scan',
      slug: 'temp-scan',
      title: recipe.title,
      description: recipe.description || null,
      cuisine: recipe.cuisine || null,
      difficulty: recipe.difficulty || 'medium',
      time_total: recipe.time_total || null,
      servings: recipe.servings || null,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      source_attribution: [recipe.source_author, recipe.source_book].filter(Boolean).join(' — ') || null,
    }

    sessionStorage.setItem(TEMP_RECIPE_KEY, JSON.stringify(tempRecipe))
    window.location.href = '/recipe/temp-scan/cook'
  }

  function handleReset() {
    setImages([])
    setRecipe(null)
    setRawText('')
    setError(null)
  }

  const ingredientItems = recipe ? getIngredientItems(recipe.ingredients) : []

  return (
    <div style={{ minHeight: '100dvh', background: C.bg }}>
      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${C.rule}`, background: C.bg,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 600, margin: '0 auto',
          padding: '12px clamp(16px, 4vw, 24px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" style={{ textDecoration: 'none', color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
            </Link>
            <h1 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>
              Scan cookbook
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12, fontFamily: SANS }}>
            <Link href="/browse" style={{ textDecoration: 'none', color: C.text2, fontSize: 11, fontWeight: 500 }}>Browse</Link>
            <Link href="/profile" style={{ textDecoration: 'none', color: C.text2, fontSize: 11, fontWeight: 500 }}>Profile</Link>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: 'clamp(16px, 4vw, 24px)' }}>

        {/* ─── No image yet: capture UI ─── */}
        {images.length === 0 && !recipe && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            {/* Camera capture button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 120, height: 120, borderRadius: '50%',
                border: `3px solid ${C.accent}`,
                background: C.accentBg,
                color: C.accent,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <CameraIcon size={48} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <p style={{
              fontFamily: SERIF, fontSize: 18, color: C.text,
              margin: '0 0 6px',
            }}>
              Take a photo
            </p>
            <p style={{
              fontFamily: SANS, fontSize: 13, color: C.text3,
              margin: '0 0 28px',
            }}>
              Snap each page — up to {MAX_PAGES}. Great for recipes that span two pages.
            </p>

            {/* Gallery upload option */}
            <button
              onClick={() => galleryInputRef.current?.click()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 8,
                border: `1px solid ${C.ruleLight}`,
                background: 'transparent',
                color: C.text2,
                fontSize: 13, fontFamily: SANS, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <GalleryIcon size={16} />
              Choose from gallery
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <p style={{
              fontFamily: SANS, fontSize: 11, color: C.text3,
              marginTop: 40, lineHeight: 1.6,
              maxWidth: 340, margin: '40px auto 0',
            }}>
              For personal use. Recipes from books are copyrighted.
            </p>
          </div>
        )}

        {/* ─── Image preview + scan button ─── */}
        {images.length > 0 && !recipe && (
          <div>
            {/* Pages header */}
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              marginBottom: 10,
            }}>
              <p style={{
                fontSize: 10, fontWeight: 700, color: C.text3,
                textTransform: 'uppercase', letterSpacing: 1.5,
                fontFamily: MONO, margin: 0,
              }}>
                {images.length} {images.length === 1 ? 'page' : 'pages'}
              </p>
              <button
                onClick={handleReset}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, fontFamily: SANS, color: C.text3, padding: 0,
                }}
              >
                Clear all
              </button>
            </div>

            {/* Image grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: images.length === 1 ? '1fr' : 'repeat(2, 1fr)',
              gap: 8,
              marginBottom: 12,
            }}>
              {images.map((src, idx) => (
                <div key={idx} style={{
                  position: 'relative', borderRadius: 10, overflow: 'hidden',
                  border: `1px solid ${C.ruleLight}`, background: C.warm,
                  aspectRatio: images.length === 1 ? undefined : '3/4',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Page ${idx + 1}`}
                    style={{
                      width: '100%', height: '100%', display: 'block',
                      maxHeight: images.length === 1 ? 400 : undefined,
                      objectFit: images.length === 1 ? 'contain' : 'cover',
                    }}
                  />
                  <span style={{
                    position: 'absolute', top: 6, left: 6,
                    padding: '3px 8px', borderRadius: 4,
                    background: 'rgba(0,0,0,0.65)', color: '#fff',
                    fontSize: 10, fontFamily: MONO, fontWeight: 600,
                  }}>
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => removeImage(idx)}
                    aria-label={`Remove page ${idx + 1}`}
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.65)', border: 'none',
                      color: '#fff', fontSize: 14, lineHeight: 1,
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Add another page */}
            {images.length < MAX_PAGES && (
              <>
                <button
                  onClick={() => addPageInputRef.current?.click()}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 10,
                    border: `1.5px dashed ${C.ruleLight}`, background: 'transparent',
                    color: C.text2, fontSize: 13, fontFamily: SANS, fontWeight: 500,
                    cursor: 'pointer', marginBottom: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1, color: C.accent }}>+</span>
                  Add another page <span style={{ color: C.text3, fontFamily: MONO, fontSize: 11 }}>({MAX_PAGES - images.length} left)</span>
                </button>
                <input
                  ref={addPageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </>
            )}

            {/* Error message */}
            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: 8,
                background: C.accentBg, border: `1px solid ${C.accentMed}`,
                marginBottom: 16,
              }}>
                <p style={{ fontSize: 13, color: C.accent, margin: 0, fontFamily: SANS }}>
                  {error}
                </p>
              </div>
            )}

            {/* Scan button */}
            <button
              onClick={handleScan}
              disabled={scanning}
              style={{
                width: '100%', padding: '14px 20px', borderRadius: 10,
                border: 'none',
                background: scanning ? C.text3 : C.accent,
                color: '#fff',
                fontSize: 15, fontWeight: 600, fontFamily: SANS,
                cursor: scanning ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'background 0.15s',
              }}
            >
              {scanning ? (
                <>
                  <span style={{
                    width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                  }} />
                  {scanProgress}
                </>
              ) : (
                images.length > 1 ? `Scan ${images.length} pages` : 'Scan Recipe'
              )}
            </button>

            <p style={{
              fontFamily: SANS, fontSize: 11, color: C.text3,
              marginTop: 12, textAlign: 'center',
            }}>
              For personal use. Recipes from books are copyrighted.
            </p>
          </div>
        )}

        {/* ─── Recipe result ─── */}
        {recipe && (
          <div>
            {/* Success header */}
            <div style={{
              padding: '16px 20px', borderRadius: 10,
              background: C.greenBg, border: `1px solid ${C.green}`,
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.green, margin: 0, fontFamily: SANS }}>
                  Recipe extracted
                </p>
              </div>
              {(recipe.source_author || recipe.source_book) && (
                <p style={{ fontSize: 12, color: C.green, margin: 0, fontFamily: SANS, opacity: 0.8, paddingLeft: 28 }}>
                  {[recipe.source_author, recipe.source_book].filter(Boolean).join(' — ')}
                </p>
              )}
            </div>

            {/* Recipe title */}
            <h2 style={{
              fontFamily: SERIF, fontSize: 22, fontWeight: 600,
              color: C.text, margin: '0 0 8px',
            }}>
              {recipe.title}
            </h2>

            {recipe.description && (
              <p style={{
                fontFamily: SANS, fontSize: 13, color: C.text2,
                margin: '0 0 16px', lineHeight: 1.5,
              }}>
                {recipe.description}
              </p>
            )}

            {/* Meta row */}
            <div style={{
              display: 'flex', gap: 16, flexWrap: 'wrap',
              marginBottom: 20, paddingBottom: 16,
              borderBottom: `1px solid ${C.ruleLight}`,
            }}>
              {recipe.time_total && (
                <div>
                  <p style={{ fontSize: 10, color: C.text3, fontFamily: SANS, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Time</p>
                  <p style={{ fontSize: 13, color: C.text, fontFamily: MONO, margin: 0 }}>{formatTime(recipe.time_total)}</p>
                </div>
              )}
              {recipe.servings && (
                <div>
                  <p style={{ fontSize: 10, color: C.text3, fontFamily: SANS, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Servings</p>
                  <p style={{ fontSize: 13, color: C.text, fontFamily: MONO, margin: 0 }}>{recipe.servings}</p>
                </div>
              )}
              <div>
                <p style={{ fontSize: 10, color: C.text3, fontFamily: SANS, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ingredients</p>
                <p style={{ fontSize: 13, color: C.text, fontFamily: MONO, margin: 0 }}>{ingredientItems.length}</p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: C.text3, fontFamily: SANS, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Steps</p>
                <p style={{ fontSize: 13, color: C.text, fontFamily: MONO, margin: 0 }}>{recipe.steps.length}</p>
              </div>
            </div>

            {/* Ingredients preview */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px' }}>
                Ingredients
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ingredientItems.slice(0, 8).map((ing, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, fontFamily: SANS, color: C.text }}>
                    <span style={{ fontFamily: MONO, color: C.text2, minWidth: 60, textAlign: 'right' }}>
                      {[ing.amount, ing.unit].filter(Boolean).join(' ') || ''}
                    </span>
                    <span>
                      {ing.name.charAt(0).toUpperCase() + ing.name.slice(1)}
                      {ing.notes && <span style={{ color: C.text3 }}> ({ing.notes})</span>}
                    </span>
                  </div>
                ))}
                {ingredientItems.length > 8 && (
                  <p style={{ fontSize: 12, color: C.text3, fontFamily: SANS, margin: '4px 0 0', fontStyle: 'italic' }}>
                    + {ingredientItems.length - 8} more
                  </p>
                )}
              </div>
            </div>

            {/* Steps preview */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px' }}>
                Steps
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recipe.steps.slice(0, 4).map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10 }}>
                    <span style={{
                      fontFamily: MONO, fontSize: 11, color: C.accent,
                      minWidth: 20, fontWeight: 600,
                    }}>
                      {step.step}
                    </span>
                    <p style={{
                      fontSize: 13, fontFamily: SANS, color: C.text2,
                      margin: 0, lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {step.text}
                    </p>
                  </div>
                ))}
                {recipe.steps.length > 4 && (
                  <p style={{ fontSize: 12, color: C.text3, fontFamily: SANS, margin: '4px 0 0 30px', fontStyle: 'italic' }}>
                    + {recipe.steps.length - 4} more steps
                  </p>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleCookNow}
                style={{
                  width: '100%', padding: '14px 20px', borderRadius: 10,
                  border: 'none', background: C.accent, color: '#fff',
                  fontSize: 15, fontWeight: 600, fontFamily: SANS,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                Cook Now
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
              </button>

              <button
                onClick={handleReset}
                style={{
                  width: '100%', padding: '12px 20px', borderRadius: 10,
                  border: `1px solid ${C.ruleLight}`, background: 'transparent',
                  color: C.text2,
                  fontSize: 13, fontWeight: 500, fontFamily: SANS,
                  cursor: 'pointer',
                }}
              >
                Scan another recipe
              </button>
            </div>

            {/* Raw text toggle */}
            {rawText && <RawTextToggle rawText={rawText} />}

            <p style={{
              fontFamily: SANS, fontSize: 11, color: C.text3,
              marginTop: 20, textAlign: 'center',
            }}>
              For personal use. Recipes from books are copyrighted.
            </p>
          </div>
        )}
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ─── Raw text expandable ──────────────────────────────────────────────────

function RawTextToggle({ rawText }: { rawText: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ marginTop: 20 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: C.text3, fontSize: 12, fontFamily: SANS,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: 0,
        }}
      >
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        Raw text from image
      </button>
      {expanded && (
        <pre style={{
          marginTop: 8, padding: 16, borderRadius: 8,
          background: C.warm, border: `1px solid ${C.ruleLight}`,
          fontSize: 12, fontFamily: MONO, color: C.text2,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          lineHeight: 1.6, maxHeight: 300, overflow: 'auto',
        }}>
          {rawText}
        </pre>
      )}
    </div>
  )
}
