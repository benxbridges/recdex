'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/app/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────────────
export type Profile = {
  id: string
  handle: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type AuthState = {
  user: User | null
  profile: Profile | null
  loading: boolean
}

// ── Handle validation ────────────────────────────────────────────────────────
// Matches the CHECK constraint on profiles.handle. Keep these in sync with
// supabase/auth-profiles-setup.sql.
const HANDLE_RE = /^[a-z][a-z0-9_]{2,19}$/

export function validateHandle(handle: string): string | null {
  if (!handle) return 'Handle is required'
  const lower = handle.toLowerCase()
  if (lower.length < 3) return 'Must be at least 3 characters'
  if (lower.length > 20) return 'Must be 20 characters or fewer'
  if (!HANDLE_RE.test(lower)) {
    return 'Lowercase letters, numbers and underscores only — must start with a letter'
  }
  return null
}

export async function isHandleAvailable(handle: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('handle_is_available', {
    p_handle: handle.toLowerCase(),
  })
  if (error) {
    console.error('[auth] handle_is_available rpc failed:', error)
    return false
  }
  return !!data
}

// ── useAuth hook ─────────────────────────────────────────────────────────────
// Subscribes to Supabase's auth state and loads the matching profile row.
// Re-fetches profile whenever the user changes.
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, profile: null, loading: true })

  useEffect(() => {
    let mounted = true

    async function loadProfile(user: User | null): Promise<Profile | null> {
      if (!user) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      if (error) {
        console.error('[auth] profile load failed:', error)
        return null
      }
      return (data as Profile | null) ?? null
    }

    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null
      const profile = await loadProfile(user)
      if (mounted) setState({ user, profile, loading: false })
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      const profile = await loadProfile(user)
      if (mounted) setState({ user, profile, loading: false })
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return state
}

// ── Auth actions ─────────────────────────────────────────────────────────────
export async function signUp(opts: {
  email: string
  password: string
  handle: string
  displayName?: string
}) {
  return supabase.auth.signUp({
    email: opts.email,
    password: opts.password,
    options: {
      data: {
        handle: opts.handle.toLowerCase(),
        display_name: opts.displayName ?? opts.handle,
      },
      emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
    },
  })
}

export async function signIn(opts: { email: string; password: string }) {
  return supabase.auth.signInWithPassword(opts)
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function requestPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/reset/confirm` : undefined,
  })
}

export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password })
}

export async function updateProfile(patch: Partial<Pick<Profile, 'display_name' | 'bio' | 'avatar_url'>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error('Not signed in') as Error, data: null }
  return supabase.from('profiles').update(patch).eq('id', user.id).select().single()
}
