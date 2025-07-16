-- ARREGLAR POLÍTICAS RLS QUE CAUSAN RECURSIÓN INFINITA
-- Simplificar las políticas para evitar recursión

-- 1. Eliminar todas las políticas problemáticas
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 2. Crear políticas simples sin recursión
-- Política básica: usuarios pueden ver y editar su propio perfil
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles  
  FOR UPDATE USING (auth.uid() = id);

-- 3. Política para insertar (para nuevos usuarios)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Verificar que las políticas se crearon sin errores
SELECT 
    'POLÍTICAS RLS ARREGLADAS:' as info,
    policyname as politica,
    cmd as operacion
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ✅ POLÍTICAS SIMPLIFICADAS SIN RECURSIÓN
-- 
-- POLÍTICAS ACTIVAS:
-- • profiles_select_own - Ver propio perfil
-- • profiles_update_own - Editar propio perfil  
-- • profiles_insert_own - Crear propio perfil
--
-- ¡LOGIN DEBERÍA FUNCIONAR AHORA! 