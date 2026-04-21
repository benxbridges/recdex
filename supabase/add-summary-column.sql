-- Adds a short prose "cooking arc" summary column to recipes.
-- Backwards-compatible: null on existing rows; extract-recipe + publish-recipe
-- will populate it for new imports. Backfill script lives at
-- scripts/backfill-summaries.ts.
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS summary TEXT;
