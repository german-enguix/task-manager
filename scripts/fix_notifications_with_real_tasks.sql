-- =============================================
-- SCRIPT PARA ARREGLAR NOTIFICACIONES CON TASKIDS REALES
-- =============================================

DO $$
DECLARE
    zizi_user_id UUID;
    first_task_id UUID;
    second_task_id UUID;
BEGIN

-- Encontrar usuario Zizi
SELECT u.id INTO zizi_user_id
FROM auth.users u
WHERE u.email LIKE '%zizi%' OR u.id = '550e8400-e29b-41d4-a716-446655440001'
LIMIT 1;

-- Encontrar tareas reales de Zizi
SELECT t.id INTO first_task_id
FROM tasks t
WHERE zizi_user_id = ANY(t.assigned_to)
ORDER BY t.created_at DESC
LIMIT 1;

SELECT t.id INTO second_task_id
FROM tasks t
WHERE zizi_user_id = ANY(t.assigned_to)
AND t.id != first_task_id
ORDER BY t.created_at DESC
LIMIT 1;

RAISE NOTICE 'Usuario: %, Tarea 1: %, Tarea 2: %', zizi_user_id, first_task_id, second_task_id;

-- Actualizar notificaciones existentes con taskIds reales
UPDATE work_notifications 
SET action_data = json_build_object('taskId', first_task_id)
WHERE user_id = zizi_user_id 
  AND action_required = true
  AND (action_data IS NULL OR action_data::text = '{}' OR action_data::text LIKE '%tarea_no_encontrada%')
  AND first_task_id IS NOT NULL;

-- Si hay una segunda tarea, usar para otras notificaciones
IF second_task_id IS NOT NULL THEN
    UPDATE work_notifications 
    SET action_data = json_build_object('taskId', second_task_id)
    WHERE user_id = zizi_user_id 
      AND action_required = true
      AND type = 'task_assigned'
      AND first_task_id IS NOT NULL;
END IF;

-- Mostrar resultado
RAISE NOTICE '✅ Notificaciones actualizadas con taskIds reales';

SELECT 
    'NOTIFICACIONES DESPUÉS DEL FIX:' as info,
    title,
    action_required,
    action_data
FROM work_notifications 
WHERE user_id = zizi_user_id
ORDER BY created_at DESC;

END $$; 