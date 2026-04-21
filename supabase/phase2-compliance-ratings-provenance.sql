-- Phase 1: Unsplash compliance - store download_location URL
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS download_location TEXT;

-- Phase 3: Numeric ratings (backfill existing string ratings)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS rating_numeric INTEGER;
UPDATE comments SET rating_numeric = 5 WHERE rating = 'amazing';
UPDATE comments SET rating_numeric = 4 WHERE rating = 'good';
UPDATE comments SET rating_numeric = 3 WHERE rating = 'ok';
UPDATE comments SET rating_numeric = 2 WHERE rating = 'tricky';

-- Phase 4: Provenance CMS fields
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS transformation_type TEXT DEFAULT 'adapted';
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'none';
