-- Allow anonymous inserts on recipes table for community-submitted recipes
-- Run this in the Supabase SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads on published recipes (if not already exists)
CREATE POLICY IF NOT EXISTS "read_published_recipes" ON recipes
  FOR SELECT USING (status = 'published');

-- Allow anonymous inserts for community-sourced recipes
CREATE POLICY "insert_community_recipes" ON recipes
  FOR INSERT WITH CHECK (source = 'community');

-- Add source_url column for web recipe attribution
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_attribution TEXT;
