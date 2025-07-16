-- DIAGNÓSTICO: Ver qué usuarios tienes realmente
-- Para entender por qué no se actualizaron

-- 1. Ver todos los usuarios en auth.users
SELECT 
    'USUARIOS EN AUTH.USERS:' as info,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
ORDER BY created_at;

-- 2. Ver todos los perfiles en profiles (si existen)
SELECT 
    'PERFILES EN PROFILES:' as info,
    id,
    full_name,
    role,
    created_at
FROM profiles
ORDER BY created_at;

-- 3. Ver la conexión entre auth.users y profiles
SELECT 
    'CONEXIÓN USERS-PROFILES:' as info,
    u.email,
    p.full_name,
    p.role,
    CASE 
        WHEN p.id IS NULL THEN 'SIN PERFIL' 
        ELSE 'CON PERFIL' 
    END as estado
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.email;

-- 4. Verificar si los emails que buscamos existen
SELECT 
    'VERIFICACIÓN DE TUS EMAILS:' as info,
    email,
    CASE 
        WHEN email = 'zizi@taskmanager.com' THEN 'ENCONTRADO'
        WHEN email = 'albert@taskmanager.com' THEN 'ENCONTRADO'  
        WHEN email = 'german@taskmanager.com' THEN 'ENCONTRADO'
        ELSE 'OTRO EMAIL'
    END as estado
FROM auth.users
WHERE email IN ('zizi@taskmanager.com', 'albert@taskmanager.com', 'german@taskmanager.com')
   OR email NOT IN ('zizi@taskmanager.com', 'albert@taskmanager.com', 'german@taskmanager.com');

-- 5. Contar resultados
SELECT 
    'RESUMEN:' as info,
    (SELECT count(*) FROM auth.users) as total_users,
    (SELECT count(*) FROM profiles) as total_profiles,
    (SELECT count(*) FROM auth.users WHERE email IN ('zizi@taskmanager.com', 'albert@taskmanager.com', 'german@taskmanager.com')) as tus_emails_encontrados;

-- INSTRUCCIONES BASADAS EN RESULTADOS:
-- - Si total_users = 0 → No has creado usuarios aún
-- - Si total_profiles = 0 → Los triggers no funcionan o no hay conexión
-- - Si tus_emails_encontrados < 3 → Los emails no coinciden exactamente 