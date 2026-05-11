'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/lib/auth'
import { safeGetItem, safeSetItem } from '@/app/lib/format'

// The Box — recipes a user has bookmarked. Single source of truth:
//   - Signed out: localStorage key `recdex-box` (string[] of recipe IDs)
//   - Signed in:  public.saved_recipes (RLS-scoped to auth.uid())
// On first sign-in we migrate any local Box to DB once (idempotent) so
// people don't lose their saves when they upgrade.

const LS_KEY = 'recdex-box'
const MIGRATED_FLAG = (userId: string) => `recdex-box-migrated-${userId}`

function readLocalBox(): string[] {
  try {
    const raw = safeGetItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeLocalBox(ids: string[]) {
  safeSetItem(LS_KEY, JSON.stringify(ids))
}

async function migrateBoxIfNeeded(userId: string) {
  if (safeGetItem(MIGRATED_FLAG(userId)) === '1') return
  const local = readLocalBox()
  if (local.length === 0) {
    safeSetItem(MIGRATED_FLAG(userId), '1')
    return
  }
  const rows = local.map(id => ({ user_id: userId, recipe_id: id }))
  // Idempotent — primary key (user_id, recipe_id) makes duplicates a no-op.
  const { error } = await supabase.from('saved_recipes').upsert(rows, { ignoreDuplicates: true })
  if (error) {
    console.error('[saved-recipes] migration failed:', error)
    return
  }
  safeSetItem(MIGRATED_FLAG(userId), '1')
}

async function fetchRemoteIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('saved_recipes')
    .select('recipe_id')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
  if (error) {
    console.error('[saved-recipes] fetch failed:', error)
    return []
  }
  return (data ?? []).map(r => r.recipe_id as string)
}

export type UseSavedRecipes = {
  savedIds: Set<string>
  loading: boolean
  isSaved: (recipeId: string) => boolean
  save: (recipeId: string) => Promise<void>
  unsave: (recipeId: string) => Promise<void>
  toggle: (recipeId: string) => Promise<void>
}

export function useSavedRecipes(): UseSavedRecipes {
  const { user, loading: authLoading } = useAuth()
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Load + sync. Re-runs whenever the user transitions in/out of signed-in.
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      if (authLoading) return
      if (!user) {
        if (cancelled) return
        setSavedIds(new Set(readLocalBox()))
        setLoading(false)
        return
      }
      await migrateBoxIfNeeded(user.id)
      const ids = await fetchRemoteIds(user.id)
      if (cancelled) return
      setSavedIds(new Set(ids))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [user, authLoading])

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds])

  const save = useCallback(async (recipeId: string) => {
    setSavedIds(prev => {
      if (prev.has(recipeId)) return prev
      const next = new Set(prev); next.add(recipeId); return next
    })
    if (user) {
      const { error } = await supabase
        .from('saved_recipes')
        .upsert({ user_id: user.id, recipe_id: recipeId }, { ignoreDuplicates: true })
      if (error) {
        console.error('[saved-recipes] save failed, reverting:', error)
        setSavedIds(prev => { const next = new Set(prev); next.delete(recipeId); return next })
      }
    } else {
      const local = readLocalBox()
      if (!local.includes(recipeId)) writeLocalBox([...local, recipeId])
    }
  }, [user])

  const unsave = useCallback(async (recipeId: string) => {
    setSavedIds(prev => {
      if (!prev.has(recipeId)) return prev
      const next = new Set(prev); next.delete(recipeId); return next
    })
    if (user) {
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId)
      if (error) {
        console.error('[saved-recipes] unsave failed, reverting:', error)
        setSavedIds(prev => { const next = new Set(prev); next.add(recipeId); return next })
      }
    } else {
      writeLocalBox(readLocalBox().filter(id => id !== recipeId))
    }
  }, [user])

  const toggle = useCallback(async (recipeId: string) => {
    if (savedIds.has(recipeId)) await unsave(recipeId)
    else await save(recipeId)
  }, [savedIds, save, unsave])

  return { savedIds, loading, isSaved, save, unsave, toggle }
}
