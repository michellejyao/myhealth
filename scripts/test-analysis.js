/**
 * Full test: seeds fake data, then runs the pattern-analysis function.
 * Run from project root: node scripts/test-analysis.js
 *
 * Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env or supabase/.env.local.
 */

import { getSupabaseConfig } from './env.js'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [join(__dirname, script)], {
      stdio: 'inherit',
      cwd: join(__dirname, '..'),
    })
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Exit ${code}`))))
  })
}

async function main() {
  console.log('1. Seeding fake health_logs and health_profile...\n')
  await run('seed-test-data.js')
  console.log('\n2. Calling pattern-analysis function...\n')
  await run('run-analysis-test.js')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
