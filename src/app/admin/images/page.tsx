'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { C, SERIF, SANS, MONO } from '@/app/lib/theme'

type Recipe = {
  id: string
  slug: string
  title: string
  image_url: string | null
  cuisine: string | null
}

export default function ImageReview() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [cleared, setCleared] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | 'with-image' | 'no-image'>('with-image')

  useEffect(() => {
    supabase.from('recipes').select('id, slug, title, image_url, cuisine')
      .eq('status', 'published')
      .order('title')
      .then(({ data }) => {
        if (data) setRecipes(data)
        setLoading(false)
      })
  }, [])

  const clearImage = async (id: string) => {
    await supabase.from('recipes').update({ image_url: null }).eq('id', id)
    setCleared(prev => [...prev, id])
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, image_url: null } : r))
  }

  const filtered = recipes.filter(r => {
    if (filter === 'with-image') return r.image_url && !cleared.includes(r.id)
    if (filter === 'no-image') return !r.image_url || cleared.includes(r.id)
    return true
  })

  const withImages = recipes.filter(r => r.image_url && !cleared.includes(r.id)).length
  const withoutImages = recipes.filter(r => !r.image_url || cleared.includes(r.id)).length

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '24px clamp(16px,4vw,24px)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Image Review</h1>
        <p style={{ fontFamily: SANS, fontSize: 13, color: C.text3, margin: '0 0 20px' }}>
          Click the thumbs down to remove bad images. {withImages} with images, {withoutImages} without.
          {cleared.length > 0 && <span style={{ color: C.accent, fontWeight: 600 }}> {cleared.length} cleared this session.</span>}
        </p>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['with-image', 'no-image', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 6, border: `1px solid ${filter === f ? C.accent : C.ruleLight}`,
              background: filter === f ? C.accentBg : 'transparent', color: filter === f ? C.accent : C.text3,
              fontSize: 12, fontFamily: SANS, fontWeight: 600, cursor: 'pointer',
            }}>
              {f === 'with-image' ? `With image (${withImages})` : f === 'no-image' ? `No image (${withoutImages})` : `All (${recipes.length})`}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: C.text3, fontFamily: SANS }}>Loading recipes...</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {filtered.map(recipe => (
            <div key={recipe.id} style={{
              borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.ruleLight}`, background: C.warm,
              opacity: cleared.includes(recipe.id) ? 0.4 : 1, transition: 'opacity 0.3s',
            }}>
              {/* Image area */}
              <div style={{ width: '100%', height: 150, background: C.cool, position: 'relative', overflow: 'hidden' }}>
                {recipe.image_url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={recipe.image_url} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {/* Thumbs down button */}
                    {!cleared.includes(recipe.id) && (
                      <button
                        onClick={() => clearImage(recipe.id)}
                        style={{
                          position: 'absolute', bottom: 8, right: 8,
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'rgba(220,50,50,0.85)', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, color: '#fff', backdropFilter: 'blur(4px)',
                          transition: 'transform 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
                        title="Remove this image — doesn't match recipe"
                      >
                        👎
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, fontFamily: MONO, color: C.text3 }}>No image</span>
                  </div>
                )}
              </div>
              {/* Info */}
              <div style={{ padding: '10px 12px' }}>
                <h3 style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 2px', lineHeight: 1.3 }}>{recipe.title}</h3>
                {recipe.cuisine && <span style={{ fontSize: 10, fontFamily: MONO, color: C.text3 }}>{recipe.cuisine}</span>}
                {cleared.includes(recipe.id) && (
                  <span style={{ display: 'block', fontSize: 10, fontFamily: MONO, color: C.accent, fontWeight: 600, marginTop: 4 }}>Image removed</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: C.text3, fontFamily: SANS, fontSize: 14, padding: '40px 0' }}>
            {filter === 'with-image' ? 'No recipes with images.' : filter === 'no-image' ? 'All recipes have images!' : 'No recipes found.'}
          </p>
        )}
      </div>
    </div>
  )
}
