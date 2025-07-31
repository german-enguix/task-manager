-- =============================================
-- SCRIPT SIMPLE PARA CREAR NOTIFICACIONES DE ZIZI
-- =============================================
-- Este script crea notificaciones realistas para Zizi
-- Usando solo las columnas básicas que sabemos que existen
-- =============================================

DO $$
DECLARE
    zizi_user_id UUID;
    user_email TEXT;
BEGIN

-- =============================================
-- 1. OBTENER USUARIO ZIZI
-- =============================================

RAISE NOTICE '🔍 Buscando usuario ZIZI...';

-- Buscar específicamente a ZIZI
SELECT p.id INTO zizi_user_id 
FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'zizi@taskmanager.com'
LIMIT 1;

-- Si ZIZI no existe con ese email exacto, buscar variantes
IF zizi_user_id IS NULL THEN
    SELECT p.id INTO zizi_user_id 
    FROM profiles p 
    JOIN auth.users u ON p.id = u.id 
    WHERE LOWER(u.email) LIKE '%zizi%'
    LIMIT 1;
    
    IF zizi_user_id IS NOT NULL THEN
        RAISE NOTICE '⚠️ ZIZI no encontrado con email exacto, usando usuario con email similar';
    END IF;
END IF;

-- Si no hay usuarios zizi, usar el ID hardcodeado de la app
IF zizi_user_id IS NULL THEN
    zizi_user_id := '550e8400-e29b-41d4-a716-446655440001';
    RAISE NOTICE '⚠️ Usuario ZIZI no encontrado, usando ID hardcodeado de la app';
END IF;

-- Verificar que tenemos un usuario
IF zizi_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el usuario ZIZI ni el ID hardcodeado. Verifica la configuración.';
END IF;

-- Obtener info del usuario para debug
SELECT u.email INTO user_email 
FROM auth.users u 
WHERE u.id = zizi_user_id;

RAISE NOTICE '👤 Usuario asignado: % (email: %)', zizi_user_id, COALESCE(user_email, 'email no encontrado');

-- =============================================
-- 2. LIMPIAR NOTIFICACIONES EXISTENTES (OPCIONAL)
-- =============================================

DELETE FROM work_notifications WHERE user_id = zizi_user_id;
RAISE NOTICE '🧹 Notificaciones existentes de Zizi eliminadas';

-- =============================================
-- 3. CREAR NOTIFICACIONES DE PRUEBA REALISTAS
-- =============================================

-- Obtener algunas tareas reales de Zizi para hacer las notificaciones más realistas
SELECT t.id INTO task_qr_control
FROM tasks t 
WHERE zizi_user_id = ANY(t.assigned_to)
AND LOWER(t.title) LIKE '%control%'
LIMIT 1;

SELECT t.id INTO task_maintenance
FROM tasks t 
WHERE zizi_user_id = ANY(t.assigned_to)
AND LOWER(t.title) LIKE '%mantenimiento%'
LIMIT 1;

-- Si no encuentra tareas específicas, usar cualquier tarea de Zizi
IF task_qr_control IS NULL THEN
    SELECT t.id INTO task_qr_control
    FROM tasks t 
    WHERE zizi_user_id = ANY(t.assigned_to)
    LIMIT 1;
END IF;

IF task_maintenance IS NULL THEN
    SELECT t.id INTO task_maintenance
    FROM tasks t 
    WHERE zizi_user_id = ANY(t.assigned_to)
    ORDER BY t.created_at DESC
    LIMIT 1;
END IF;

-- Notificación 1: Recordatorio de tarea urgente
INSERT INTO work_notifications (
    user_id, 
    title, 
    message, 
    type, 
    is_urgent, 
    action_required, 
    action_data,
    created_at
) VALUES (
    zizi_user_id,
    'Tarea urgente pendiente',
    'Tienes una tarea de control de calidad que vence hoy. Por favor, completa la verificación QR lo antes posible.',
    'task_reminder',
    true,
    true,
    CASE 
        WHEN task_qr_control IS NOT NULL THEN json_build_object('taskId', task_qr_control)
        ELSE '{"message": "No hay tareas disponibles"}'
    END,
    NOW() - INTERVAL '30 minutes'
);

