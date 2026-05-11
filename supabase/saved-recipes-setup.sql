-- ============================================================================
-- SAVED RECIPES ("the Box") — per-user saves backed by Postgres
-- ============================================================================
-- Run this in Supabase SQL Editor after auth-profiles-setup.sql has been
-- applied. Fully idempotent and non-destructive (no DROPs in active path).
--
-- What this creates:
--   - table public.saved_recipes
--   - index saved_recipes_user_saved_at_idx
--   - RLS policies: select/insert/delete own rows only
--
-- Schema:
--   user_id  uuid  (FK to auth.users, cascade)
--   recipe_id uuid (FK to recipes, cascade)
--   saved_at timestamptz
--   primary key (user_id, recipe_id)  -- prevents duplicate saves
-- ============================================================================

create table if not exists public.saved_recipes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  recipe_id  uuid not null references public.recipes(id) on delete cascade,
  saved_at   timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create index if not exists saved_recipes_user_saved_at_idx
  on public.saved_recipes (user_id, saved_at desc);

alter table public.saved_recipes enable row level security;

-- Users can read their own saves only. Saves are private — your Box is not
-- public on /u/[handle] unless we add a public-saves toggle later.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'saved_recipes' and policyname = 'saved_recipes_select_own'
  ) then
    create policy "saved_recipes_select_own"
      on public.saved_recipes for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'saved_recipes' and policyname = 'saved_recipes_insert_own'
  ) then
    create policy "saved_recipes_insert_own"
      on public.saved_recipes for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'saved_recipes' and policyname = 'saved_recipes_delete_own'
  ) then
    create policy "saved_recipes_delete_own"
      on public.saved_recipes for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- ============================================================================
-- ROLLBACK (commented — uncomment and run manually to undo)
-- ============================================================================
-- drop table if exists public.saved_recipes;
