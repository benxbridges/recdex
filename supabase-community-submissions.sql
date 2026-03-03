-- =====================================================
-- Community Submissions System — Supabase DDL
-- Run this in the Supabase SQL Editor
-- =====================================================

-- 1. Community Submissions table (external link shares)
CREATE TABLE community_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'youtube', 'instagram', 'other')),

  -- Metadata (from oEmbed or user-provided)
  title TEXT NOT NULL,
  author_name TEXT,
  author_url TEXT,
  thumbnail_url TEXT,

  -- Submitter
  display_name TEXT NOT NULL,
  submitter_note TEXT,

  -- Community signals
  upvote_count INTEGER DEFAULT 0 NOT NULL,

  -- Moderation
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'hidden', 'flagged')),

  -- Optional link to existing RecDex recipe
  related_recipe_slug TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Prevent duplicate URL submissions
CREATE UNIQUE INDEX idx_submissions_url ON community_submissions (url);

-- Homepage queries: active submissions sorted by recency or votes
CREATE INDEX idx_submissions_active_recent ON community_submissions (status, created_at DESC);
CREATE INDEX idx_submissions_active_votes ON community_submissions (status, upvote_count DESC);

-- 2. Submission Upvotes table (dedup votes by display_name)
CREATE TABLE submission_upvotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES community_submissions(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(submission_id, display_name)
);

CREATE INDEX idx_upvotes_submission ON submission_upvotes (submission_id);
CREATE INDEX idx_upvotes_user ON submission_upvotes (display_name);

-- 3. Alter recipes table for community-submitted recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS submitted_by TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'editorial';

-- Index for querying community recipes
CREATE INDEX idx_recipes_community ON recipes (source, created_at DESC) WHERE source = 'community';

-- 4. RPC: Atomic upvote (insert vote + increment counter)
CREATE OR REPLACE FUNCTION upvote_submission(p_submission_id UUID, p_display_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO submission_upvotes (submission_id, display_name)
  VALUES (p_submission_id, p_display_name);

  UPDATE community_submissions
  SET upvote_count = upvote_count + 1
  WHERE id = p_submission_id;

  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 5. RPC: Atomic remove upvote (delete vote + decrement counter)
CREATE OR REPLACE FUNCTION remove_upvote(p_submission_id UUID, p_display_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM submission_upvotes
  WHERE submission_id = p_submission_id AND display_name = p_display_name;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    UPDATE community_submissions
    SET upvote_count = GREATEST(upvote_count - 1, 0)
    WHERE id = p_submission_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 6. Row Level Security
ALTER TABLE community_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_upvotes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads for active submissions
CREATE POLICY "read_active_submissions" ON community_submissions
  FOR SELECT USING (status = 'active');

-- Allow anonymous inserts
CREATE POLICY "insert_submissions" ON community_submissions
  FOR INSERT WITH CHECK (true);

-- Allow anonymous reads on upvotes
CREATE POLICY "read_upvotes" ON submission_upvotes
  FOR SELECT USING (true);

-- Allow anonymous inserts on upvotes
CREATE POLICY "insert_upvotes" ON submission_upvotes
  FOR INSERT WITH CHECK (true);

-- Allow anonymous deletes on upvotes (for un-upvoting)
CREATE POLICY "delete_upvotes" ON submission_upvotes
  FOR DELETE USING (true);
