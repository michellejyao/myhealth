import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnv() {
  const paths = [
    join(root, '.env'),
    join(root, '.env.local'),
    join(root, 'supabase', '.env.local'),
    join(process.cwd(), 'supabase', '.env.local'),
    join(process.cwd(), '.env'),
    join(process.cwd(), '.env.local'),
  ]
  for (const p of paths) {
    if (!existsSync(p)) continue
    try {
      let text = readFileSync(p, 'utf8')
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      for (const line of text.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq <= 0) continue
        const key = trimmed.slice(0, eq).trim()
        let value = trimmed.slice(eq + 1).trim()
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        if (key && !process.env[key]) process.env[key] = value
      }
    } catch (_) {
      // skip unreadable files
    }
  }
}

loadEnv()

export function getSupabaseConfig() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Missing Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env or supabase/.env.local'
    )
  }
  return { url, key }
}
