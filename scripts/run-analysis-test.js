/**
 * Calls the pattern-analysis Edge Function for the test user.
 * Run after seeding: node scripts/run-analysis-test.js
 *
 * Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env or supabase/.env.local.
 */

import { getSupabaseConfig } from './env.js'

const TEST_USER_ID = 'test-user-analysis'

async function runAnalysis() {
  const { url, key } = getSupabaseConfig()
  const fnUrl = `${url}/functions/v1/pattern-analysis`

  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ user_id: TEST_USER_ID }),
  })

  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`Non-JSON response: ${text}`)
  }

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}: ${text}`)
  }

  console.log('Analysis result:')
  console.log(JSON.stringify(data, null, 2))
  return data
}

runAnalysis().catch((e) => {
  console.error(e)
  process.exit(1)
})
