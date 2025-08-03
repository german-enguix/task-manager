-- SOLUCIÓN EMERGENCIA: Arreglar RLS en tabla profiles
-- Este script soluciona el error 406 en consultas de perfiles

-- ===============================
-- 1. DIAGNÓSTICO INICIAL
-- ===============================

-- Verificar si la tabla profiles existe
SELECT 'TABLA PROFILES:' as info, 
       CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') 
            THEN '✅ EXISTE' 
            ELSE '❌ NO EXISTE' 
       END as status;

-- Verificar políticas actuales
SELECT 'POLÍTICAS ACTUALES:' as info, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ===============================
-- 2. LIMPIAR POLÍTICAS PROBLEMÁTICAS
-- ===============================

-- Eliminar TODAS las políticas problemáticas que causan recursión
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- ===============================
-- 3. CREAR POLÍTICAS SIMPLES Y SEGURAS
-- ===============================

-- Política básica para leer el propio perfil
CREATE POLICY "allow_select_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Política para actualizar el propio perfil
CREATE POLICY "allow_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para insertar perfil (solo el propio)
CREATE POLICY "allow_insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ===============================
-- 4. VERIFICACIÓN FINAL
-- ===============================

-- Mostrar políticas activas después del arreglo
SELECT 'POLÍTICAS NUEVAS:' as info, 
       policyname as politica, 
       cmd as operacion
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Verificar que RLS está habilitado
SELECT 'RLS STATUS:' as info,
       CASE WHEN relrowsecurity THEN '✅ HABILITADO' ELSE '❌ DESHABILITADO' END as status
FROM pg_class 
WHERE relname = 'profiles';

-- ===============================
-- 5. CREAR FUNCIÓN DE PRUEBA
-- ===============================

-- Función para probar que las consultas funcionan
CREATE OR REPLACE FUNCTION test_profiles_access()
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- Intentar consultar profiles con usuario actual
    SELECT COALESCE(full_name, 'Sin nombre') INTO result
    FROM profiles 
    WHERE id = auth.uid()
    LIMIT 1;
    
    IF result IS NOT NULL THEN
        RETURN '✅ ACCESO A PROFILES FUNCIONANDO: ' || result;
    ELSE
        RETURN '⚠️ NO SE ENCONTRÓ PERFIL PARA EL USUARIO ACTUAL';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN '❌ ERROR AL ACCEDER A PROFILES: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar prueba
SELECT test_profiles_access() as test_result;

-- ===============================
-- INSTRUCCIONES PARA APLICAR:
-- ===============================

-- 1. Ve a Supabase Dashboard → SQL Editor
-- 2. Pega todo este script
-- 3. Ejecuta el script completo
-- 4. Verifica que aparezca "✅ ACCESO A PROFILES FUNCIONANDO"
-- 5. Prueba tu aplicación de nuevo

-- Si aún tienes problemas después de esto, ejecuta:
-- SELECT test_profiles_access();
-- 
-- Y comparte el resultado para más diagnóstico.