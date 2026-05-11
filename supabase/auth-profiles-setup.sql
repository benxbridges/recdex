-- ============================================================================
-- AUTH FOUNDATION: profiles + handle-based identity
-- ============================================================================
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run — every operation is guarded by IF NOT EXISTS or wrapped in
-- a DO block that checks existence first. No DROPs of tables, columns, data,
-- triggers, policies, or functions you might already have.
--
-- After running, in Dashboard → Authentication → Settings:
--   - Site URL: https://recipeindex.org (and add http://localhost:3000 to
--     "Additional Redirect URLs" for dev)
--   - Email Confirmation: leave ENABLED for prod (users confirm before sign
--     in). Disable temporarily in dev to skip the confirmation email.
--
-- What this creates (nothing else is touched):
--   - table public.profiles            (one row per auth.users row)
--   - table public.reserved_handles    (handles blocked from registration)
--   - function public.set_updated_at   (generic updated_at trigger fn)
--   - function public.handle_new_user  (signup trigger fn)
--   - function public.handle_is_available (RPC for signup form)
--   - trigger profiles_set_updated_at  (only created if not present)
--   - trigger on_auth_user_created     (only created if not present)
--   - RLS policies on both tables
-- ============================================================================

-- ── Sanity check ────────────────────────────────────────────────────────────
-- Refuses to proceed if a profiles table already exists with an incompatible
-- shape. Comment this block out if you've manually pre-created profiles and
-- accept the column-mismatch risk.
do $$
declare
  v_has_table boolean;
  v_has_handle boolean;
begin
  select exists(select 1 from pg_tables where schemaname = 'public' and tablename = 'profiles')
    into v_has_table;
  if v_has_table then
    select exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'handle'
    ) into v_has_handle;
    if not v_has_handle then
      raise exception 'public.profiles exists but has no handle column. Refusing to proceed — inspect the table manually and reconcile before re-running.';
    end if;
  end if;
end $$;

-- ── profiles ────────────────────────────────────────────────────────────────
-- One row per auth.users row. handle is the unique public identifier
-- (Letterboxd-style: recipeindex.org/u/<handle>).
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text not null unique,
  display_name  text,
  bio           text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Handle rules: 3-20 chars, lowercase letters/digits/underscore, must start with a letter.
  constraint handle_format check (handle ~ '^[a-z][a-z0-9_]{2,19}$')
);

create index if not exists profiles_handle_idx on public.profiles (handle);

-- ── reserved_handles ────────────────────────────────────────────────────────
-- App route segments + common reserved words. Blocked from registration.
create table if not exists public.reserved_handles (
  handle text primary key
);

insert into public.reserved_handles (handle) values
  ('admin'), ('api'), ('auth'), ('about'), ('browse'), ('community'),
  ('contribute'), ('cook'), ('help'), ('home'), ('leaderboard'), ('lists'),
  ('login'), ('logout'), ('pantry'), ('profile'), ('recipe'), ('recipes'),
  ('scan'), ('search'), ('settings'), ('signin'), ('signup'), ('support'),
  ('terms'), ('tools'), ('trending'), ('u'), ('user'), ('users'),
  ('me'), ('you'), ('we'), ('them'), ('null'), ('undefined'),
  ('recdex'), ('recipeindex'), ('benxbridges'), ('ben'),
  ('mod'), ('moderator'), ('staff'), ('team'), ('official')
on conflict (handle) do nothing;

-- ── RLS: profiles ──────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Anyone (even logged-out) can read profiles — they're public pages.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_public'
  ) then
    create policy "profiles_select_public"
      on public.profiles for select
      using (true);
  end if;
end $$;

-- Authenticated users can insert their own profile row.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_insert_self'
  ) then
    create policy "profiles_insert_self"
      on public.profiles for insert
      with check (auth.uid() = id);
  end if;
end $$;

-- Owners can update their own profile.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_self'
  ) then
    create policy "profiles_update_self"
      on public.profiles for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

