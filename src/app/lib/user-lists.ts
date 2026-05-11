'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/lib/auth'
import { safeGetItem, safeSetItem } from '@/app/lib/format'

// User-curated recipe collections. Mirrors the same shape the existing UI in
// /lists/page.tsx already expects, so the page can stay mostly unchanged.
//   - Signed out: localStorage key `recdex-lists` (UserList[])
//   - Signed in:  public.user_lists (+ public.user_list_recipes), RLS-scoped
// On first sign-in we migrate any local lists to DB once (idempotent).

export type UserList = {
  id: string
  name: string
  description: string
  recipeIds: string[]
  createdAt: number    // unix ms, preserved from existing UI
  updatedAt: number
  isPublic?: boolean
}

const LS_KEY = 'recdex-lists'
const MIGRATED_FLAG = (userId: string) => `recdex-lists-migrated-${userId}`

function readLocalLists(): UserList[] {
  try {
    const raw = safeGetItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeLocal)
  } catch {
    return []
  }
}

function writeLocalLists(lists: UserList[]) {
  safeSetItem(LS_KEY, JSON.stringify(lists))
}

function normalizeLocal(raw: unknown): UserList {
  const r = raw as Partial<UserList>
  return {
    id: typeof r.id === 'string' ? r.id : crypto.randomUUID(),
    name: r.name ?? '',
    description: r.description ?? '',
    recipeIds: Array.isArray(r.recipeIds) ? r.recipeIds.filter((x): x is string => typeof x === 'string') : [],
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : Date.now(),
    isPublic: !!r.isPublic,
  }
}

// ── DB <→> UserList shape ───────────────────────────────────────────────────
type DbList = {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  user_list_recipes?: { recipe_id: string; position: number }[]
}

function fromDb(row: DbList): UserList {
  const members = (row.user_list_recipes ?? []).slice().sort((a, b) => a.position - b.position)
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    recipeIds: members.map(m => m.recipe_id),
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
    isPublic: row.is_public,
  }
}

