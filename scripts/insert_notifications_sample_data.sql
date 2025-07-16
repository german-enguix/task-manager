-- Script para insertar datos de ejemplo de notificaciones de trabajo
-- Ejecutar después de crear las tablas de timesheet

-- 1. Insertar notificaciones de ejemplo para el usuario de prueba
INSERT INTO work_notifications (
  id,
  user_id,
  work_day_id,
  title,
  message,
  type,
  is_read,
  is_urgent,
  action_required,
  action_type,
  action_data,
  scheduled_for,
  expires_at
) VALUES 
-- Notificación de tarea urgente
(
  '770e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440001', -- usuario de prueba
  NULL, -- no vinculada a work_day específico
  'Tarea Urgente Asignada',
  'Se te ha asignado una nueva tarea con prioridad alta: "Reparación Urgente Puente Acceso". Revisa los detalles y comienza lo antes posible.',
  'warning',
  false,
  true, -- es urgente
  true, -- requiere acción
  'navigate_to_task',
  '{"taskId": "550e8400-e29b-41d4-a716-446655440003"}',
  NOW() - INTERVAL '2 hours',
  NOW() + INTERVAL '1 day'
),

-- Notificación de timesheet
(
  '770e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  NULL,
  'Recordatorio de Fichaje',
  'No olvides iniciar tu jornada laboral. Es importante registrar tu hora de entrada para el control horario.',
  'info',
  false,
  false,
  true,
  'start_timesheet',
  '{}',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '2 hours'
),

-- Notificación de evidencia pendiente
(
  '770e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440001',
  NULL,
  'Evidencia Pendiente',
  'Tienes 2 subtareas que requieren evidencia fotográfica. Completa la documentación necesaria antes de finalizar.',
  'warning',
  false,
  false,
  true,
  'navigate_to_task',
  '{"taskId": "550e8400-e29b-41d4-a716-446655440001", "section": "evidences"}',
  NOW() - INTERVAL '30 minutes',
  NOW() + INTERVAL '3 days'
),

-- Notificación de tarea completada
(
  '770e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440001',
  NULL,
  '¡Tarea Completada!',
  'Has completado exitosamente la tarea "Instalación HVAC Centro Norte". ¡Excelente trabajo!',
  'success',
  true, -- ya leída
  false,
  false,
  NULL,
  '{}',
  NOW() - INTERVAL '3 hours',
  NULL -- no expira
),

-- Notificación de supervisión
(
  '770e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440001',
  NULL,
  'Observación del Supervisor',
  'El supervisor ha añadido una nueva observación al proyecto "Renovación Centro Comercial". Revisa los comentarios y ajusta el plan de trabajo según sea necesario.',
  'info',
  false,
  false,
  true,
  'navigate_to_project',
  '{"projectId": "550e8400-e29b-41d4-a716-446655440010", "section": "observations"}',
  NOW() - INTERVAL '45 minutes',
  NOW() + INTERVAL '2 days'
),

-- Notificación de pausa extendida
(
  '770e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440001',
  NULL,
  'Pausa Extendida Detectada',
  'Has estado en pausa durante más de 30 minutos. ¿Necesitas registrar un descanso oficial o continuar con el trabajo?',
  'warning',
  false,
  false,
  true,
  'manage_timesheet',
  '{"action": "extended_break"}',
  NOW() - INTERVAL '15 minutes',
  NOW() + INTERVAL '1 hour'
),

-- Notificación de fin de jornada
(
  '770e8400-e29b-41d4-a716-446655440007',
  '550e8400-e29b-41d4-a716-446655440001',
  NULL,
  'Hora de Finalizar',
  'Tu jornada laboral programada termina en 15 minutos. Asegúrate de completar las tareas pendientes y registrar tu salida.',
  'info',
  false,
  false,
  true,
  'end_workday',
  '{}',
  NOW() - INTERVAL '5 minutes',
  NOW() + INTERVAL '30 minutes'
),

-- Notificación de actualización del sistema
(
  '770e8400-e29b-41d4-a716-446655440008',
  '550e8400-e29b-41d4-a716-446655440001',
  NULL,
  'Actualización Disponible',
  'Nueva versión de la aplicación disponible con mejoras de rendimiento y nuevas funcionalidades. Actualiza cuando sea conveniente.',
  'info',
  true, -- ya leída
  false,
  false,
  'app_update',
  '{"version": "2.1.0", "features": ["Mejor sincronización", "Nuevos reportes", "Interfaz mejorada"]}',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '7 days'
),

-- Notificación de capacitación
(
  '770e8400-e29b-41d4-a716-446655440009',
  '550e8400-e29b-41d4-a716-446655440001',
  NULL,
  'Capacitación Programada',
  'Recordatorio: Capacitación en seguridad laboral programada para mañana a las 10:00 AM. Ubicación: Sala de reuniones principal.',
  'info',
  false,
  false,
  true,
  'training_reminder',
  '{"date": "2024-12-01", "time": "10:00", "location": "Sala de reuniones principal", "topic": "Seguridad laboral"}',
  NOW() + INTERVAL '18 hours',
  NOW() + INTERVAL '2 days'
),

-- Notificación de herramienta requerida
(
  '770e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440001',
  NULL,
  'Herramienta No Disponible',
  'La grúa torre requerida para tu próxima tarea no está disponible. Contacta con el supervisor para reprogramar o encontrar alternativas.',
  'error',
  false,
  true,
  true,
  'contact_supervisor',
  '{"resource": "Grúa torre", "taskId": "550e8400-e29b-41d4-a716-446655440001", "supervisor": "Ana García Rodríguez"}',
  NOW() - INTERVAL '20 minutes',
  NOW() + INTERVAL '4 hours'
);

-- 2. Crear función para generar notificaciones automáticas
CREATE OR REPLACE FUNCTION generate_work_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_is_urgent BOOLEAN DEFAULT false,
  p_action_required BOOLEAN DEFAULT false,
  p_action_type TEXT DEFAULT NULL,
  p_action_data JSONB DEFAULT '{}',
  p_expires_in_hours INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO work_notifications (
    user_id,
    title,
    message,
    type,
    is_urgent,
    action_required,
    action_type,
    action_data,
    expires_at
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_is_urgent,
    p_action_required,
    p_action_type,
    p_action_data,
    CASE 
      WHEN p_expires_in_hours > 0 THEN NOW() + (p_expires_in_hours || ' hours')::INTERVAL
      ELSE NULL
    END
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear función para limpiar notificaciones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM work_notifications 
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW()
    AND is_read = true; -- Solo eliminar las que ya han sido leídas
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Programar limpieza automática (opcional, se puede configurar con cron)
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_expired_notifications();');

-- 5. Ejemplo de consulta para obtener notificaciones activas
-- SELECT * FROM work_notifications 
-- WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'
--   AND (expires_at IS NULL OR expires_at > NOW())
-- ORDER BY 
--   is_urgent DESC,
--   is_read ASC,
--   created_at DESC
-- LIMIT 20; 