/**
 * upload-sprites.mjs
 *
 * One-time script to upload all local sprite sheets to Supabase Storage.
 * Run this whenever you add new sprites:
 *
 *   node scripts/upload-sprites.mjs
 *
 * Prerequisites:
 *   - SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
 *   - @supabase/supabase-js must be installed (it already is)
 *   - All sprites must be in assets/sprites/ locally
 *
 * The bucket 'sprites' will be created automatically if it doesn't exist.
 * Existing files are overwritten (upsert: true), so re-running is safe.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, relative } from 'path'

// Load .env.local manually — no dotenv needed
const envPath = join(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const SPRITES_DIR       = join(process.cwd(), 'assets', 'sprites')
const BUCKET            = 'sprites'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

if (!existsSync(SPRITES_DIR)) {
  console.error(`❌  Sprites directory not found: ${SPRITES_DIR}`)
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

// ── Recursively collect all .png files ────────────────────────────────────
function collectFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full))
    } else if (entry.toLowerCase().endsWith('.png')) {
      results.push(full)
    }
  }
  return results
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  // Ensure bucket exists (private by default)
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.find(b => b.name === BUCKET)
  if (!exists) {
    console.log(`📦  Creating bucket '${BUCKET}'...`)
    const { error } = await supabase.storage.createBucket(BUCKET, { public: false })
    if (error) { console.error('❌  Failed to create bucket:', error.message); process.exit(1) }
    console.log(`✅  Bucket '${BUCKET}' created.`)
  } else {
    console.log(`ℹ️   Bucket '${BUCKET}' already exists.`)
  }

  const files = collectFiles(SPRITES_DIR)
  console.log(`\n📤  Uploading ${files.length} sprite files...\n`)

  let success = 0, failed = 0
  for (const file of files) {
    // Storage path mirrors the local folder structure
    // Example: assets/sprites/Player/Head/Hair_1/Hair_1_Black.png
    //   → storage key: Player/Head/Hair_1/Hair_1_Black.png
    const storagePath = relative(SPRITES_DIR, file).replace(/\\/g, '/')

    try {
      const fileBuffer = readFileSync(file)
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: 'image/png',
          upsert: true, // safe to re-run
        })

      if (error) {
        console.error(`  ❌  ${storagePath} — ${error.message}`)
        failed++
      } else {
        console.log(`  ✅  ${storagePath}`)
        success++
      }
    } catch (err) {
      console.error(`  ❌  ${storagePath} — ${err.message}`)
      failed++
    }
  }

  console.log(`\n─────────────────────────────────`)
  console.log(`✅  Uploaded: ${success}`)
  if (failed > 0) console.log(`❌  Failed:   ${failed}`)
  console.log(`─────────────────────────────────`)
  console.log('\n🎉  Done! Deploy to Vercel and add SUPABASE_SERVICE_ROLE_KEY to your Vercel environment variables.')
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1) })
