-- Script CORREGIDO FINAL para crear tareas de Zizi con sistema de evidencias
-- Adaptado a la estructura REAL de la base de datos con order_index
-- Ejecutar en el panel SQL de Supabase

-- ===============================
-- 1. EXTENDER ESQUEMA PARA EVIDENCIAS
-- ===============================

-- Crear enum para tipos de evidencia
DO $$ BEGIN
    CREATE TYPE evidence_type AS ENUM ('photo_video', 'audio', 'signature', 'location', 'nfc');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'El tipo evidence_type ya existe, continuando...';
END $$;

-- Crear tabla para requisitos de evidencia de subtareas
CREATE TABLE IF NOT EXISTS subtask_evidence_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtask_id UUID NOT NULL REFERENCES subtasks(id) ON DELETE CASCADE,
  type evidence_type NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla para evidencias completadas
CREATE TABLE IF NOT EXISTS subtask_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtask_id UUID NOT NULL REFERENCES subtasks(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES subtask_evidence_requirements(id) ON DELETE CASCADE,
  type evidence_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  data JSONB,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================
-- 2. CREAR TAREAS CON USUARIOS REALES
-- ===============================

DO $$
DECLARE
    -- Variables para IDs de usuarios existentes
    zizi_id UUID;
    german_id UUID;
    albert_id UUID;
    
    -- IDs de tareas para referencias
    task1_id UUID := gen_random_uuid();
    task2_id UUID := gen_random_uuid();
    task3_id UUID := gen_random_uuid();
    task4_id UUID := gen_random_uuid();
    task5_id UUID := gen_random_uuid();
    task6_id UUID := gen_random_uuid();
    task7_id UUID := gen_random_uuid();
    task8_id UUID := gen_random_uuid();
    
    -- IDs de subtareas para referencias
    subtask_id UUID;
    requirement_id UUID;
BEGIN

-- Obtener IDs de usuarios usando JOIN entre auth.users y profiles
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

-- Verificar que los usuarios existen
IF zizi_id IS NULL THEN
    RAISE EXCEPTION 'Usuario zizi@taskmanager.com no encontrado';
END IF;

IF german_id IS NULL THEN
    RAISE EXCEPTION 'Usuario german@taskmanager.com no encontrado';
END IF;

IF albert_id IS NULL THEN
    RAISE EXCEPTION 'Usuario albert@taskmanager.com no encontrado';
END IF;

RAISE NOTICE 'Usuarios encontrados - Zizi: %, German: %, Albert: %', zizi_id, german_id, albert_id;

-- =======================================
-- DÍA 14 DE JULIO - 3 TAREAS
-- =======================================

-- TAREA 1: Limpieza profunda oficinas (Zizi + German)
INSERT INTO tasks (id, title, description, status, priority, due_date, estimated_duration, project_name, location, assigned_to, created_at, updated_at) VALUES
(task1_id, 'Limpieza profunda de oficinas principales', 'Realizar limpieza completa de todas las oficinas del primer piso, incluyendo desinfección de superficies, aspirado de alfombras y limpieza de ventanas.', 'not_started', 'high', '2025-07-14T09:00:00.000Z', 240, 'Limpieza Base', 'Base 1', zizi_id, NOW(), NOW());

-- Subtareas para Tarea 1
subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, order_index, created_at) VALUES
(subtask_id, task1_id, 'Inventario de productos de limpieza', 'Verificar disponibilidad de todos los productos necesarios', false, 1, NOW());

requirement_id := gen_random_uuid();
INSERT INTO subtask_evidence_requirements (id, subtask_id, type, is_required, title, description, config) VALUES
(requirement_id, subtask_id, 'photo_video', true, 'Foto del inventario', 'Fotografiar todos los productos de limpieza disponibles', '{"allowPhoto": true, "allowVideo": false, "maxFileSize": 10}');

subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, order_index, created_at) VALUES
(subtask_id, task1_id, 'Limpieza de escritorios y superficie', 'Limpiar y desinfectar todos los escritorios', false, 2, NOW());

