-- CREAR PERFILES PARA USUARIOS EXISTENTES
-- Los usuarios ya existen pero no tienen perfiles

-- 1. Insertar perfiles para tus usuarios (no actualizar)
INSERT INTO profiles (id, full_name, role)
SELECT 
    u.id,
    CASE 
        WHEN u.email = 'german@taskmanager.com' THEN 'Germán Enguix'
        WHEN u.email = 'zizi@taskmanager.com' THEN 'Zizi Fusea'
        WHEN u.email = 'albert@taskmanager.com' THEN 'Albert Soriano'
        ELSE u.email -- fallback al email si no coincide
    END as full_name,
    CASE 
        WHEN u.email = 'german@taskmanager.com' THEN 'admin'::user_role
        ELSE 'user'::user_role
    END as role
FROM auth.users u
WHERE u.email IN ('german@taskmanager.com', 'zizi@taskmanager.com', 'albert@taskmanager.com')
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- 2. Verificar que los perfiles se crearon correctamente
SELECT 
    'PERFILES CREADOS:' as info,
    p.full_name,
    p.role,
    u.email,
    p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.role DESC, p.full_name;

-- 3. Resumen final
SELECT 
    'RESUMEN FINAL:' as info,
    count(*) as total_perfiles,
    count(*) FILTER (WHERE role = 'admin') as admins,
    count(*) FILTER (WHERE role = 'user') as users
FROM profiles;

-- ✅ PERFILES CREADOS EXITOSAMENTE
-- 
-- USUARIOS CONFIGURADOS:
-- • german@taskmanager.com → ADMIN → "Germán Enguix"
-- • zizi@taskmanager.com → USER → "Zizi Fusea"  
-- • albert@taskmanager.com → USER → "Albert Soriano"
--
-- ¡AHORA SÍ PUEDES PROBAR EL LOGIN! 