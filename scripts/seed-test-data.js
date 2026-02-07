/**
 * Seeds fake health_logs and optional health_profile for testing the pattern-analysis function.
 * Run from project root: node scripts/seed-test-data.js
 *
 * Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env or supabase/.env.local.
 */

import { getSupabaseConfig } from './env.js'

const TEST_USER_ID = 'test-user-analysis'

function iso(daysAgo, hour = 12) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

const fakeLogs = [
  { title: 'Headache', description: 'Tension headache after work', body_parts: ['head'], severity: 4, date: iso(1) },
  { title: 'Lower back pain', description: 'Ache after sitting long', body_parts: ['back'], severity: 5, date: iso(2) },
  { title: 'Knee stiffness', description: 'Right knee in the morning', body_parts: ['right_leg'], severity: 3, date: iso(3) },
  { title: 'Headache again', description: 'Similar to last week', body_parts: ['head'], severity: 5, date: iso(5) },
  { title: 'Chest tightness', description: 'Brief, after exercise', body_parts: ['chest'], severity: 3, date: iso(7) },
  { title: 'Back pain', description: 'Recurring lower back', body_parts: ['back'], severity: 6, date: iso(10) },
  { title: 'Neck pain', description: 'From desk work', body_parts: ['neck'], severity: 4, date: iso(14) },
  { title: 'Headache', description: 'Third headache this month', body_parts: ['head'], severity: 6, date: iso(18) },
  { title: 'Right knee', description: 'Twinge when climbing stairs', body_parts: ['right_leg'], severity: 4, date: iso(21) },
  { title: 'Abdomen discomfort', description: 'Mild, after lunch', body_parts: ['abdomen'], severity: 2, date: iso(25) },
]

const fakeProfile = {
  user_id: TEST_USER_ID,
  family_history: ['migraine', 'arthritis'],
  height: 170,
  weight: 70,
  lifestyle_sleep_hours: 6.5,
  lifestyle_activity_level: 'moderate',
  lifestyle_diet_type: 'mixed',
}

async function seed() {
  const { url, key } = getSupabaseConfig()

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  }

  // Insert health_logs
  const logsWithUser = fakeLogs.map((log) => ({
    user_id: TEST_USER_ID,
    title: log.title,
    description: log.description,
    body_parts: log.body_parts,
    severity: log.severity,
    date: log.date,
  }))

  const logRes = await fetch(`${url}/rest/v1/health_logs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(logsWithUser),
  })

  if (!logRes.ok) {
    const err = await logRes.text()
    throw new Error(`Failed to insert health_logs: ${logRes.status} ${err}`)
  }
  console.log('Inserted', logsWithUser.length, 'fake health_logs for', TEST_USER_ID)

  // Upsert health_profile (so we can re-run; use on conflict do update)
  const profileRes = await fetch(`${url}/rest/v1/health_profile`, {
    method: 'POST',
    headers: {
      ...headers,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(fakeProfile),
  })

  if (!profileRes.ok) {
    const err = await profileRes.text()
    throw new Error(`Failed to upsert health_profile: ${profileRes.status} ${err}`)
  }
  console.log('Upserted health_profile for', TEST_USER_ID)
  console.log('')
  console.log('Test user_id:', TEST_USER_ID)
  console.log('You can now run: node scripts/run-analysis-test.js')
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
