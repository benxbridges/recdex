-- ============================================================================
-- USER LISTS — bookmarked collections (e.g. "Weeknight standbys")
-- ============================================================================
-- Run this after auth-profiles-setup.sql and saved-recipes-setup.sql.
-- Fully idempotent and non-destructive.
--
-- What this creates:
--   - table public.user_lists           (one row per list)
--   - table public.user_list_recipes    (recipe membership)
--   - indexes for user-scoped fetches
--   - trigger user_lists_set_updated_at (only created if not present)
--   - RLS policies on both tables
-- ============================================================================

create table if not exists public.user_lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null check (length(trim(name)) between 1 and 80),
  description text,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists user_lists_user_idx
  on public.user_lists (user_id, created_at desc);

create index if not exists user_lists_public_idx
  on public.user_lists (is_public, created_at desc)
  where is_public = true;

create table if not exists public.user_list_recipes (
  list_id    uuid not null references public.user_lists(id) on delete cascade,
  recipe_id  uuid not null references public.recipes(id) on delete cascade,
  position   integer not null default 0,
  added_at   timestamptz not null default now(),
  primary key (list_id, recipe_id)
);

create index if not exists user_list_recipes_list_idx
  on public.user_list_recipes (list_id, position, added_at);

-- ── updated_at trigger on user_lists ───────────────────────────────────────
-- Reuses public.set_updated_at() from auth-profiles-setup.sql.
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'user_lists_set_updated_at'
      and tgrelid = 'public.user_lists'::regclass
  ) then
    create trigger user_lists_set_updated_at
      before update on public.user_lists
      for each row execute procedure public.set_updated_at();
  end if;
end $$;

-- ── RLS: user_lists ────────────────────────────────────────────────────────
alter table public.user_lists enable row level security;

-- A list is readable by its owner, or by anyone if is_public = true.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_lists' and policyname = 'user_lists_select_visible'
  ) then
    create policy "user_lists_select_visible"
      on public.user_lists for select
      using (auth.uid() = user_id or is_public = true);
  end if;
end $$;

-- Owner inserts their own list (user_id must match auth.uid()).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_lists' and policyname = 'user_lists_insert_own'
  ) then
    create policy "user_lists_insert_own"
      on public.user_lists for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Owner updates / renames / publishes their own list.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_lists' and policyname = 'user_lists_update_own'
  ) then
    create policy "user_lists_update_own"
      on public.user_lists for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Owner deletes their own list. Cascades to user_list_recipes.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_lists' and policyname = 'user_lists_delete_own'
  ) then
    create policy "user_lists_delete_own"
      on public.user_lists for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- ── RLS: user_list_recipes ─────────────────────────────────────────────────
alter table public.user_list_recipes enable row level security;

-- Visible if the parent list is visible (owner or public).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_list_recipes' and policyname = 'user_list_recipes_select_visible'
  ) then
    create policy "user_list_recipes_select_visible"
      on public.user_list_recipes for select
      using (
        exists (
          select 1 from public.user_lists l
          where l.id = list_id and (l.user_id = auth.uid() or l.is_public = true)
        )
      );
  end if;
end $$;

-- Insert / update / delete only if you own the parent list.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_list_recipes' and policyname = 'user_list_recipes_write_owner'
  ) then
    create policy "user_list_recipes_write_owner"
      on public.user_list_recipes for all
      using (
        exists (select 1 from public.user_lists l where l.id = list_id and l.user_id = auth.uid())
      )
      with check (
        exists (select 1 from public.user_lists l where l.id = list_id and l.user_id = auth.uid())
      );
  end if;
end $$;

-- ============================================================================
-- ROLLBACK (commented — uncomment and run manually to undo)
-- ============================================================================
-- drop table if exists public.user_list_recipes;
-- drop table if exists public.user_lists;
