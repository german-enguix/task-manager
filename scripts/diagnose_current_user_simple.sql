-- DIAGNÓSTICO SIMPLE: USUARIO AUTENTICADO ACTUAL Y SU PERFIL
-- Enfoque correcto: usar auth.uid() para buscar el perfil

-- ===============================
-- 1. INFORMACIÓN BÁSICA DEL USUARIO AUTENTICADO
-- ===============================

-- Ver el ID del usuario autenticado actual
SELECT 'USUARIO AUTENTICADO:' as info,
       auth.uid() as user_id,
       CASE 
           WHEN auth.uid() IS NOT NULL THEN '✅ SÍ HAY USUARIO AUTENTICADO'
           ELSE '❌ NO HAY USUARIO AUTENTICADO'
       END as estado;

-- ===============================
-- 2. DATOS DEL USUARIO EN AUTH.USERS
-- ===============================

-- Buscar los datos completos del usuario autenticado en auth.users
SELECT 'DATOS EN AUTH.USERS:' as info,
       au.id,
       au.email,
       au.created_at,
       au.confirmed_at,
       au.last_sign_in_at
FROM auth.users au
WHERE au.id = auth.uid();

-- ===============================
-- 3. BUSCAR PERFIL DEL USUARIO AUTENTICADO
-- ===============================

-- Buscar el perfil específico del usuario autenticado
SELECT 'PERFIL DEL USUARIO ACTUAL:' as info,
       p.id,
       p.full_name,
       p.role,
       p.created_at
FROM profiles p
WHERE p.id = auth.uid();

-- ===============================
-- 4. VERIFICAR SI EXISTE EL PERFIL
-- ===============================

-- Verificación simple: ¿existe o no existe el perfil?
SELECT 'RESULTADO:' as info,
       CASE 
           WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) 
           THEN '✅ PERFIL EXISTE PARA USUARIO ACTUAL'
           ELSE '❌ PERFIL NO EXISTE PARA USUARIO ACTUAL'
       END as resultado;

-- ===============================
-- 5. SI NO EXISTE, CREAR EL PERFIL
-- ===============================

-- Solo si el perfil no existe, crearlo usando los datos de auth.users
INSERT INTO profiles (id, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        split_part(au.email, '@', 1),
        'Usuario'
    ) as full_name,
    'user' as role,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users au
WHERE au.id = auth.uid()
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = au.id);

-- ===============================
-- 6. VERIFICACIÓN FINAL
-- ===============================

-- Después del posible INSERT, verificar de nuevo
SELECT 'VERIFICACIÓN FINAL:' as info,
       p.id,
       p.full_name,
       p.role,
       au.email
FROM profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE p.id = auth.uid();

-- Prueba la función original que estaba fallando
SELECT 'PRUEBA FUNCIÓN ORIGINAL:' as info,
       test_profiles_access() as resultado;

-- ===============================
-- RESULTADO ESPERADO:
-- ===============================

-- Si todo funciona, deberías ver:
-- ✅ SÍ HAY USUARIO AUTENTICADO
-- ✅ PERFIL EXISTE PARA USUARIO ACTUAL  
-- ✅ ACCESO A PROFILES FUNCIONANDO: [Nombre del usuario]