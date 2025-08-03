-- CREAR PERFILES FALTANTES PARA USUARIOS EXISTENTES
-- Soluciona el problema: "NO SE ENCONTRÓ PERFIL PARA EL USUARIO ACTUAL"

-- ===============================
-- 1. DIAGNÓSTICO: USUARIOS SIN PERFIL
-- ===============================

-- Mostrar usuarios de auth.users que NO tienen perfil
SELECT 'USUARIOS SIN PERFIL:' as info,
       au.id,
       au.email,
       au.created_at as usuario_creado
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at;

-- Contar usuarios sin perfil
SELECT 'TOTAL USUARIOS SIN PERFIL:' as info,
       COUNT(*) as cantidad
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- ===============================
-- 2. CREAR PERFILES FALTANTES
-- ===============================

-- Crear perfiles para todos los usuarios que no lo tienen
INSERT INTO profiles (id, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name', 
        split_part(au.email, '@', 1),
        au.email
    ) as full_name,
    'user' as role,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- ===============================
-- 3. VERIFICAR PERFIL DEL USUARIO ACTUAL
-- ===============================

-- Mostrar el perfil del usuario actual
SELECT 'PERFIL USUARIO ACTUAL:' as info,
       id,
       full_name,
       role,
       created_at
FROM profiles 
WHERE id = auth.uid();

-- ===============================
-- 4. ASEGURAR QUE EL TRIGGER FUNCIONE
-- ===============================

-- Recrear la función del trigger para asegurar que funcione
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        NEW.email
    ),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===============================
-- 5. VERIFICACIÓN FINAL
-- ===============================

-- Contar usuarios con perfil después del arreglo
SELECT 'USUARIOS CON PERFIL DESPUÉS:' as info,
       COUNT(*) as cantidad
FROM auth.users au
INNER JOIN profiles p ON au.id = p.id;

-- Mostrar todos los perfiles creados
SELECT 'TODOS LOS PERFILES:' as info,
       p.full_name,
       p.role,
       au.email
FROM profiles p
INNER JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at;

-- Prueba final de acceso
SELECT 'PRUEBA FINAL:' as info,
       CASE 
           WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) 
           THEN '✅ PERFIL ENCONTRADO PARA USUARIO ACTUAL'
           ELSE '❌ PERFIL AÚN NO ENCONTRADO'
       END as resultado;

-- ===============================
-- INSTRUCCIONES:
-- ===============================

-- 1. Ejecuta este script completo en Supabase SQL Editor
-- 2. Verifica que aparezca "✅ PERFIL ENCONTRADO PARA USUARIO ACTUAL"
-- 3. Vuelve a probar tu aplicación
-- 4. Si sigues teniendo problemas, ejecuta el test anterior:
--    SELECT test_profiles_access();