-- CONFIGURAR TUS USUARIOS ESPECÍFICOS
-- Para los 3 usuarios que creaste manualmente

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

-- 2. Verificar que los perfiles se crearon correctamente
SELECT 
  p.full_name,
  p.role,
  u.email,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.role DESC, p.full_name;

-- 3. Asignar algunas tareas al admin (Germán) para testing
UPDATE tasks SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'german@taskmanager.com'
) WHERE title IN ('Revisar arquitectura', 'Configurar base de datos');

-- 4. Asignar tareas a los usuarios normales
UPDATE tasks SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'zizi@taskmanager.com'
) WHERE title IN ('Implementar login', 'Diseño de interfaz');

UPDATE tasks SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'albert@taskmanager.com'
) WHERE title IN ('Testing de funcionalidades', 'Documentación');

-- 5. Crear algunas notificaciones de ejemplo para testing
INSERT INTO notifications (
  user_id, 
  title, 
  message, 
  type, 
  read
) VALUES 
(
  (SELECT id FROM auth.users WHERE email = 'german@taskmanager.com'),
  'Sistema configurado',
  'La autenticación está funcionando correctamente',
  'system',
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'zizi@taskmanager.com'),
  'Nueva tarea asignada',
  'Se te ha asignado la tarea: Implementar login',
  'task',
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'albert@taskmanager.com'),
  'Nueva tarea asignada', 
  'Se te ha asignado la tarea: Testing de funcionalidades',
  'task',
  false
);

-- ✅ CONFIGURACIÓN COMPLETADA PARA TUS USUARIOS
-- 
-- USUARIOS CONFIGURADOS:
-- • german@taskmanager.com → ADMIN → "Germán Enguix"
-- • zizi@taskmanager.com → USER → "Zizi Fusea"  
-- • albert@taskmanager.com → USER → "Albert Soriano"
--
-- ¡YA PUEDES PROBAR EL LOGIN CON TUS USUARIOS REALES!

SELECT 'Configuración personalizada completada' as status; 