-- Notificación 2: Nueva tarea asignada
INSERT INTO work_notifications (
    user_id, 
    title, 
    message, 
    type, 
    is_urgent, 
    action_required, 
    action_data,
    created_at
) VALUES (
    zizi_user_id,
    'Nueva tarea asignada',
    'Se te ha asignado una nueva tarea de mantenimiento preventivo en el área de producción. Revisa los detalles y planifica tu día.',
    'task_assigned',
    false,
    true,
    CASE 
        WHEN task_maintenance IS NOT NULL THEN json_build_object('taskId', task_maintenance)
        ELSE '{"message": "No hay tareas disponibles"}'
    END,
    NOW() - INTERVAL '2 hours'
);

-- Notificación 3: Recordatorio de fin de jornada
INSERT INTO work_notifications (
    user_id, 
    title, 
    message, 
    type, 
    is_urgent, 
    action_required,
    created_at
) VALUES (
    zizi_user_id,
    'Recordatorio de fichaje',
    'No olvides completar tu fichaje al finalizar la jornada. Tu supervisor necesita confirmar las horas trabajadas.',
    'deadline_approaching',
    false,
    false,
    NOW() - INTERVAL '1 hour'
);

-- Notificación 4: Información del sistema
INSERT INTO work_notifications (
    user_id, 
    title, 
    message, 
    type, 
    is_urgent, 
    action_required,
    created_at
) VALUES (
    zizi_user_id,
    'Actualización del sistema',
    'El sistema de gestión de tareas ha sido actualizado con nuevas funcionalidades. Ahora puedes recibir notificaciones en tiempo real.',
    'info',
    false,
    false,
    NOW() - INTERVAL '3 hours'
);

-- Notificación 5: Tarea completada (ya leída)
INSERT INTO work_notifications (
    user_id, 
    title, 
    message, 
    type, 
    is_urgent, 
    action_required,
    is_read,
    read_at,
    created_at
) VALUES (
    zizi_user_id,
    'Tarea completada exitosamente',
    'Has completado la tarea de inspección de equipos. Excelente trabajo, todas las evidencias han sido enviadas correctamente.',
    'success',
    false,
    false,
    true,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '4 hours'
);

-- Notificación 6: Advertencia de herramientas
INSERT INTO work_notifications (
    user_id, 
    title, 
    message, 
    type, 
    is_urgent, 
    action_required,
    created_at
) VALUES (
    zizi_user_id,
    'Verificar herramientas de trabajo',
    'Recuerda verificar que tienes todas las herramientas necesarias antes de comenzar las tareas del día. Consulta la lista en tu área de trabajo.',
    'warning',
    false,
    false,
    NOW() - INTERVAL '5 hours'
);

-- =============================================
-- 4. VERIFICAR CREACIÓN
-- =============================================

RAISE NOTICE '✅ Notificaciones de Zizi creadas exitosamente';

-- Mostrar resumen
RAISE NOTICE '📊 RESUMEN: % notificaciones creadas, % sin leer', 
    (SELECT COUNT(*) FROM work_notifications WHERE user_id = zizi_user_id),
    (SELECT COUNT(*) FROM work_notifications WHERE user_id = zizi_user_id AND is_read = false);

END $$;

-- ✅ NOTIFICACIONES DE ZIZI CREADAS
-- 
-- NOTIFICACIONES CREADAS:
-- • Tarea urgente pendiente (URGENTE, ACCIÓN REQUERIDA)
-- • Nueva tarea asignada (ACCIÓN REQUERIDA)
-- • Recordatorio de fichaje
-- • Actualización del sistema
-- • Tarea completada (LEÍDA)
-- • Verificar herramientas
--
-- ¡ZIZI TENDRÁ NOTIFICACIONES REALISTAS EN LA APP! 