-- =============================================
-- SCRIPT RÁPIDO PARA ARREGLAR NOTIFICACIONES DE ZIZI
-- =============================================

DO $$
DECLARE
    zizi_user_id UUID;
    first_task_id UUID;
    second_task_id UUID;
    notification_count INTEGER;
BEGIN

-- 1. Encontrar usuario Zizi
SELECT u.id INTO zizi_user_id
FROM auth.users u
WHERE u.email LIKE '%zizi%' OR u.id = '550e8400-e29b-41d4-a716-446655440001'
LIMIT 1;

RAISE NOTICE '👤 Usuario Zizi encontrado: %', zizi_user_id;

-- 2. Encontrar tareas reales de Zizi
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

RAISE NOTICE '📋 Tareas encontradas: % y %', first_task_id, second_task_id;

-- 3. Arreglar notificaciones con taskIds reales
IF first_task_id IS NOT NULL THEN
    -- Actualizar primera notificación urgente
    UPDATE work_notifications 
    SET action_data = json_build_object('taskId', first_task_id)
    WHERE user_id = zizi_user_id 
      AND title = 'Tarea urgente pendiente';
    
    GET DIAGNOSTICS notification_count = ROW_COUNT;
    RAISE NOTICE '✅ Notificación urgente actualizada: % filas', notification_count;
    
    -- Actualizar segunda notificación de tarea asignada
    IF second_task_id IS NOT NULL THEN
        UPDATE work_notifications 
        SET action_data = json_build_object('taskId', second_task_id)
        WHERE user_id = zizi_user_id 
          AND title = 'Nueva tarea asignada';
          
        GET DIAGNOSTICS notification_count = ROW_COUNT;
        RAISE NOTICE '✅ Notificación de tarea asignada actualizada: % filas', notification_count;
    ELSE
        -- Si no hay segunda tarea, usar la primera para ambas
        UPDATE work_notifications 
        SET action_data = json_build_object('taskId', first_task_id)
        WHERE user_id = zizi_user_id 
          AND title = 'Nueva tarea asignada';
          
        GET DIAGNOSTICS notification_count = ROW_COUNT;
        RAISE NOTICE '✅ Segunda notificación actualizada con primera tarea: % filas', notification_count;
    END IF;
ELSE
    RAISE NOTICE '❌ No se encontraron tareas para Zizi. No se pueden actualizar notificaciones.';
END IF;

-- 4. Mostrar resultado final
RAISE NOTICE '📊 VERIFICACIÓN FINAL COMPLETADA';
RAISE NOTICE 'Ejecuta esta consulta para ver el resultado:';
RAISE NOTICE 'SELECT title, action_required, action_data FROM work_notifications WHERE user_id = ''%'' ORDER BY created_at DESC;', zizi_user_id;

END $$; 