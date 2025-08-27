import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL 
  || process.env.SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL 
  || process.env.VITE_SUPABASE_URL
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY 
  || process.env.SUPABASE_ANON_KEY 
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  || process.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('Missing Supabase envs. Provide one of: EXPO_PUBLIC_SUPABASE_URL|SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL|VITE_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_ANON_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY|VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

const AVATARS = {
  'Zizi Fusea': 'https://avatar.iran.liara.run/public/56',
  'Germán Enguix': 'https://avatar.iran.liara.run/public/48',
  'Albert Soriano': 'https://avatar.iran.liara.run/public/15',
}

async function main() {
  const names = Object.keys(AVATARS)
  console.log('Updating avatar_url for:', names)
  for (const full_name of names) {
    const token = full_name.split(' ')[0];
    const patterns = [full_name, `%${full_name}%`, `%${token}%`];
    let profiles = [];
    let lastErr = null;
    for (const pat of patterns) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', pat);
      if (error) { lastErr = error; continue }
      if (data && data.length) { profiles = data; break }
    }
    if (!profiles.length) {
      if (lastErr) console.error('Query failed for', full_name, lastErr.message);
      console.warn('No profiles matched for', full_name);
      continue;
    }

    for (const p of profiles) {
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: AVATARS[full_name], updated_at: new Date().toISOString() })
        .eq('id', p.id);
      if (updErr) { console.error('Update failed for', full_name, 'id:', p.id, updErr.message); continue }
      console.log('✔ avatar_url set for', full_name, 'id:', p.id)
    }
  }
  console.log('Done.')
}

main().catch(e => { console.error(e); process.exit(1) })