async function fetchRemoteLists(userId: string): Promise<UserList[]> {
  const { data, error } = await supabase
    .from('user_lists')
    .select('id, user_id, name, description, is_public, created_at, updated_at, user_list_recipes (recipe_id, position)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('[user-lists] fetch failed:', error); return [] }
  return (data as DbList[] | null ?? []).map(fromDb)
}

async function migrateListsIfNeeded(userId: string) {
  if (safeGetItem(MIGRATED_FLAG(userId)) === '1') return
  const local = readLocalLists()
  if (local.length === 0) { safeSetItem(MIGRATED_FLAG(userId), '1'); return }

  for (const list of local) {
    // Preserve the localStorage id so cross-device references survive.
    const { error: listErr } = await supabase
      .from('user_lists')
      .upsert({
        id: list.id,
        user_id: userId,
        name: list.name || 'Untitled',
        description: list.description || null,
        is_public: !!list.isPublic,
        created_at: new Date(list.createdAt).toISOString(),
        updated_at: new Date(list.updatedAt).toISOString(),
      }, { ignoreDuplicates: true })
    if (listErr) { console.error('[user-lists] migration: insert list failed', list.id, listErr); continue }

    if (list.recipeIds.length > 0) {
      const rows = list.recipeIds.map((recipe_id, position) => ({
        list_id: list.id, recipe_id, position,
      }))
      const { error: memErr } = await supabase
        .from('user_list_recipes')
        .upsert(rows, { ignoreDuplicates: true })
      if (memErr) console.error('[user-lists] migration: insert members failed', list.id, memErr)
    }
  }
  safeSetItem(MIGRATED_FLAG(userId), '1')
}

// ── Hook ────────────────────────────────────────────────────────────────────
export type CreateInput = {
  name: string
  description?: string
  recipeIds?: string[]
  isPublic?: boolean
}

export type UpdateInput = Partial<CreateInput>

export type UseUserLists = {
  lists: UserList[]
  loading: boolean
  createList: (input: CreateInput) => Promise<UserList | null>
  updateList: (id: string, patch: UpdateInput) => Promise<void>
  deleteList: (id: string) => Promise<void>
  addRecipe: (listId: string, recipeId: string) => Promise<void>
  removeRecipe: (listId: string, recipeId: string) => Promise<void>
}

export function useUserLists(): UseUserLists {
  const { user, loading: authLoading } = useAuth()
  const [lists, setLists] = useState<UserList[]>([])
  const [loading, setLoading] = useState(true)

  // Load + sync whenever sign-in state changes.
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      if (authLoading) return
      if (!user) {
        if (cancelled) return
        setLists(readLocalLists())
        setLoading(false)
        return
      }
      await migrateListsIfNeeded(user.id)
      const remote = await fetchRemoteLists(user.id)
      if (cancelled) return
      setLists(remote)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [user, authLoading])

  const createList = useCallback(async (input: CreateInput): Promise<UserList | null> => {
    const now = Date.now()
    const id = crypto.randomUUID()
    const newList: UserList = {
      id,
      name: input.name.trim(),
      description: (input.description ?? '').trim(),
      recipeIds: input.recipeIds ?? [],
      createdAt: now,
      updatedAt: now,
      isPublic: !!input.isPublic,
    }

    setLists(prev => [newList, ...prev])

    if (user) {
      const { error: listErr } = await supabase.from('user_lists').insert({
        id, user_id: user.id,
        name: newList.name,
        description: newList.description || null,
        is_public: newList.isPublic,
      })
      if (listErr) {
        console.error('[user-lists] create failed, reverting:', listErr)
        setLists(prev => prev.filter(l => l.id !== id))
        return null
      }
      if (newList.recipeIds.length > 0) {
        const rows = newList.recipeIds.map((recipe_id, position) => ({ list_id: id, recipe_id, position }))
        const { error: memErr } = await supabase.from('user_list_recipes').insert(rows)
        if (memErr) console.error('[user-lists] create: insert members failed:', memErr)
      }
    } else {
      writeLocalLists([newList, ...readLocalLists()])
    }
    return newList
  }, [user])

  const updateList = useCallback(async (id: string, patch: UpdateInput): Promise<void> => {
    const now = Date.now()
    let prevSnapshot: UserList | null = null
    setLists(prev => {
      const next = prev.map(l => {
        if (l.id !== id) return l
        prevSnapshot = l
        return {
          ...l,
          name: patch.name !== undefined ? patch.name.trim() : l.name,
          description: patch.description !== undefined ? patch.description.trim() : l.description,
          recipeIds: patch.recipeIds !== undefined ? patch.recipeIds : l.recipeIds,
          isPublic: patch.isPublic !== undefined ? !!patch.isPublic : l.isPublic,
          updatedAt: now,
        }
      })
      return next
    })

    if (user) {
      const updates: Record<string, unknown> = {}
      if (patch.name !== undefined) updates.name = patch.name.trim()
      if (patch.description !== undefined) updates.description = patch.description.trim() || null
      if (patch.isPublic !== undefined) updates.is_public = !!patch.isPublic

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('user_lists').update(updates).eq('id', id)
        if (error) {
          console.error('[user-lists] update failed, reverting:', error)
          if (prevSnapshot) setLists(prev => prev.map(l => (l.id === id ? prevSnapshot! : l)))
          return
        }
      }

      if (patch.recipeIds !== undefined) {
        // Replace membership: delete all, re-insert in order.
        const { error: delErr } = await supabase.from('user_list_recipes').delete().eq('list_id', id)
        if (delErr) { console.error('[user-lists] update members: delete failed:', delErr); return }
        if (patch.recipeIds.length > 0) {
          const rows = patch.recipeIds.map((recipe_id, position) => ({ list_id: id, recipe_id, position }))
          const { error: insErr } = await supabase.from('user_list_recipes').insert(rows)
          if (insErr) console.error('[user-lists] update members: insert failed:', insErr)
        }
      }
    } else {
      writeLocalLists(readLocalLists().map(l => {
        if (l.id !== id) return l
        return {
          ...l,
          name: patch.name !== undefined ? patch.name.trim() : l.name,
          description: patch.description !== undefined ? patch.description.trim() : l.description,
          recipeIds: patch.recipeIds !== undefined ? patch.recipeIds : l.recipeIds,
          isPublic: patch.isPublic !== undefined ? !!patch.isPublic : l.isPublic,
          updatedAt: now,
        }
      }))
    }
  }, [user])

  const deleteList = useCallback(async (id: string): Promise<void> => {
    let snapshot: UserList | null = null
    setLists(prev => {
      snapshot = prev.find(l => l.id === id) ?? null
      return prev.filter(l => l.id !== id)
    })
    if (user) {
      const { error } = await supabase.from('user_lists').delete().eq('id', id)
      if (error) {
        console.error('[user-lists] delete failed, reverting:', error)
        if (snapshot) setLists(prev => [snapshot!, ...prev])
      }
    } else {
      writeLocalLists(readLocalLists().filter(l => l.id !== id))
    }
  }, [user])

  const addRecipe = useCallback(async (listId: string, recipeId: string): Promise<void> => {
    let already = false
    setLists(prev => prev.map(l => {
      if (l.id !== listId) return l
      if (l.recipeIds.includes(recipeId)) { already = true; return l }
      return { ...l, recipeIds: [...l.recipeIds, recipeId], updatedAt: Date.now() }
    }))
    if (already) return
    if (user) {
      const position = (lists.find(l => l.id === listId)?.recipeIds.length ?? 0)
      const { error } = await supabase.from('user_list_recipes').insert({ list_id: listId, recipe_id: recipeId, position })
      if (error) {
        console.error('[user-lists] addRecipe failed, reverting:', error)
        setLists(prev => prev.map(l => l.id === listId ? { ...l, recipeIds: l.recipeIds.filter(r => r !== recipeId) } : l))
      }
    } else {
      writeLocalLists(readLocalLists().map(l =>
        l.id === listId && !l.recipeIds.includes(recipeId)
          ? { ...l, recipeIds: [...l.recipeIds, recipeId], updatedAt: Date.now() }
          : l
      ))
    }
  }, [user, lists])

  const removeRecipe = useCallback(async (listId: string, recipeId: string): Promise<void> => {
    setLists(prev => prev.map(l =>
      l.id === listId ? { ...l, recipeIds: l.recipeIds.filter(r => r !== recipeId), updatedAt: Date.now() } : l
    ))
    if (user) {
      const { error } = await supabase.from('user_list_recipes').delete().eq('list_id', listId).eq('recipe_id', recipeId)
      if (error) {
        console.error('[user-lists] removeRecipe failed, reverting:', error)
        setLists(prev => prev.map(l => l.id === listId ? { ...l, recipeIds: [...l.recipeIds, recipeId] } : l))
      }
    } else {
      writeLocalLists(readLocalLists().map(l =>
        l.id === listId ? { ...l, recipeIds: l.recipeIds.filter(r => r !== recipeId), updatedAt: Date.now() } : l
      ))
    }
  }, [user])

  return { lists, loading, createList, updateList, deleteList, addRecipe, removeRecipe }
}