requirement_id := gen_random_uuid();
INSERT INTO subtask_evidence_requirements (id, subtask_id, type, is_required, title, description, config) VALUES
(requirement_id, subtask_id, 'location', false, 'Ubicación de limpieza', 'Registrar ubicación GPS de cada oficina limpiada', '{"requiredAccuracy": 10}');

subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, order_index, created_at) VALUES
(subtask_id, task1_id, 'Aspirado y fregado de suelos', 'Aspirar alfombras y fregar suelos de todas las oficinas', false, 3, NOW());

-- TAREA 2: Preparación sala de reuniones (Solo Zizi)
INSERT INTO tasks (id, title, description, status, priority, due_date, estimated_duration, project_name, location, assigned_to, created_at, updated_at) VALUES
(task2_id, 'Preparación sala de reuniones para evento', 'Configurar la sala principal para reunión de 30 personas, incluyendo disposición de mesas, sillas, equipo audiovisual y catering.', 'not_started', 'medium', '2025-07-14T14:00:00.000Z', 120, 'Facility Sesame', 'La Marina de València', zizi_id, NOW(), NOW());

subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, order_index, created_at) VALUES
(subtask_id, task2_id, 'Configurar disposición de mesas', 'Organizar mesas en forma de U para 30 personas', false, 1, NOW());

requirement_id := gen_random_uuid();
INSERT INTO subtask_evidence_requirements (id, subtask_id, type, is_required, title, description, config) VALUES
(requirement_id, subtask_id, 'audio', true, 'Confirmación verbal de setup', 'Grabar nota de voz confirmando la disposición final', '{"maxDuration": 60}');

subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, order_index, created_at) VALUES
(subtask_id, task2_id, 'Probar equipo audiovisual', 'Verificar funcionamiento de proyector, micrófono y sistema de sonido', false, 2, NOW());

requirement_id := gen_random_uuid();
INSERT INTO subtask_evidence_requirements (id, subtask_id, type, is_required, title, description, config) VALUES
(requirement_id, subtask_id, 'signature', false, 'Verificación de equipos', 'Firmar checklist de equipos probados', '{"requiredFields": ["timestamp", "equipment_list"]}');

-- TAREA 3: Recogida de paquetería (Zizi + Albert)
INSERT INTO tasks (id, title, description, status, priority, due_date, estimated_duration, project_name, location, assigned_to, created_at, updated_at) VALUES
(task3_id, 'Recogida y distribución de paquetería', 'Recoger paquetes de proveedores y distribuir correspondencia interna entre departamentos.', 'not_started', 'low', '2025-07-14T16:30:00.000Z', 90, 'Mantenimiento Base', 'Base 1', zizi_id, NOW(), NOW());

subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, order_index, created_at) VALUES
(subtask_id, task3_id, 'Verificar destinatarios', 'Confirmar que todos los paquetes tienen destinatario válido', false, 1, NOW());

requirement_id := gen_random_uuid();
INSERT INTO subtask_evidence_requirements (id, subtask_id, type, is_required, title, description, config) VALUES
(requirement_id, subtask_id, 'nfc', true, 'Escaneo de etiquetas NFC', 'Escanear etiquetas NFC de cada paquete para registro', '{"allowAnyTag": true}');

-- =======================================
-- DÍA 15 DE JULIO - 3 TAREAS  
-- =======================================

-- TAREA 4: Mantenimiento preventivo equipos (Zizi + Albert)
INSERT INTO tasks (id, title, description, status, priority, due_date, estimated_duration, project_name, location, assigned_to, created_at, updated_at) VALUES
(task4_id, 'Mantenimiento preventivo de equipos de oficina', 'Realizar revisión y mantenimiento de impresoras, fotocopiadoras y equipos informáticos.', 'not_started', 'high', '2025-07-15T10:00:00.000Z', 180, 'Mantenimiento Base', 'Base 1', zizi_id, NOW(), NOW());

subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, order_index, created_at) VALUES
(subtask_id, task4_id, 'Documentar estado de equipos', 'Registrar estado actual y necesidades de cada equipo', false, 1, NOW());

requirement_id := gen_random_uuid();
INSERT INTO subtask_evidence_requirements (id, subtask_id, type, is_required, title, description, config) VALUES
(requirement_id, subtask_id, 'signature', true, 'Firma de conformidad técnica', 'Firmar reporte de mantenimiento realizado', '{"requiredFields": ["technician_name", "date", "equipment_id"]}');

-- TAREA 5: Organización almacén (Solo Zizi)
INSERT INTO tasks (id, title, description, status, priority, due_date, estimated_duration, project_name, location, assigned_to, created_at, updated_at) VALUES
(task5_id, 'Reorganización del almacén de suministros', 'Clasificar y organizar todo el material de oficina, etiquetado y actualización de inventario.', 'not_started', 'medium', '2025-07-15T14:30:00.000Z', 150, 'Limpieza Base', 'Base 1', zizi_id, NOW(), NOW());

subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, order_index, created_at) VALUES
(subtask_id, task5_id, 'Clasificar materiales por categorías', 'Separar y agrupar materiales similares', false, 1, NOW());

requirement_id := gen_random_uuid();
INSERT INTO subtask_evidence_requirements (id, subtask_id, type, is_required, title, description, config) VALUES
(requirement_id, subtask_id, 'photo_video', false, 'Foto del antes y después', 'Fotografiar el estado inicial y final del almacén', '{"allowPhoto": true, "allowVideo": true, "maxFileSize": 20}');

subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, order_index, created_at) VALUES
(subtask_id, task5_id, 'Actualizar sistema de inventario', 'Registrar todos los cambios en el sistema digital', false, 2, NOW());

requirement_id := gen_random_uuid();
INSERT INTO subtask_evidence_requirements (id, subtask_id, type, is_required, title, description, config) VALUES
(requirement_id, subtask_id, 'audio', false, 'Notas de inventario', 'Grabar observaciones sobre el estado del inventario', '{"maxDuration": 120}');

-- TAREA 6: Setup evento corporativo (Zizi + German)
INSERT INTO tasks (id, title, description, status, priority, due_date, estimated_duration, project_name, location, assigned_to, created_at, updated_at) VALUES
(task6_id, 'Preparación evento corporativo fin de mes', 'Coordinar todos los aspectos logísticos para el evento mensual de la empresa en las instalaciones.', 'not_started', 'high', '2025-07-15T16:00:00.000Z', 200, 'Facility Sesame', 'La Marina de València', zizi_id, NOW(), NOW());

subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, order_index, created_at) VALUES
(subtask_id, task6_id, 'Verificar reservas de catering', 'Confirmar menú y horarios con proveedor de catering', false, 1, NOW());

requirement_id := gen_random_uuid();
INSERT INTO subtask_evidence_requirements (id, subtask_id, type, is_required, title, description, config) VALUES
(requirement_id, subtask_id, 'location', true, 'Ubicación de entrega catering', 'Registrar ubicación exacta donde debe llegar el catering', '{"requiredAccuracy": 5}');

-- =======================================
-- DÍA 16 DE JULIO - 2 TAREAS
-- =======================================

-- TAREA 7: Inspección seguridad y limpieza (Zizi + German + Albert)
INSERT INTO tasks (id, title, description, status, priority, due_date, estimated_duration, project_name, location, assigned_to, created_at, updated_at) VALUES
(task7_id, 'Inspección final de seguridad y limpieza', 'Revisión completa de todas las áreas para asegurar estándares de seguridad y limpieza antes del evento.', 'not_started', 'high', '2025-07-16T09:00:00.000Z', 180, 'Limpieza Base', 'Base 1', zizi_id, NOW(), NOW());

subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, order_index, created_at) VALUES
(subtask_id, task7_id, 'Verificar salidas de emergencia', 'Comprobar que todas las salidas estén despejadas y señalizadas', false, 1, NOW());

