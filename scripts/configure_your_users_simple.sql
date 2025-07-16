-- CONFIGURAR SOLO TUS USUARIOS (VERSIÓN SIMPLE Y SEGURA)
-- No depende de otras tablas, solo configura profiles

-- 1. Configurar perfiles de tus usuarios reales
UPDATE profiles SET 
  full_name = 'Zizi Fusea', 
  role = 'user'::user_role
WHERE id = (SELECT id FROM auth.users WHERE email = 'zizi@taskmanager.com');

UPDATE profiles SET 
  full_name = 'Albert Soriano', 
  role = 'user'::user_role
WHERE id = (SELECT id FROM auth.users WHERE email = 'albert@taskmanager.com');

UPDATE profiles SET 
  full_name = 'Germán Enguix', 
  role = 'admin'::user_role
WHERE id = (SELECT id FROM auth.users WHERE email = 'german@taskmanager.com');

-- 2. Verificar que los perfiles se configuraron correctamente
SELECT 
  p.full_name,
  p.role,
  u.email,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.role DESC, p.full_name;

-- 3. Mostrar resultado
SELECT 
  'Usuarios configurados correctamente' as status,
  count(*) as total_usuarios,
  count(*) FILTER (WHERE role = 'admin') as admins,
  count(*) FILTER (WHERE role = 'user') as users
FROM profiles;

-- ✅ CONFIGURACIÓN BÁSICA COMPLETADA
-- 
-- USUARIOS CONFIGURADOS:
-- • german@taskmanager.com → ADMIN → "Germán Enguix"
-- • zizi@taskmanager.com → USER → "Zizi Fusea"  
-- • albert@taskmanager.com → USER → "Albert Soriano"
--
-- ¡YA PUEDES PROBAR EL LOGIN CON TUS USUARIOS! 