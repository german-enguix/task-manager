-- Script para crear usuarios de prueba
-- Nota: Este script debe ejecutarse desde el panel de Supabase o con privilegios de administrador

-- CONFIGURACIÓN HÍBRIDA - LOGIN POR NOMBRE CON SUPABASE AUTH:
-- Usuario 1: María Manager (email: maria.manager@taskmanager.com)
-- Usuario 2: Carlos Supervisor (email: carlos.supervisor@taskmanager.com)
-- Usuario 3: Pedro Senior (email: pedro.senior@taskmanager.com)
-- Usuario 4: Ana Junior (email: ana.junior@taskmanager.com)

-- CONTRASEÑA ÚNICA: Secret_123

-- IMPORTANTE: 
-- 1. PRIMERO ejecuta scripts/create_profiles_table.sql para crear la tabla
-- 2. DESPUÉS crea estos usuarios en Supabase Auth manualmente:
--    - Ve a Authentication > Users en tu proyecto Supabase
--    - Crea cada usuario con su email correspondiente
--    - Contraseña: Secret_123 para todos
--    - Marca "Email confirmed" automáticamente
-- 3. FINALMENTE ejecuta este script para completar los perfiles
-- 4. El login funciona por NOMBRE pero usa Supabase Auth internamente

-- Insertar/actualizar perfiles en la tabla profiles (después de crear los usuarios en Auth)
INSERT INTO profiles (id, email, full_name, avatar_url, role, department, phone, created_at, updated_at)
SELECT 
  auth.users.id,
  auth.users.email,
  CASE 
    WHEN auth.users.email = 'maria.manager@taskmanager.com' THEN 'María Manager'
    WHEN auth.users.email = 'carlos.supervisor@taskmanager.com' THEN 'Carlos Supervisor'
    WHEN auth.users.email = 'pedro.senior@taskmanager.com' THEN 'Pedro Senior'
    WHEN auth.users.email = 'ana.junior@taskmanager.com' THEN 'Ana Junior'
  END as full_name,
  NULL as avatar_url,
  CASE 
    WHEN auth.users.email = 'maria.manager@taskmanager.com' THEN 'manager'::user_role
    WHEN auth.users.email = 'carlos.supervisor@taskmanager.com' THEN 'supervisor'::user_role
    WHEN auth.users.email = 'pedro.senior@taskmanager.com' THEN 'developer'::user_role
    WHEN auth.users.email = 'ana.junior@taskmanager.com' THEN 'developer'::user_role
  END as role,
  CASE 
    WHEN auth.users.email = 'maria.manager@taskmanager.com' THEN 'Gestión'::user_department
    WHEN auth.users.email = 'carlos.supervisor@taskmanager.com' THEN 'Supervisión'::user_department
    WHEN auth.users.email = 'pedro.senior@taskmanager.com' THEN 'Desarrollo'::user_department
    WHEN auth.users.email = 'ana.junior@taskmanager.com' THEN 'Desarrollo'::user_department
  END as department,
  CASE 
    WHEN auth.users.email = 'maria.manager@taskmanager.com' THEN '+34 600 777 888'
    WHEN auth.users.email = 'carlos.supervisor@taskmanager.com' THEN '+34 600 111 222'
    WHEN auth.users.email = 'pedro.senior@taskmanager.com' THEN '+34 600 555 666'
    WHEN auth.users.email = 'ana.junior@taskmanager.com' THEN '+34 600 333 444'
  END as phone,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users 
WHERE auth.users.email IN (
  'maria.manager@taskmanager.com',
  'carlos.supervisor@taskmanager.com',
  'pedro.senior@taskmanager.com',
  'ana.junior@taskmanager.com'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Asignar diferentes tareas y proyectos a cada usuario
-- Actualizar las tareas existentes para asignarlas a diferentes usuarios

UPDATE tasks SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'ana.junior@taskmanager.com' LIMIT 1
) WHERE title IN ('Configurar entorno de desarrollo', 'Implementar autenticación');

UPDATE tasks SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'pedro.senior@taskmanager.com' LIMIT 1  
) WHERE title IN ('Revisar código de seguridad', 'Optimizar consultas de base de datos');

UPDATE tasks SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'carlos.supervisor@taskmanager.com' LIMIT 1
) WHERE title IN ('Supervisar progreso del equipo');

UPDATE tasks SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'maria.manager@taskmanager.com' LIMIT 1
) WHERE title IN ('Planificar sprint', 'Coordinar con cliente');

-- Actualizar proyectos para asignar diferentes responsables
UPDATE projects SET created_by = (
  SELECT id FROM auth.users WHERE email = 'maria.manager@taskmanager.com' LIMIT 1
) WHERE name IN ('Sistema de Gestión Empresarial', 'Aplicación Móvil de Delivery');

UPDATE projects SET created_by = (
  SELECT id FROM auth.users WHERE email = 'carlos.supervisor@taskmanager.com' LIMIT 1
) WHERE name IN ('Plataforma E-learning', 'Sistema de Inventario');

UPDATE projects SET created_by = (
  SELECT id FROM auth.users WHERE email = 'pedro.senior@taskmanager.com' LIMIT 1
) WHERE name IN ('API de Microservicios');

-- Crear algunas notificaciones específicas por usuario
INSERT INTO notifications (user_id, title, message, type, related_task_id, created_at, read_at) 
SELECT 
  u.id as user_id,
  'Bienvenido al sistema' as title,
  'Tu cuenta ha sido configurada correctamente. ¡Comienza a gestionar tus tareas!' as message,
  'info' as type,
  NULL as related_task_id,
  NOW() as created_at,
  NULL as read_at
FROM auth.users u 
WHERE u.email IN (
  'maria.manager@taskmanager.com',
  'carlos.supervisor@taskmanager.com',
  'pedro.senior@taskmanager.com',
  'ana.junior@taskmanager.com'
);

-- Crear work_days iniciales para cada usuario
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
  'maria.manager@taskmanager.com',
  'carlos.supervisor@taskmanager.com',
  'pedro.senior@taskmanager.com',
  'ana.junior@taskmanager.com'
)
ON CONFLICT (user_id, date) DO NOTHING;

-- Verificar que todo se creó correctamente
SELECT 
  u.email,
  p.full_name,
  p.role,
  p.department,
  COUNT(t.id) as assigned_tasks,
  COUNT(pr.id) as created_projects
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN tasks t ON u.id = t.assigned_to
LEFT JOIN projects pr ON u.id = pr.created_by
WHERE u.email IN (
  'maria.manager@taskmanager.com',
  'carlos.supervisor@taskmanager.com',
  'pedro.senior@taskmanager.com',
  'ana.junior@taskmanager.com'
)
GROUP BY u.email, p.full_name, p.role, p.department
ORDER BY u.email; 