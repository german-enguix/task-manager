// Dev script: seed 3 user avatars using DiceBear placeholders (MD3-like)
// Requires env vars: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing Supabase envs. Export EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

const seeds = ['Worker', 'Engineer', 'Inspector']

async function fetchPng(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  const arrayBuffer = await res.arrayBuffer()
  return new Blob([arrayBuffer], { type: 'image/png' })
}

async function main() {
  console.log('Fetching first 3 profiles...')
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .limit(3)

  if (error) throw error
  if (!profiles || profiles.length === 0) {
    console.log('No profiles found')
    return
  }

  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i]
    const seed = encodeURIComponent(p.full_name || seeds[i] || `User${i+1}`)
    const src = `https://api.dicebear.com/8.x/adventurer/png?size=96&seed=${seed}`
    console.log(`Downloading avatar for ${p.full_name || p.id} → ${src}`)
    const blob = await fetchPng(src)

    const filePath = `avatars/${p.id}.png`
    console.log('Uploading to storage:', filePath)

    // Upsert to allow reruns
    const { error: upErr } = await supabase.storage
      .from('task-evidences')
      .upload(filePath, blob, { contentType: 'image/png', upsert: true })

    if (upErr) throw upErr

    const { data: publicData } = supabase.storage
      .from('task-evidences')
      .getPublicUrl(filePath)

    const publicUrl = publicData.publicUrl
    console.log('Public URL:', publicUrl)

    const { error: updErr } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', p.id)

    if (updErr) throw updErr
    console.log('Profile updated with avatar_url')
  }

  console.log('Done seeding avatars.')
}

main().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})


