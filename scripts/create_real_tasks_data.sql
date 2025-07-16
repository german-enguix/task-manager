-- =============================================
-- SCRIPT DE DATOS REALES DE TAREAS
-- =============================================
-- Este script crea tareas reales con:
-- 1. Tareas asignadas a usuarios reales
-- 2. Subtareas con evidencias
-- 3. Comentarios de ejemplo
-- 4. Fechas recientes para pruebas
-- 
-- PREREQUISITO: Ejecutar primero scripts/complete_database_setup.sql
-- =============================================

DO $$
DECLARE
    -- Variables para IDs de usuarios existentes
    zizi_id UUID;
    german_id UUID;
    albert_id UUID;
    manager_id UUID;
    
    -- IDs de tareas para referencias
    task1_id UUID := gen_random_uuid();
    task2_id UUID := gen_random_uuid();
    task3_id UUID := gen_random_uuid();
    task4_id UUID := gen_random_uuid();
    task5_id UUID := gen_random_uuid();
    task6_id UUID := gen_random_uuid();
    
    -- IDs de subtareas y evidencias
    subtask_id UUID;
    requirement_id UUID;
BEGIN

-- =============================================
-- 1. VERIFICAR Y OBTENER USUARIOS EXISTENTES
-- =============================================

-- Obtener IDs de usuarios existentes
SELECT p.id INTO zizi_id 
FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'zizi@taskmanager.com' 
LIMIT 1;

SELECT p.id INTO german_id 
FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'german@taskmanager.com' 
LIMIT 1;

SELECT p.id INTO albert_id 
FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'albert@taskmanager.com' 
LIMIT 1;

SELECT p.id INTO manager_id 
FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'manager@taskapp.com' 
LIMIT 1;

-- Verificar que al menos un usuario existe
IF zizi_id IS NULL AND german_id IS NULL AND albert_id IS NULL AND manager_id IS NULL THEN
    RAISE EXCEPTION 'No se encontraron usuarios. Primero debes crear los usuarios en Authentication > Users en Supabase';
END IF;

-- Usar el primer usuario disponible como fallback
IF zizi_id IS NULL THEN zizi_id := COALESCE(german_id, albert_id, manager_id); END IF;
IF german_id IS NULL THEN german_id := COALESCE(zizi_id, albert_id, manager_id); END IF;
IF albert_id IS NULL THEN albert_id := COALESCE(zizi_id, german_id, manager_id); END IF;

RAISE NOTICE 'Usuarios encontrados: Zizi=% German=% Albert=%', 
  CASE WHEN zizi_id IS NOT NULL THEN 'Sí' ELSE 'No' END,
  CASE WHEN german_id IS NOT NULL THEN 'Sí' ELSE 'No' END,
  CASE WHEN albert_id IS NOT NULL THEN 'Sí' ELSE 'No' END;

-- =============================================
-- 2. CREAR TAREAS REALES
-- =============================================

-- TAREA 1: Inspección de seguridad semanal
INSERT INTO tasks (id, title, description, status, priority, due_date, estimated_duration, project_name, location, assigned_to, created_at, updated_at) VALUES
(task1_id, 'Inspección de seguridad semanal', 'Realizar inspección completa de equipos de seguridad, verificar extintores, luces de emergencia y señalización de evacuación.', 'not_started', 'high', (CURRENT_DATE + INTERVAL '1 day')::timestamptz, 120, 'Seguridad Facilities', 'Planta Principal', zizi_id, NOW(), NOW());

-- Subtareas para Tarea 1
subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, "order", created_at) VALUES
(subtask_id, task1_id, 'Verificar extintores', 'Comprobar presión y fechas de vencimiento de todos los extintores', false, 1, NOW());

-- Evidencia PHOTO_VIDEO obligatoria
requirement_id := gen_random_uuid();
INSERT INTO subtask_evidence_requirements (id, subtask_id, type, is_required, title, description, config) VALUES
(requirement_id, subtask_id, 'photo_video', true, 'Foto de extintores', 'Tomar foto del estado y etiquetas de cada extintor', '{"minPhotos": 3}');

subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, "order", created_at) VALUES
(subtask_id, task1_id, 'Probar luces de emergencia', 'Verificar funcionamiento de todas las luces de emergencia', false, 2, NOW());

-- TAREA 2: Mantenimiento preventivo equipos
INSERT INTO tasks (id, title, description, status, priority, due_date, estimated_duration, project_name, location, assigned_to, created_at, updated_at) VALUES
(task2_id, 'Mantenimiento preventivo de equipos', 'Realizar mantenimiento programado de maquinaria principal, incluyendo lubricación y limpieza.', 'in_progress', 'medium', (CURRENT_DATE + INTERVAL '2 days')::timestamptz, 180, 'Mantenimiento Industrial', 'Taller Mecánico', german_id, NOW(), NOW());

-- Subtareas para Tarea 2
subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, "order", created_at) VALUES
(subtask_id, task2_id, 'Lubricar máquina CNC', 'Aplicar lubricante en puntos específicos según manual', true, 1, NOW());

subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, "order", created_at) VALUES
(subtask_id, task2_id, 'Limpiar filtros de aire', 'Remover y limpiar filtros del sistema de ventilación', false, 2, NOW());

-- TAREA 3: Calibración de instrumentos
INSERT INTO tasks (id, title, description, status, priority, due_date, estimated_duration, project_name, location, assigned_to, created_at, updated_at) VALUES
(task3_id, 'Calibración de instrumentos de medición', 'Calibrar básculas, termómetros y medidores de presión según protocolo ISO.', 'not_started', 'medium', (CURRENT_DATE + INTERVAL '3 days')::timestamptz, 90, 'Control de Calidad', 'Laboratorio', albert_id, NOW(), NOW());

-- Subtareas para Tarea 3
subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, "order", created_at) VALUES
(subtask_id, task3_id, 'Calibrar básculas', 'Usar pesas patrón certificadas para calibración', false, 1, NOW());

-- Evidencia SIGNATURE obligatoria
requirement_id := gen_random_uuid();
INSERT INTO subtask_evidence_requirements (id, subtask_id, type, is_required, title, description, config) VALUES
(requirement_id, subtask_id, 'signature', true, 'Firma de calibración', 'Firmar certificado de calibración', '{"requireName": true}');

-- TAREA 4: Inventario mensual
INSERT INTO tasks (id, title, description, status, priority, due_date, estimated_duration, project_name, location, assigned_to, created_at, updated_at) VALUES
(task4_id, 'Inventario mensual de almacén', 'Contar y verificar stock de materiales, herramientas y repuestos.', 'not_started', 'low', (CURRENT_DATE + INTERVAL '5 days')::timestamptz, 240, 'Gestión de Inventario', 'Almacén Central', zizi_id, NOW(), NOW());

-- Subtareas para Tarea 4
subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, "order", created_at) VALUES
(subtask_id, task4_id, 'Contar herramientas de mano', 'Inventariar todas las herramientas manuales', false, 1, NOW());

subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, "order", created_at) VALUES
(subtask_id, task4_id, 'Verificar stock de repuestos', 'Comparar stock físico con sistema', false, 2, NOW());

-- TAREA 5: Capacitación de seguridad
INSERT INTO tasks (id, title, description, status, priority, due_date, estimated_duration, project_name, location, assigned_to, created_at, updated_at) VALUES
(task5_id, 'Capacitación de seguridad industrial', 'Impartir sesión de entrenamiento sobre uso de EPP y procedimientos de emergencia.', 'not_started', 'high', (CURRENT_DATE + INTERVAL '7 days')::timestamptz, 150, 'Recursos Humanos', 'Sala de Capacitación', german_id, NOW(), NOW());

-- Subtareas para Tarea 5
subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, "order", created_at) VALUES
(subtask_id, task5_id, 'Preparar material de capacitación', 'Revisar y actualizar presentaciones y videos', false, 1, NOW());

