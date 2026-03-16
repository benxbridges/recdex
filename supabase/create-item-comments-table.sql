-- ===== ITEM COMMENTS TABLE =====
-- Generic comments for any content type (external recipes, community submissions, books, etc.)
-- Recipe comments continue to use the existing `comments` table for backwards compatibility.
CREATE TABLE IF NOT EXISTS item_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type TEXT NOT NULL,       -- 'external', 'community', 'book', etc.
  item_id TEXT NOT NULL,         -- ID of the item being commented on
  item_title TEXT,               -- Cached title for display purposes
  display_name TEXT NOT NULL,    -- User's display name
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_item_comments_item ON item_comments(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_item_comments_created_at ON item_comments(created_at DESC);

-- ===== RLS POLICIES =====
ALTER TABLE item_comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "item_comments_select" ON item_comments FOR SELECT USING (true);

-- Allow anyone to insert
CREATE POLICY "item_comments_insert" ON item_comments FOR INSERT WITH CHECK (true);
