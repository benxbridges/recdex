/**
 * Feedback table setup for RecDex.
 *
 * Run this SQL in the Supabase dashboard SQL editor:
 *
 * CREATE TABLE IF NOT EXISTS feedback (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   type text NOT NULL DEFAULT 'bug',
 *   message text NOT NULL,
 *   url text,
 *   user_agent text,
 *   screen_size text,
 *   user_name text,
 *   created_at timestamptz DEFAULT now()
 * );
 *
 * ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Service role can insert feedback"
 *   ON feedback FOR INSERT TO service_role WITH CHECK (true);
 *
 * CREATE POLICY "Service role can read feedback"
 *   ON feedback FOR SELECT TO service_role USING (true);
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zacwsrcdvpglrcvirlng.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SUPABASE_KEY) {
  console.error('SUPABASE_SERVICE_KEY env var is required. Add it to .env.local before running this script.')
  process.exit(1)
}

const SQL = `
CREATE TABLE IF NOT EXISTS feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL DEFAULT 'bug',
  message text NOT NULL,
  url text,
  user_agent text,
  screen_size text,
  user_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can insert feedback') THEN
    CREATE POLICY "Service role can insert feedback" ON feedback FOR INSERT TO service_role WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can read feedback') THEN
    CREATE POLICY "Service role can read feedback" ON feedback FOR SELECT TO service_role USING (true);
  END IF;
END $$;
`

async function main() {
  console.log('Attempting to create feedback table via Supabase RPC...')

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ query: SQL }),
  })

  if (!res.ok) {
    console.log('\nCould not run DDL via REST API (expected).')
    console.log('Please run the SQL from the comment block at the top of this file')
    console.log('in the Supabase dashboard: SQL Editor > New query > paste & run.')
    process.exit(0)
  }

  console.log('Table created successfully!')
}

main()
