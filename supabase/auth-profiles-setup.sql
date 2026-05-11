-- ============================================================================
-- AUTH FOUNDATION: profiles + handle-based identity
-- ============================================================================
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- It is idempotent — safe to re-run.
--
-- After running, in Dashboard → Authentication → Settings:
--   - Site URL: set to https://recipeindex.org (and add http://localhost:3000 to
--     "Additional Redirect URLs" for dev)
--   - Email Confirmation: leave ENABLED for prod (users must confirm before
--     they can sign in). Disable temporarily in dev if you want to skip it.
-- ============================================================================

-- ── profiles ────────────────────────────────────────────────────────────────
-- One row per auth.users row. Handle is the unique public identifier
-- (Letterboxd-style: recipeindex.org/u/<handle>).
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text not null unique,
  display_name  text,
  bio           text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Handle rules: 3-20 chars, lowercase letters/digits/underscore, must start with letter.
  constraint handle_format check (handle ~ '^[a-z][a-z0-9_]{2,19}$')
);

create index if not exists profiles_handle_idx on public.profiles (handle);

-- ── Reserved handles ────────────────────────────────────────────────────────
-- App route segments + common reserved words. Block users from claiming them.
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

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Anyone can read profiles (they're public).
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

-- Authenticated users can insert their own profile (during signup).
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Owners can update their own profile.
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── Updated-at trigger ─────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ── Auto-create profile on signup ───────────────────────────────────────────
-- Reads handle + display_name from auth.users.raw_user_meta_data (set by the
-- signup form). Falls back to email's local part if metadata is missing.
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

  -- Sanity: if signup didn't supply a handle, derive a placeholder from the
  -- email so the trigger doesn't blow up. User can claim a real handle later.
  if v_handle = '' or v_handle !~ '^[a-z][a-z0-9_]{2,19}$' then
    v_handle := regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g');
    if length(v_handle) < 3 then
      v_handle := v_handle || substr(md5(new.id::text), 1, 4);
    end if;
    if length(v_handle) > 20 then
      v_handle := substr(v_handle, 1, 20);
    end if;
  end if;

  -- Collision suffix if the chosen handle is already taken.
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

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