-- TAREA 6: Auditoría ambiental
INSERT INTO tasks (id, title, description, status, priority, due_date, estimated_duration, project_name, location, assigned_to, created_at, updated_at) VALUES
(task6_id, 'Auditoría ambiental trimestral', 'Evaluar cumplimiento de normativas ambientales y gestión de residuos.', 'not_started', 'medium', (CURRENT_DATE + INTERVAL '10 days')::timestamptz, 300, 'Gestión Ambiental', 'Todas las instalaciones', albert_id, NOW(), NOW());

-- Subtareas para Tarea 6
subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, "order", created_at) VALUES
(subtask_id, task6_id, 'Revisar gestión de residuos', 'Verificar separación y almacenamiento de residuos', false, 1, NOW());

-- Evidencia LOCATION obligatoria
requirement_id := gen_random_uuid();
INSERT INTO subtask_evidence_requirements (id, subtask_id, type, is_required, title, description, config) VALUES
(requirement_id, subtask_id, 'location', true, 'Ubicación de contenedores', 'Registrar GPS de contenedores de residuos', '{"accuracy": 10}');

-- =============================================
-- 3. ASIGNAR TAGS A LAS TAREAS
-- =============================================

-- Asignar tags relevantes a cada tarea
INSERT INTO task_tags (task_id, tag_id) VALUES
(task1_id, 'tag-safety'),
(task1_id, 'tag-inspection'),
(task2_id, 'tag-maintenance'),
(task2_id, 'tag-equipment'),
(task3_id, 'tag-quality'),
(task3_id, 'tag-compliance'),
(task4_id, 'tag-documentation'),
(task5_id, 'tag-safety'),
(task5_id, 'tag-training'),
(task6_id, 'tag-environmental'),
(task6_id, 'tag-compliance');

-- =============================================
-- 4. CREAR COMENTARIOS DE EJEMPLO
-- =============================================

-- Comentarios para diferentes tareas
INSERT INTO task_comments (task_id, user_id, type, content, created_at) VALUES
(task1_id, zizi_id, 'text', 'Iniciando inspección de seguridad. Comenzaré por el área de producción.', NOW() - INTERVAL '2 hours'),
(task2_id, german_id, 'text', 'Mantenimiento de la máquina CNC completado. Todo funcionando correctamente.', NOW() - INTERVAL '1 hour'),
(task3_id, albert_id, 'text', 'Necesito coordinar con el laboratorio para usar las pesas patrón certificadas.', NOW() - INTERVAL '30 minutes');

-- =============================================
-- 5. CREAR ALGUNAS NOTIFICACIONES
-- =============================================

INSERT INTO work_notifications (user_id, title, message, type, is_read, action_required) VALUES
(zizi_id, 'Nueva tarea asignada', 'Se te ha asignado la tarea: Inspección de seguridad semanal', 'info', false, true),
(german_id, 'Recordatorio de mantenimiento', 'La tarea de mantenimiento preventivo está en progreso', 'reminder', false, false),
(albert_id, 'Calibración pendiente', 'Recuerda programar la calibración de instrumentos', 'warning', false, true);

-- =============================================
-- 6. MENSAJE DE CONFIRMACIÓN
-- =============================================

RAISE NOTICE '';
RAISE NOTICE '✅ ¡DATOS REALES CREADOS EXITOSAMENTE!';
RAISE NOTICE '';
RAISE NOTICE '📋 RESUMEN DE DATOS CREADOS:';
RAISE NOTICE '• 6 tareas reales con fechas futuras';
RAISE NOTICE '• Subtareas con diferentes tipos de evidencias';
RAISE NOTICE '• Tags del sistema asignados';
RAISE NOTICE '• Comentarios de ejemplo';
RAISE NOTICE '• Notificaciones para usuarios';
RAISE NOTICE '';
RAISE NOTICE '🚀 ¡TU APP YA ESTÁ LISTA CON DATOS REALES!';
RAISE NOTICE '';
RAISE NOTICE '📱 PUEDES PROBAR:';
RAISE NOTICE '• Hacer login con: zizi@taskmanager.com / test123';
RAISE NOTICE '• Ver tareas en la pantalla Home';
RAISE NOTICE '• Abrir detalles de tareas';
RAISE NOTICE '• Agregar comentarios';
RAISE NOTICE '• Usar el cronómetro';
RAISE NOTICE '';

END $$; 