requirement_id := gen_random_uuid();
INSERT INTO subtask_evidence_requirements (id, subtask_id, type, is_required, title, description, config) VALUES
(requirement_id, subtask_id, 'nfc', false, 'Verificación con tags NFC', 'Escanear tags NFC en cada salida de emergencia', '{"expectedTag": "emergency_exit"}');

subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, order_index, created_at) VALUES
(subtask_id, task7_id, 'Inspección final de limpieza', 'Verificar que todas las áreas cumplan estándares de limpieza', false, 2, NOW());

-- TAREA 8: Gestión de residuos y reciclaje (Solo Zizi)
INSERT INTO tasks (id, title, description, status, priority, due_date, estimated_duration, project_name, location, assigned_to, created_at, updated_at) VALUES
(task8_id, 'Gestión integral de residuos y reciclaje', 'Organizar recogida selectiva, vaciado de papeleras y coordinación con empresa de reciclaje.', 'not_started', 'medium', '2025-07-16T15:00:00.000Z', 120, 'Mantenimiento Base', 'Base 1', zizi_id, NOW(), NOW());

subtask_id := gen_random_uuid();
INSERT INTO subtasks (id, task_id, title, description, is_completed, order_index, created_at) VALUES
(subtask_id, task8_id, 'Coordinar recogida con empresa externa', 'Confirmar horarios y tipos de residuos con la empresa de reciclaje', false, 1, NOW());

-- ===============================
-- 3. CREAR ASIGNACIONES MÚLTIPLES
-- ===============================

-- Crear tabla para asignaciones múltiples (task_assignments)
CREATE TABLE IF NOT EXISTS task_assignments (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'assigned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);

-- Asignar tareas con múltiples usuarios
INSERT INTO task_assignments (task_id, user_id, role) VALUES
-- Tarea 1: Zizi + German
(task1_id, zizi_id, 'lead'),
(task1_id, german_id, 'support'),

-- Tarea 3: Zizi + Albert  
(task3_id, zizi_id, 'lead'),
(task3_id, albert_id, 'support'),

-- Tarea 4: Zizi + Albert
(task4_id, zizi_id, 'lead'), 
(task4_id, albert_id, 'support'),

-- Tarea 6: Zizi + German
(task6_id, zizi_id, 'lead'),
(task6_id, german_id, 'support'),

-- Tarea 7: Zizi + German + Albert
(task7_id, zizi_id, 'lead'),
(task7_id, german_id, 'support'),
(task7_id, albert_id, 'support');

RAISE NOTICE '✅ ¡Script completado exitosamente!';
RAISE NOTICE '📋 Se han creado 8 tareas para los días 14, 15 y 16 de julio';
RAISE NOTICE '👥 Usuarios reales utilizados: Zizi, German y Albert';
RAISE NOTICE '🏢 Proyectos: Limpieza Base, Mantenimiento Base, Facility Sesame';
RAISE NOTICE '📍 Ubicaciones: Base 1 y La Marina de València';
RAISE NOTICE '🔍 Sistema de evidencias implementado con todos los tipos';

END $$;

-- ===============================
-- 4. VERIFICAR CREACIÓN
-- ===============================

-- Consulta de verificación
SELECT 
  '✅ TAREAS CREADAS:' as info,
  t.title,
  DATE(t.due_date) as fecha,
  t.project_name,
  t.location,
  p.full_name as assigned_to,
  COUNT(DISTINCT s.id) as subtasks,
  COUNT(DISTINCT ser.id) as evidence_requirements
FROM tasks t
LEFT JOIN profiles p ON t.assigned_to = p.id
LEFT JOIN subtasks s ON t.id = s.task_id  
LEFT JOIN subtask_evidence_requirements ser ON s.id = ser.subtask_id
WHERE DATE(t.due_date) IN ('2025-07-14', '2025-07-15', '2025-07-16')
GROUP BY t.id, t.title, DATE(t.due_date), t.project_name, t.location, p.full_name
ORDER BY DATE(t.due_date), t.title; 