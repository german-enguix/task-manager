-- =============================================
-- SCRIPT PARA DEBUGGEAR NOTIFICACIONES
-- =============================================
-- Ver qué notificaciones existen y sus datos

-- 1. Ver todas las notificaciones de Zizi
SELECT 'NOTIFICACIONES ACTUALES DE ZIZI:' as info;

SELECT 
    n.id,
    n.title,
    n.type,
    n.is_read,
    n.action_required,
    n.action_data,
    n.created_at
FROM work_notifications n
JOIN auth.users u ON n.user_id = u.id 
WHERE u.email LIKE '%zizi%' OR n.user_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY n.created_at DESC;

-- 2. Ver tareas disponibles de Zizi
SELECT 'TAREAS DISPONIBLES DE ZIZI:' as info;

SELECT 
    t.id,
    t.title,
    t.status,
    t.due_date
FROM tasks t
WHERE '550e8400-e29b-41d4-a716-446655440001' = ANY(t.assigned_to)
   OR EXISTS (
       SELECT 1 FROM auth.users u 
       JOIN profiles p ON u.id = p.id
       WHERE u.email LIKE '%zizi%' 
       AND u.id = ANY(t.assigned_to)
   )
ORDER BY t.created_at DESC
LIMIT 5;

-- 3. Verificar estructura del action_data
SELECT 'ESTRUCTURA DE ACTION_DATA:' as info;

SELECT 
    title,
    action_data,
    pg_typeof(action_data) as data_type
FROM work_notifications 
WHERE action_data IS NOT NULL
LIMIT 3; 