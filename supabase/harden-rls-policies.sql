-- ============================================================================
-- Harden RLS policies — replaces the WITH CHECK (true) "anyone can write"
-- policies with length-bounded ones. Anon writes are still allowed for the
-- community features that require them, but bots can no longer dump unbounded
-- text into your tables.
--
-- Run this in the Supabase SQL editor.
-- All writes from the application code go through service-key API routes,
-- which already validate input. These RLS rules are the safety net for any
-- direct call to the public PostgREST endpoint with the anon key.
-- ============================================================================

-- ───── recipes ─────
-- Originally: insert allowed when source = 'community'.
-- New: also requires a usable slug/title and reasonable length caps.
DROP POLICY IF EXISTS "insert_community_recipes" ON recipes;
CREATE POLICY "insert_community_recipes" ON recipes
  FOR INSERT WITH CHECK (
    source = 'community'
    AND length(coalesce(title, '')) BETWEEN 1 AND 300
    AND length(coalesce(slug, '')) BETWEEN 1 AND 200
    AND length(coalesce(description, '')) <= 2000
  );

-- ───── community_submissions ─────
DROP POLICY IF EXISTS "insert_submissions" ON community_submissions;
CREATE POLICY "insert_submissions" ON community_submissions
  FOR INSERT WITH CHECK (
    length(coalesce(url, '')) BETWEEN 1 AND 2048
    AND length(coalesce(title, '')) BETWEEN 1 AND 300
    AND length(coalesce(display_name, '')) BETWEEN 1 AND 80
    AND length(coalesce(submitter_note, '')) <= 2000
    AND (url LIKE 'http://%' OR url LIKE 'https://%')
  );

-- ───── submission_upvotes ─────
-- Allow inserts but cap display_name length. Anon delete remains permissive
-- per the existing app pattern (users can un-vote) — see TODO below to tighten.
DROP POLICY IF EXISTS "insert_upvotes" ON submission_upvotes;
CREATE POLICY "insert_upvotes" ON submission_upvotes
  FOR INSERT WITH CHECK (length(coalesce(display_name, '')) BETWEEN 1 AND 80);

-- TODO (manual): submission_upvotes currently lets anyone DELETE any vote.
-- Once users have stable auth, restrict delete to vote owner. For now we
-- leave it open to keep the unvote button working.

-- ───── item_comments ─────
DROP POLICY IF EXISTS "item_comments_insert" ON item_comments;
CREATE POLICY "item_comments_insert" ON item_comments
  FOR INSERT WITH CHECK (
    length(coalesce(item_type, '')) BETWEEN 1 AND 32
    AND length(coalesce(item_id, '')) BETWEEN 1 AND 200
    AND length(coalesce(display_name, '')) BETWEEN 1 AND 80
    AND length(coalesce(body, '')) BETWEEN 1 AND 2000
  );

-- ───── threads / thread_replies / thread_upvotes ─────
DROP POLICY IF EXISTS "threads_insert" ON threads;
CREATE POLICY "threads_insert" ON threads
  FOR INSERT WITH CHECK (
    length(coalesce(title, '')) BETWEEN 1 AND 300
    AND length(coalesce(body, '')) BETWEEN 1 AND 10000
    AND length(coalesce(author_display_name, '')) BETWEEN 1 AND 80
  );

DROP POLICY IF EXISTS "thread_replies_insert" ON thread_replies;
CREATE POLICY "thread_replies_insert" ON thread_replies
  FOR INSERT WITH CHECK (
    length(coalesce(body, '')) BETWEEN 1 AND 5000
    AND length(coalesce(author_display_name, '')) BETWEEN 1 AND 80
  );

DROP POLICY IF EXISTS "thread_upvotes_insert" ON thread_upvotes;
CREATE POLICY "thread_upvotes_insert" ON thread_upvotes
  FOR INSERT WITH CHECK (length(coalesce(display_name, '')) BETWEEN 1 AND 80);

-- ───── cook_logs ─────
DROP POLICY IF EXISTS "cook_logs_insert" ON cook_logs;
CREATE POLICY "cook_logs_insert" ON cook_logs
  FOR INSERT WITH CHECK (
    length(coalesce(recipe_slug, '')) BETWEEN 1 AND 200
    AND length(coalesce(display_name, '')) <= 80
    AND length(coalesce(note, '')) <= 2000
    AND length(coalesce(with_who, '')) <= 200
    AND length(coalesce(substitutions, '')) <= 1000
    AND length(coalesce(photo_url, '')) <= 2048
    AND (photo_url IS NULL OR photo_url LIKE 'http://%' OR photo_url LIKE 'https://%')
    AND (rating IS NULL OR rating BETWEEN 1 AND 5)
  );

-- ───── external_recipes (if present) ─────
-- The original policy from create-external-recipes-table.sql is WITH CHECK (true).
-- Replace with bounded version. Wrapped in DO block in case the table doesn't
-- exist yet on every environment.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='external_recipes') THEN
    EXECUTE 'DROP POLICY IF EXISTS "external_recipes_insert" ON external_recipes';
    EXECUTE $POL$
      CREATE POLICY "external_recipes_insert" ON external_recipes
        FOR INSERT WITH CHECK (
          length(coalesce(url, '')) BETWEEN 1 AND 2048
          AND (url LIKE 'http://%' OR url LIKE 'https://%')
        )
    $POL$;
  END IF;
END $$;

-- ============================================================================
-- Done. Length caps don't replace server-side validation — the API routes
-- still need to clamp input — but they make direct PostgREST abuse much harder.
-- ============================================================================
