-- VERIFICAR ESTADO DE USUARIOS PARA LOGIN
-- Para diagnosticar problemas de autenticación

-- 1. Ver estado completo de usuarios en auth.users
SELECT 
    'ESTADO AUTH.USERS:' as info,
    email,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'CONFIRMADO'
        ELSE 'NO CONFIRMADO'
    END as email_status,
    created_at,
    last_sign_in_at,
    CASE 
        WHEN banned_until IS NOT NULL THEN 'BANEADO'
        ELSE 'ACTIVO'
    END as account_status
FROM auth.users
WHERE email IN ('zizi@taskmanager.com', 'albert@taskmanager.com', 'german@taskmanager.com')
ORDER BY email;

-- 2. Ver perfiles asociados
SELECT 
    'PERFILES ASOCIADOS:' as info,
    u.email,
    p.full_name,
    p.role,
    p.created_at as profile_created
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email IN ('zizi@taskmanager.com', 'albert@taskmanager.com', 'german@taskmanager.com')
ORDER BY u.email;

-- 3. Verificar emails exactos (por si hay espacios o diferencias)
SELECT 
    'EMAILS EXACTOS:' as info,
    '"' || email || '"' as email_with_quotes,
    length(email) as email_length,
    CASE 
        WHEN email = 'zizi@taskmanager.com' THEN 'COINCIDE'
        ELSE 'NO COINCIDE'
    END as zizi_match
FROM auth.users
WHERE email LIKE '%zizi%' OR email LIKE '%taskmanager%';

-- 4. Ver si hay algún problema con el dominio
SELECT 
    'ANÁLISIS DE DOMINIO:' as info,
    email,
    split_part(email, '@', 1) as username,
    split_part(email, '@', 2) as domain
FROM auth.users
WHERE email LIKE '%taskmanager%';

-- DIAGNÓSTICO:
-- - Si email_confirmed_at es NULL → Necesitas confirmar el email
-- - Si account_status es BANEADO → Hay que desbanear
-- - Si NO COINCIDE → Hay diferencia en el email exacto
-- - Si no aparece en perfiles → Los perfiles no se crearon bien 