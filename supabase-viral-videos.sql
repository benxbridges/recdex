-- ===== VIRAL VIDEOS TABLE =====
-- Stores trending cooking videos discovered from TikTok (via scraper)
-- and YouTube (via trending API). Used to populate the "Viral" carousel
-- on the homepage.
--
-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS viral_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Source platform
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'youtube', 'instagram')),
  platform_id TEXT NOT NULL,  -- Video ID on the platform

  -- Content
  dish_name TEXT NOT NULL,      -- Clean recipe name (extracted by Claude)
  title TEXT NOT NULL,           -- Original title/description
  author_name TEXT NOT NULL DEFAULT '',
  author_url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',

  -- Engagement metrics
  view_count BIGINT NOT NULL DEFAULT 0,
  like_count BIGINT NOT NULL DEFAULT 0,
  share_count BIGINT NOT NULL DEFAULT 0,

  -- Discovery metadata
  discovered_via TEXT NOT NULL DEFAULT '',  -- Which search query found this
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Curation
  is_active BOOLEAN NOT NULL DEFAULT true,  -- Hide without deleting
  is_featured BOOLEAN NOT NULL DEFAULT false, -- Manually promoted
  curator_notes TEXT,

  -- Link to a RecDex recipe if someone imports it
  linked_recipe_slug TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate entries from the same platform
  UNIQUE (platform, platform_id)
);

-- Index for the main query: active videos sorted by views
CREATE INDEX idx_viral_videos_active_views
  ON viral_videos (is_active, view_count DESC)
  WHERE is_active = true;

-- Index for platform-specific queries
CREATE INDEX idx_viral_videos_platform
  ON viral_videos (platform, scraped_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_viral_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER viral_videos_updated_at
  BEFORE UPDATE ON viral_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_viral_videos_updated_at();

-- RLS: Anyone can read active videos, only service role can write
ALTER TABLE viral_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active viral videos"
  ON viral_videos FOR SELECT
  USING (is_active = true);

-- Service role (used by the scraper API) bypasses RLS automatically
