-- ===== THREADS TABLE =====
-- Community discussion threads (forum posts)
CREATE TABLE IF NOT EXISTS threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tag TEXT,  -- nullable; categories can be added later
  author_display_name TEXT NOT NULL,
  upvote_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== THREAD REPLIES TABLE =====
-- Flat replies on threads
CREATE TABLE IF NOT EXISTS thread_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author_display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== THREAD UPVOTES TABLE =====
-- Track who upvoted which thread (prevent duplicates)
CREATE TABLE IF NOT EXISTS thread_upvotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(thread_id, display_name)
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thread_replies_thread_id ON thread_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_upvotes_thread_id ON thread_upvotes(thread_id);

-- ===== RLS POLICIES =====
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_upvotes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "threads_select" ON threads FOR SELECT USING (true);
CREATE POLICY "thread_replies_select" ON thread_replies FOR SELECT USING (true);
CREATE POLICY "thread_upvotes_select" ON thread_upvotes FOR SELECT USING (true);

-- Allow anyone to insert
CREATE POLICY "threads_insert" ON threads FOR INSERT WITH CHECK (true);
CREATE POLICY "thread_replies_insert" ON thread_replies FOR INSERT WITH CHECK (true);
CREATE POLICY "thread_upvotes_insert" ON thread_upvotes FOR INSERT WITH CHECK (true);

-- Allow anyone to delete their own upvotes
CREATE POLICY "thread_upvotes_delete" ON thread_upvotes FOR DELETE USING (true);

-- ===== RPC: Increment reply count =====
CREATE OR REPLACE FUNCTION increment_reply_count(p_thread_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE threads SET reply_count = reply_count + 1, updated_at = now() WHERE id = p_thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== RPC: Toggle thread upvote =====
CREATE OR REPLACE FUNCTION toggle_thread_upvote(p_thread_id UUID, p_display_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  already_voted BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM thread_upvotes WHERE thread_id = p_thread_id AND display_name = p_display_name) INTO already_voted;
  IF already_voted THEN
    DELETE FROM thread_upvotes WHERE thread_id = p_thread_id AND display_name = p_display_name;
    UPDATE threads SET upvote_count = GREATEST(upvote_count - 1, 0) WHERE id = p_thread_id;
    RETURN false;  -- removed vote
  ELSE
    INSERT INTO thread_upvotes (thread_id, display_name) VALUES (p_thread_id, p_display_name);
    UPDATE threads SET upvote_count = upvote_count + 1 WHERE id = p_thread_id;
    RETURN true;  -- added vote
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
