-- Add cookbook attribution fields for author/source credit and purchase links
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cookbook_title TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cookbook_author TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cookbook_purchase_url TEXT;
-- source_attribution, source_url, creator_name, creator_url already exist
