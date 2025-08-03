-- DIAGNÓSTICO ESPECÍFICO: PROBLEMA DE AUTENTICACIÓN Y PERFILES
-- Para cuando el perfil existe pero no se puede acceder

-- ===============================
-- 1. VERIFICAR AUTENTICACIÓN ACTUAL
-- ===============================

-- Verificar si hay usuario autenticado
SELECT 'ESTADO AUTENTICACIÓN:' as info,
       CASE 
           WHEN auth.uid() IS NOT NULL THEN '✅ USUARIO AUTENTICADO'
           ELSE '❌ NO HAY USUARIO AUTENTICADO'
       END as estado,
       auth.uid() as user_id;

-- ===============================
-- 2. VERIFICAR PERFIL DE ZIZI
-- ===============================

-- Buscar perfil de Zizi por nombre
SELECT 'PERFIL DE ZIZI:' as info,
       p.id,
       p.full_name,
       p.role,
       au.email
FROM profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE p.full_name ILIKE '%zizi%'
   OR au.email ILIKE '%zizi%'
ORDER BY p.created_at;

-- ===============================
-- 3. VERIFICAR SI EL USUARIO ACTUAL ES ZIZI
-- ===============================

-- Verificar si el usuario autenticado es Zizi
SELECT 'USUARIO ACTUAL ES ZIZI:' as info,
       CASE 
           WHEN p.full_name ILIKE '%zizi%' OR au.email ILIKE '%zizi%' 
           THEN '✅ SÍ, USUARIO ACTUAL ES ZIZI'
           ELSE '❌ NO, USUARIO ACTUAL NO ES ZIZI'
       END as resultado,
       p.full_name,
       au.email
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.id = auth.uid();

-- ===============================
-- 4. PROBAR ACCESO DIRECTO A PROFILES
-- ===============================

-- Intentar acceso directo sin políticas RLS (temporalmente)
SELECT 'ACCESO DIRECTO SIN RLS:' as info,
       COUNT(*) as total_perfiles_en_tabla
FROM profiles;

-- Verificar si RLS está bloqueando el acceso
SELECT 'POLÍTICAS RLS ACTIVAS:' as info,
       policyname,
       cmd,
       permissive,
       qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ===============================
-- 5. PROBAR CONSULTA EXACTA QUE FALLA
-- ===============================

-- Esta es probablemente la consulta que está fallando en tu app
SELECT 'CONSULTA COMO EN LA APP:' as info,
       p.id,
       p.full_name,
       p.role
FROM profiles p
WHERE p.id = auth.uid();

-- ===============================
-- 6. INFORMACIÓN DE SESIÓN DETALLADA
-- ===============================

-- Verificar información completa de la sesión
SELECT 'INFORMACIÓN DE SESIÓN:' as info,
       auth.uid() as current_user_id,
       auth.jwt() as jwt_info,
       current_user as database_user,
       session_user as session_user;

-- ===============================
-- 7. SOLUCIÓN TEMPORAL: DESACTIVAR RLS
-- ===============================

-- Si necesitas acceso inmediato, puedes desactivar RLS temporalmente
-- DESCOMENTA LA SIGUIENTE LÍNEA SOLO SI ES NECESARIO:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Para reactivarlo después:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ===============================
-- 8. VERIFICAR CONEXIÓN CON USUARIO ESPECÍFICO
-- ===============================

-- Mostrar todos los usuarios y sus perfiles para verificar datos
SELECT 'TODOS LOS USUARIOS Y PERFILES:' as info,
       au.id,
       au.email,
       au.created_at as usuario_creado,
       p.full_name,
       p.role,
       p.created_at as perfil_creado
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at;

-- ===============================
-- INSTRUCCIONES SEGÚN RESULTADOS:
-- ===============================

-- Si "USUARIO AUTENTICADO" = ❌:
--   → Problema de sesión/autenticación
--   → Necesitas hacer login de nuevo

-- Si "USUARIO ACTUAL ES ZIZI" = ❌:
--   → Estás logueado con otro usuario
--   → Necesitas cambiar de usuario

-- Si "CONSULTA COMO EN LA APP" = Sin resultados:
--   → Problema con políticas RLS
--   → Necesitas ajustar las políticas

-- Si todo parece correcto:
--   → Problema en el código de la aplicación
--   → Revisar el código que hace la consulta