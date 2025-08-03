-- SOLUCIÓN FINAL: POLÍTICAS RLS SIMPLES QUE FUNCIONAN
-- Para resolver el error 406 en la aplicación

-- ===============================
-- 1. ELIMINAR TODAS LAS POLÍTICAS PROBLEMÁTICAS
-- ===============================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "allow_select_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON profiles;

-- ===============================
-- 2. CREAR POLÍTICAS ULTRA-SIMPLES
-- ===============================

-- Política 1: Permitir que cualquier usuario autenticado LEA cualquier perfil
-- (Necesario para mostrar nombres de autores en comentarios, etc.)
CREATE POLICY "authenticated_users_can_read_profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Política 2: Los usuarios pueden actualizar solo su propio perfil
CREATE POLICY "users_can_update_own_profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Política 3: Los usuarios pueden insertar solo su propio perfil
CREATE POLICY "users_can_insert_own_profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ===============================
-- 3. VERIFICAR QUE RLS ESTÉ HABILITADO
-- ===============================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ===============================
-- 4. MOSTRAR POLÍTICAS ACTIVAS
-- ===============================

SELECT 'POLÍTICAS ACTIVAS:' as info,
       policyname,
       cmd as operacion,
       permissive,
       roles
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ===============================
-- 5. CREAR PERFILES PARA USUARIOS EXISTENTES (POR SI ACASO)
-- ===============================

-- Crear perfiles para usuarios que no los tengan
INSERT INTO profiles (id, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        split_part(au.email, '@', 1),
        'Usuario'
    ) as full_name,
    'user' as role,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = au.id);

-- ===============================
-- 6. MOSTRAR TODOS LOS PERFILES CREADOS
-- ===============================

SELECT 'PERFILES EN LA TABLA:' as info,
       COUNT(*) as total_perfiles
FROM profiles;

-- Mostrar algunos ejemplos (sin datos sensibles)
SELECT 'EJEMPLOS DE PERFILES:' as info,
       LEFT(full_name, 10) as nombre_parcial,
       role,
       created_at
FROM profiles
ORDER BY created_at
LIMIT 5;

-- ===============================
-- RESULTADO ESPERADO:
-- ===============================

-- Después de ejecutar este script:
-- ✅ Políticas RLS simples y funcionales
-- ✅ Cualquier usuario autenticado puede leer perfiles
-- ✅ Solo pueden editar su propio perfil
-- ✅ Error 406 en la aplicación debería desaparecer

-- INSTRUCCIONES:
-- 1. Ejecuta este script en SQL Editor
-- 2. Verifica que aparezcan las 3 políticas nuevas
-- 3. Prueba tu aplicación - debería funcionar sin error 406