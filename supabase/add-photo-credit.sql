-- Add photo_credit column for Unsplash photographer attribution
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS photo_credit TEXT;
