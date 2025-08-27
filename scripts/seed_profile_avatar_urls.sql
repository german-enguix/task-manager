-- Seed avatar_url in public.profiles for existing auth users (idempotent)
-- Run this in Supabase SQL Editor (project DB)

-- 1) Ensure column exists
alter table if exists public.profiles
  add column if not exists avatar_url text;

-- 2) Targets (full_name → public URL)
with targets as (
  select 'Zizi Fusea'::text as full_name, 'https://avatar.iran.liara.run/public/56'::text as url
  union all select 'Germán Enguix', 'https://avatar.iran.liara.run/public/48'
  union all select 'Albert Soriano', 'https://avatar.iran.liara.run/public/15'
)
-- 3) Update by matching profiles.full_name
update public.profiles p
set avatar_url = t.url,
    updated_at = now()
from targets t
where p.full_name ilike t.full_name;

-- 4) Fallback: match via auth.users.raw_user_meta_data->>'full_name' if profiles.full_name is null/different
with targets as (
  select 'Zizi Fusea'::text as full_name, 'https://avatar.iran.liara.run/public/56'::text as url
  union all select 'Germán Enguix', 'https://avatar.iran.liara.run/public/48'
  union all select 'Albert Soriano', 'https://avatar.iran.liara.run/public/15'
)
update public.profiles p
set avatar_url = t.url,
    updated_at = now()
from targets t
join auth.users u on u.id = p.id
where coalesce(p.full_name, '') not ilike t.full_name
  and coalesce(u.raw_user_meta_data->>'full_name','') ilike t.full_name;

-- 5) Verify
-- select id, full_name, avatar_url from public.profiles where avatar_url is not null;


