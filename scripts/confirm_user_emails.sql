-- CONFIRMAR EMAILS DE USUARIOS MANUALMENTE
-- Si los usuarios no tienen email_confirmed_at

-- 1. Confirmar emails de tus usuarios
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email IN ('zizi@taskmanager.com', 'albert@taskmanager.com', 'german@taskmanager.com')
  AND email_confirmed_at IS NULL;

-- 2. Verificar que se confirmaron
SELECT 
    'EMAILS CONFIRMADOS:' as info,
    email,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'CONFIRMADO ✅'
        ELSE 'NO CONFIRMADO ❌'
    END as status
FROM auth.users
WHERE email IN ('zizi@taskmanager.com', 'albert@taskmanager.com', 'german@taskmanager.com')
ORDER BY email;

-- ✅ EMAILS CONFIRMADOS
-- Ahora los usuarios deberían poder hacer login 