import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://zacwsrcdvpglrcvirlng.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphY3dzcmNkdnBnbHJjdmlybG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg3NjA1MywiZXhwIjoyMDg3NDUyMDUzfQ.cXHsjm-QAjAsx5xL89TNxILFhlU7cOJBp7O_j-XSmHs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, message, url, userAgent, screenSize, userName, timestamp } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const row = {
      type: type || 'bug',
      message: message.trim(),
      url: url || null,
      user_agent: userAgent || null,
      screen_size: screenSize || null,
      user_name: userName || null,
      created_at: timestamp || new Date().toISOString(),
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('Supabase feedback insert failed:', res.status, text)
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Feedback API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
