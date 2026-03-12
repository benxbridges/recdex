-- ===== EXTERNAL RECIPES TABLE =====
-- Curated links to recipes on other platforms (NYT, BA, Serious Eats, etc.)
-- We store ONLY metadata (title, source, link) — never the recipe content itself

CREATE TABLE IF NOT EXISTS external_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  source_name TEXT NOT NULL,       -- e.g. "NYT Cooking", "Bon Appétit", "Serious Eats"
  source_url TEXT NOT NULL,        -- direct link to the recipe on the external site
  cuisine TEXT,                    -- e.g. "Italian", "Mexican"
  time_estimate TEXT,              -- e.g. "45 min", "1 hr 30 min"
  matched_recipe_slug TEXT,        -- slug of a similar recipe on RecDex (nullable)
  submitted_by TEXT,               -- display name if community-submitted, null if curated/RSS
  status TEXT DEFAULT 'active',    -- 'active', 'pending', 'removed'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_recipes_created_at ON external_recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_recipes_source ON external_recipes(source_name);

-- ===== RLS POLICIES =====
ALTER TABLE external_recipes ENABLE ROW LEVEL SECURITY;

-- Anyone can read active external recipes
CREATE POLICY "external_recipes_select" ON external_recipes FOR SELECT USING (status = 'active');

-- Anyone can submit (goes to 'pending' by default for community submissions)
CREATE POLICY "external_recipes_insert" ON external_recipes FOR INSERT WITH CHECK (true);