-- ── RLS: reserved_handles ──────────────────────────────────────────────────
-- Public can read so the client signup form can render hints. Nobody can
-- write — only owner-of-database / superuser can modify the reserved list
-- (bypasses RLS). The handle_is_available RPC is SECURITY DEFINER so it
-- reads regardless of the caller's session.
alter table public.reserved_handles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reserved_handles' and policyname = 'reserved_handles_select_public'
  ) then
    create policy "reserved_handles_select_public"
      on public.reserved_handles for select
      using (true);
  end if;
end $$;

-- ── Generic updated_at trigger fn ──────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger: profiles.updated_at maintained on update. Only created if missing.
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'profiles_set_updated_at'
      and tgrelid = 'public.profiles'::regclass
  ) then
    create trigger profiles_set_updated_at
      before update on public.profiles
      for each row execute procedure public.set_updated_at();
  end if;
end $$;

-- ── Auto-create profile on signup ───────────────────────────────────────────
-- Reads handle + display_name from auth.users.raw_user_meta_data (set by the
-- signup form). Falls back to email's local-part if signup metadata is
-- missing. Always lands on a valid, unused handle.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_handle text;
  v_display_name text;
begin
  v_handle := lower(coalesce(new.raw_user_meta_data->>'handle', ''));
  v_display_name := coalesce(new.raw_user_meta_data->>'display_name', v_handle);

  -- If signup didn't supply a valid handle, derive a placeholder from the
  -- email so the trigger doesn't blow up. User can claim a real handle later.
  if v_handle = '' or v_handle !~ '^[a-z][a-z0-9_]{2,19}$' then
    v_handle := regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g');
    if length(v_handle) < 3 then
      v_handle := v_handle || substr(md5(new.id::text), 1, 4);
    end if;
    if length(v_handle) > 20 then
      v_handle := substr(v_handle, 1, 20);
    end if;
    -- Ensure leading char is a letter.
    if v_handle !~ '^[a-z]' then
      v_handle := 'u' || substr(v_handle, 1, 19);
    end if;
  end if;

  -- Collision suffix if the chosen handle is already taken or reserved.
  while exists (select 1 from public.profiles where handle = v_handle)
     or exists (select 1 from public.reserved_handles where handle = v_handle)
  loop
    v_handle := substr(v_handle, 1, 16) || substr(md5(random()::text), 1, 4);
  end loop;

  insert into public.profiles (id, handle, display_name)
  values (new.id, v_handle, coalesce(nullif(v_display_name, ''), v_handle));

  return new;
end;
$$;

-- Trigger on auth.users. Only created if missing.
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;

-- ── Handle availability RPC ─────────────────────────────────────────────────
-- The signup form calls this to live-check whether a handle is free.
-- Returns true if the handle is valid, unreserved, and not in use.
create or replace function public.handle_is_available(p_handle text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_handle text := lower(p_handle);
begin
  if v_handle is null then return false; end if;
  if v_handle !~ '^[a-z][a-z0-9_]{2,19}$' then return false; end if;
  if exists (select 1 from public.reserved_handles where handle = v_handle) then return false; end if;
  if exists (select 1 from public.profiles where handle = v_handle) then return false; end if;
  return true;
end;
$$;

grant execute on function public.handle_is_available(text) to anon, authenticated;

-- ============================================================================
-- ROLLBACK (commented out — uncomment and run manually to undo)
-- ============================================================================
-- This will permanently delete all profiles and the reserved list. It will
-- NOT delete auth.users rows. Run only if you want to fully reverse the
-- migration above.
--
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop trigger if exists profiles_set_updated_at on public.profiles;
-- drop function if exists public.handle_is_available(text);
-- drop function if exists public.handle_new_user();
-- drop function if exists public.set_updated_at();
-- drop table if exists public.reserved_handles;
-- drop table if exists public.profiles;
