-- Script de diagnóstico para verificar las tareas de Zizi
-- Ejecutar en el panel SQL de Supabase

-- ===============================
-- 1. VERIFICAR USUARIOS Y SUS IDS
-- ===============================

SELECT 'USUARIOS REGISTRADOS:' as info;
SELECT 
  u.id as auth_id,
  u.email,
  p.full_name,
  p.role,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email IN ('zizi@taskmanager.com', 'german@taskmanager.com', 'albert@taskmanager.com')
ORDER BY u.email;

-- ===============================
-- 2. VERIFICAR TAREAS CREADAS
-- ===============================

SELECT 'TAREAS DE ZIZI EN LA BASE DE DATOS:' as info;
SELECT 
  t.id,
  t.title,
  t.due_date,
  t.assigned_to,
  t.project_name,
  t.location,
  t.status,
  t.created_at
FROM tasks t
WHERE DATE(t.due_date) IN ('2025-07-14', '2025-07-15', '2025-07-16')
ORDER BY t.due_date, t.title;

-- ===============================
-- 3. VERIFICAR TAREAS POR USUARIO
-- ===============================

SELECT 'TAREAS ASIGNADAS A CADA USUARIO:' as info;
SELECT 
  u.email,
  p.full_name,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN DATE(t.due_date) IN ('2025-07-14', '2025-07-15', '2025-07-16') THEN 1 END) as july_tasks
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN tasks t ON u.id = t.assigned_to
WHERE u.email IN ('zizi@taskmanager.com', 'german@taskmanager.com', 'albert@taskmanager.com')
GROUP BY u.id, u.email, p.full_name
ORDER BY u.email;

-- ===============================
-- 4. VERIFICAR FECHAS ESPECÍFICAS
-- ===============================

SELECT 'TAREAS POR FECHA:' as info;
SELECT 
  DATE(t.due_date) as fecha,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN u.email = 'zizi@taskmanager.com' THEN 1 END) as zizi_tasks,
  COUNT(CASE WHEN u.email = 'german@taskmanager.com' THEN 1 END) as german_tasks,
  COUNT(CASE WHEN u.email = 'albert@taskmanager.com' THEN 1 END) as albert_tasks
FROM tasks t
JOIN auth.users u ON t.assigned_to = u.id
WHERE DATE(t.due_date) IN ('2025-07-14', '2025-07-15', '2025-07-16')
GROUP BY DATE(t.due_date)
ORDER BY DATE(t.due_date);

-- ===============================
-- 5. VERIFICAR ID HARDCODEADO EN LA APP
-- ===============================

-- El currentUserId hardcodeado en la app es '550e8400-e29b-41d4-a716-446655440001'
-- Verificar si coincide con algún usuario real

SELECT 'VERIFICAR ID HARDCODEADO EN LA APP:' as info;
SELECT 
  'ID hardcodeado en la app: 550e8400-e29b-41d4-a716-446655440001' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = '550e8400-e29b-41d4-a716-446655440001') 
    THEN 'EXISTE en auth.users'
    ELSE 'NO EXISTE en auth.users'
  END as auth_users_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE id = '550e8400-e29b-41d4-a716-446655440001') 
    THEN 'EXISTE en profiles'
    ELSE 'NO EXISTE en profiles'
  END as profiles_status;

-- Si existe, mostrar información del usuario
SELECT 
  'INFORMACIÓN DEL ID HARDCODEADO:' as info,
  u.email,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = '550e8400-e29b-41d4-a716-446655440001';

-- ===============================
-- 6. VERIFICAR TAREAS PARA EL ID HARDCODEADO
-- ===============================

SELECT 'TAREAS PARA EL ID HARDCODEADO:' as info;
SELECT 
  t.title,
  t.due_date,
  t.project_name,
  t.location
FROM tasks t
WHERE t.assigned_to = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY t.due_date;

-- ===============================
-- 7. VERIFICAR SUBTAREAS
-- ===============================

SELECT 'SUBTAREAS CREADAS:' as info;
SELECT 
  t.title as task_title,
  s.title as subtask_title,
  s.order_index,
  s.is_completed
FROM tasks t
JOIN subtasks s ON t.id = s.task_id
WHERE DATE(t.due_date) IN ('2025-07-14', '2025-07-15', '2025-07-16')
ORDER BY t.due_date, t.title, s.order_index;

-- ===============================
-- 8. SUGERENCIAS DE SOLUCIÓN
-- ===============================

SELECT 'DIAGNÓSTICO COMPLETO REALIZADO' as resultado;

-- Para mostrar tareas en la app, necesitas:
-- 1. Que el usuario logueado en la app coincida con el ID asignado a las tareas
-- 2. Que la fecha mostrada en la app sea 2025-07-14, 2025-07-15 o 2025-07-16
-- 3. Si no, puedes cambiar las fechas de las tareas al año actual o cambiar el ID hardcodeado 