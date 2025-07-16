-- SCRIPT DIAGNÓSTICO - Solo verifica qué tienes actualmente
-- NO hace cambios, solo muestra información

-- 1. Verificar si existe el tipo user_role
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') 
        THEN 'SÍ EXISTE' 
        ELSE 'NO EXISTE' 
    END as enum_user_role_existe;

-- 2. Ver qué valores tiene el enum user_role actual
SELECT 
    'Valores actuales en enum user_role:' as info,
    enumlabel as valor,
    enumsortorder as orden
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- 3. Verificar si existe la tabla profiles
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
        THEN 'SÍ EXISTE' 
        ELSE 'NO EXISTE' 
    END as tabla_profiles_existe;

-- 4. Ver estructura de la tabla profiles (si existe)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 5. Contar registros en profiles (si existe)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
        THEN (SELECT count(*)::text FROM profiles)
        ELSE 'Tabla no existe'
    END as registros_en_profiles;

-- 6. Ver políticas de seguridad en profiles (si la tabla existe)
SELECT 
    COALESCE(policyname, 'Sin políticas') as nombre_politica,
    COALESCE(cmd, 'N/A') as comando,
    COALESCE(qual, 'N/A') as condicion
FROM pg_policies 
WHERE tablename = 'profiles'
UNION ALL
SELECT 'Tabla profiles no existe', 'N/A', 'N/A'
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles');

-- DIAGNÓSTICO COMPLETADO
-- Revisa los resultados arriba para entender tu configuración actual 