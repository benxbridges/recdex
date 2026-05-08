-- ===== COOKBOOKS TABLE =====
-- Editorial cookbook recommendations rendered as the homepage shelf slider.
-- Bookshop is preferred (better margins + ethics); Amazon as fallback.
CREATE TABLE IF NOT EXISTS cookbooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,                 -- public image URL
  blurb TEXT,                     -- one-line "why we like it"
  bookshop_url TEXT,              -- affiliate link (preferred)
  amazon_url TEXT,                -- affiliate link (fallback)
  sort_order INTEGER DEFAULT 100, -- lower = earlier in the slider
  featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published',-- 'published' | 'hidden'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cookbooks_sort ON cookbooks(sort_order, created_at);
CREATE INDEX IF NOT EXISTS idx_cookbooks_status ON cookbooks(status);

ALTER TABLE cookbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cookbooks_select" ON cookbooks FOR SELECT USING (true);
-- Writes happen via service-key API routes only — no public insert policy.


-- ===== COOK LOGS TABLE =====
-- Per-cook entries that show up as taped notes on the recipe page.
-- Default public so the recipe gets richer over time; per-row private opt-out.
CREATE TABLE IF NOT EXISTS cook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_slug TEXT NOT NULL,         -- joins recipes.slug
  display_name TEXT,                 -- localStorage profile name; nullable for anon
  cooked_at DATE DEFAULT CURRENT_DATE,
  note TEXT,                         -- "made this with Julia, was solid but not great…"
  with_who TEXT,                     -- optional: "Julia and Ben"
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  substitutions TEXT,                -- existing field on completion screen
  photo_url TEXT,                    -- optional: photo of the dish they cooked
  private BOOLEAN DEFAULT false,     -- if true, hide from public render
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cook_logs_recipe ON cook_logs(recipe_slug, cooked_at DESC);
CREATE INDEX IF NOT EXISTS idx_cook_logs_created_at ON cook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cook_logs_private ON cook_logs(private);

ALTER TABLE cook_logs ENABLE ROW LEVEL SECURITY;

-- Public reads only see non-private rows. App layer can additionally filter.
CREATE POLICY "cook_logs_select_public" ON cook_logs FOR SELECT USING (private = false);

-- Allow anonymous inserts so anyone can log a cook without auth.
-- Inserts can set private=true, but writes go through service key in production.
CREATE POLICY "cook_logs_insert" ON cook_logs FOR INSERT WITH CHECK (true);
