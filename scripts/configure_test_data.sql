-- Script para configurar perfiles y datos de prueba
-- Ejecutar DESPUÉS de crear usuarios en Supabase Auth

-- 1. Actualizar perfiles con nombres y roles
UPDATE profiles SET 
  full_name = 'María Manager', 
  role = 'manager'::user_role
WHERE id = (SELECT id FROM auth.users WHERE email = 'manager@taskapp.com');

UPDATE profiles SET 
  full_name = 'Carlos Supervisor', 
  role = 'supervisor'::user_role
WHERE id = (SELECT id FROM auth.users WHERE email = 'supervisor@taskapp.com');

UPDATE profiles SET 
  full_name = 'Pedro Senior', 
  role = 'developer'::user_role
WHERE id = (SELECT id FROM auth.users WHERE email = 'senior@taskapp.com');

UPDATE profiles SET 
  full_name = 'Ana Junior', 
  role = 'developer'::user_role
WHERE id = (SELECT id FROM auth.users WHERE email = 'junior@taskapp.com');

-- 2. Asignar tareas específicas a cada usuario
UPDATE tasks SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'manager@taskapp.com'
) WHERE title IN ('Planificar sprint', 'Coordinar con cliente');

UPDATE tasks SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'supervisor@taskapp.com'
) WHERE title IN ('Supervisar progreso del equipo');

UPDATE tasks SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'senior@taskapp.com'
) WHERE title IN ('Revisar código de seguridad', 'Optimizar consultas de base de datos');

UPDATE tasks SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'junior@taskapp.com'
) WHERE title IN ('Configurar entorno de desarrollo', 'Implementar autenticación');

-- 3. Asignar proyectos a usuarios (si existe la tabla projects)
UPDATE projects SET created_by = (
  SELECT id FROM auth.users WHERE email = 'manager@taskapp.com'
) WHERE name IN ('Sistema de Gestión Empresarial', 'Aplicación Móvil de Delivery')
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects');

UPDATE projects SET created_by = (
  SELECT id FROM auth.users WHERE email = 'supervisor@taskapp.com'
) WHERE name IN ('Plataforma E-learning', 'Sistema de Inventario')
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects');

UPDATE projects SET created_by = (
  SELECT id FROM auth.users WHERE email = 'senior@taskapp.com'
) WHERE name IN ('API de Microservicios')
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects');

-- 4. Crear work_days para cada usuario (si existe la tabla)
INSERT INTO work_days (user_id, date, target_hours, worked_hours, status, created_at, updated_at)
SELECT 
  u.id as user_id,
  CURRENT_DATE as date,
  8.0 as target_hours,
  0.0 as worked_hours,
  'pending' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u 
WHERE u.email IN (
  'manager@taskapp.com',
  'supervisor@taskapp.com',
  'senior@taskapp.com',
  'junior@taskapp.com'
)
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_days')
ON CONFLICT (user_id, date) DO NOTHING;

-- 5. Crear notificaciones de bienvenida (si existe la tabla)
INSERT INTO notifications (user_id, title, message, type, created_at, read_at) 
SELECT 
  u.id as user_id,
  'Bienvenido al sistema' as title,
  'Tu cuenta ha sido configurada correctamente. ¡Comienza a gestionar tus tareas!' as message,
  'info' as type,
  NOW() as created_at,
  NULL as read_at
FROM auth.users u 
WHERE u.email IN (
  'manager@taskapp.com',
  'supervisor@taskapp.com',
  'senior@taskapp.com',
  'junior@taskapp.com'
)
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications');

-- 6. Verificar que todo se configuró correctamente
SELECT 
  u.email,
  p.full_name,
  p.role,
  COUNT(t.id) as tasks_assigned
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN tasks t ON u.id = t.assigned_to
WHERE u.email LIKE '%taskapp.com'
GROUP BY u.email, p.full_name, p.role
ORDER BY u.email;

-- Mostrar resultado esperado:
SELECT 'Configuración completada. Verifica los resultados arriba.' as status; 