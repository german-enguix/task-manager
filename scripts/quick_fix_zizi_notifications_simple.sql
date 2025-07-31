-- =============================================
-- SCRIPT SIMPLE PARA ARREGLAR NOTIFICACIONES DE ZIZI
-- =============================================

DO $$
DECLARE
    zizi_user_id UUID;
    first_task_id UUID;
    second_task_id UUID;
BEGIN

-- 1. Encontrar usuario Zizi
SELECT u.id INTO zizi_user_id
FROM auth.users u
WHERE u.email LIKE '%zizi%' OR u.id = '550e8400-e29b-41d4-a716-446655440001'
LIMIT 1;

RAISE NOTICE '👤 Usuario Zizi: %', zizi_user_id;

-- 2. Encontrar tareas de Zizi
SELECT t.id INTO first_task_id
FROM tasks t
WHERE zizi_user_id = ANY(t.assigned_to)
ORDER BY t.created_at DESC
LIMIT 1;

SELECT t.id INTO second_task_id
FROM tasks t
WHERE zizi_user_id = ANY(t.assigned_to)
AND t.id != COALESCE(first_task_id, '00000000-0000-0000-0000-000000000000')
ORDER BY t.created_at DESC
LIMIT 1;

RAISE NOTICE '📋 Tareas: % y %', first_task_id, second_task_id;

-- 3. Actualizar notificaciones
IF first_task_id IS NOT NULL THEN
    UPDATE work_notifications 
    SET action_data = json_build_object('taskId', first_task_id)
    WHERE user_id = zizi_user_id 
      AND title = 'Tarea urgente pendiente';
    
    RAISE NOTICE '✅ Notificación urgente actualizada';
    
    UPDATE work_notifications 
    SET action_data = json_build_object('taskId', COALESCE(second_task_id, first_task_id))
    WHERE user_id = zizi_user_id 
      AND title = 'Nueva tarea asignada';
      
    RAISE NOTICE '✅ Notificación de tarea asignada actualizada';
ELSE
    RAISE NOTICE '❌ No se encontraron tareas para Zizi';
END IF;

RAISE NOTICE '🎉 SCRIPT COMPLETADO - Prueba las notificaciones ahora';

END $$;

-- Verificar resultado
SELECT 
    '📊 NOTIFICACIONES ACTUALIZADAS:' as info,
    title,
    action_required,
    action_data
FROM work_notifications n
JOIN auth.users u ON n.user_id = u.id
WHERE u.email LIKE '%zizi%' OR n.user_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY n.created_at DESC; 