-- ============================================================================
-- COMMENTS: link to auth.users when the commenter is signed in
-- ============================================================================
-- Adds a nullable user_id column to public.comments. Existing rows are
-- untouched (user_id = NULL). New comments from signed-in users will set
-- this to auth.uid() so the UI can resolve them to a profile + handle for
-- linking to /u/[handle].
--
-- Fully idempotent and non-destructive — won't touch existing data or RLS.
-- ============================================================================

-- Add the column if it isn't already there.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'comments' and column_name = 'user_id'
  ) then
    alter table public.comments
      add column user_id uuid references auth.users(id) on delete set null;
  end if;
end $$;

-- Index for joining to profiles by author.
create index if not exists comments_user_id_idx
  on public.comments (user_id)
  where user_id is not null;
