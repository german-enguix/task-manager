-- =============================================
-- SCRIPT PARA AÑADIR TAREA CON QR SCANNER
-- =============================================
-- Este script crea una tarea para HOY con:
-- 1. Subtarea con evidencia QR REQUERIDA
-- 2. Subtarea con evidencia QR OPCIONAL  
-- 3. Tarea asignada a usuario activo
-- =============================================

DO $$
DECLARE
    -- Variables para IDs
    assigned_user_id UUID;
    task_id UUID := gen_random_uuid();
    
    -- IDs de subtareas
    subtask1_id UUID := gen_random_uuid();
    subtask2_id UUID := gen_random_uuid();
    subtask3_id UUID := gen_random_uuid();
    
    -- IDs de evidencias
    requirement1_id UUID := gen_random_uuid();
    requirement2_id UUID := gen_random_uuid();
    
BEGIN

-- =============================================
-- 1. OBTENER USUARIO ASIGNADO
-- =============================================

-- Buscar primer usuario disponible (priorizar zizi o german)
SELECT p.id INTO assigned_user_id 
FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email IN ('zizi@taskmanager.com', 'german@taskmanager.com', 'albert@taskmanager.com')
ORDER BY 
  CASE 
    WHEN u.email = 'zizi@taskmanager.com' THEN 1
    WHEN u.email = 'german@taskmanager.com' THEN 2
    ELSE 3
  END
LIMIT 1;

-- Si no hay usuarios específicos, usar cualquier usuario activo
IF assigned_user_id IS NULL THEN
    SELECT id INTO assigned_user_id 
    FROM profiles 
    WHERE role IN ('user', 'admin')
    LIMIT 1;
END IF;

-- Verificar que tenemos un usuario
IF assigned_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ningún usuario para asignar la tarea';
END IF;

RAISE NOTICE '👤 Usuario asignado: %', assigned_user_id;

-- =============================================
-- 2. CREAR TAREA PRINCIPAL
-- =============================================

INSERT INTO tasks (
    id, 
    title, 
    description, 
    status, 
    priority, 
    due_date, 
    estimated_duration, 
    project_name, 
    location, 
    assigned_to, 
    created_at, 
    updated_at
) VALUES (
    task_id,
    '🎯 Verificación de equipos con códigos QR',
    'Realizar verificación completa de equipos escaneando sus códigos QR identificadores. Esta tarea incluye verificación obligatoria de maquinaria crítica y opcional de herramientas secundarias.',
    'not_started',
    'high',
    CURRENT_DATE::timestamptz + INTERVAL '1 day', -- Vence mañana
    120, -- 2 horas estimadas
    'Control de Activos',
    'Planta Industrial - Sección A',
    assigned_user_id,
    NOW(),
    NOW()
);

RAISE NOTICE '✅ Tarea creada: %', task_id;

-- =============================================
-- 3. CREAR SUBTAREAS CON EVIDENCIAS QR
-- =============================================

-- SUBTAREA 1: QR REQUERIDO
INSERT INTO subtasks (
    id, 
    task_id, 
    title, 
    description, 
    is_completed, 
    order_index, 
    created_at
) VALUES (
    subtask1_id,
    task_id,
    '🔴 Verificar máquina CNC (OBLIGATORIO)',
    'Escanear código QR de la máquina CNC principal para verificar su estado y registros de mantenimiento. ESTA VERIFICACIÓN ES OBLIGATORIA.',
    false,
    1,
    NOW()
);

-- Evidencia QR REQUERIDA
INSERT INTO subtask_evidence_requirements (
    id, 
    subtask_id, 
    type, 
    is_required, 
    title, 
    description, 
    config
) VALUES (
    requirement1_id,
    subtask1_id,
    'qr', -- NUEVO TIPO QR 🎯
    true, -- REQUERIDO ✅
    'Escáner QR Máquina CNC',
    'Escanear el código QR ubicado en la placa identificativa de la máquina CNC. Este escaneo es OBLIGATORIO para completar la verificación.',
    '{"scanTimeout": 30, "requiredFormat": "QR_CODE", "validateContent": true}'
);

RAISE NOTICE '🔴 Subtarea QR REQUERIDA creada: %', subtask1_id;

-- SUBTAREA 2: QR OPCIONAL
INSERT INTO subtasks (
    id, 
    task_id, 
    title, 
    description, 
    is_completed, 
    order_index, 
    created_at
) VALUES (
    subtask2_id,
    task_id,
    '🟡 Verificar herramientas auxiliares (OPCIONAL)',
    'Escanear códigos QR de herramientas auxiliares para actualizar inventario. Esta verificación es opcional pero recomendada.',
    false,
    2,
    NOW()
);

-- Evidencia QR OPCIONAL
INSERT INTO subtask_evidence_requirements (
    id, 
    subtask_id, 
    type, 
    is_required, 
    title, 
    description, 
    config
) VALUES (
    requirement2_id,
    subtask2_id,
    'qr', -- NUEVO TIPO QR 🎯
    false, -- OPCIONAL ⚪
    'Escáner QR Herramientas',
    'Escanear códigos QR de herramientas auxiliares. Este escaneo es opcional y puede omitirse si las herramientas no están disponibles.',
    '{"scanTimeout": 15, "requiredFormat": "QR_CODE", "allowMultiple": true}'
);

RAISE NOTICE '🟡 Subtarea QR OPCIONAL creada: %', subtask2_id;

-- SUBTAREA 3: COMPLETAR REPORTE (sin evidencia)
INSERT INTO subtasks (
    id, 
    task_id, 
    title, 
    description, 
    is_completed, 
    order_index, 
    created_at
) VALUES (
    subtask3_id,
    task_id,
    '📋 Completar reporte de verificación',
    'Revisar todos los datos escaneados y completar el reporte final de verificación de equipos.',
    false,
    3,
    NOW()
);

RAISE NOTICE '📋 Subtarea de reporte creada: %', subtask3_id;

-- =============================================
-- 4. CONFIRMACIÓN FINAL
-- =============================================

RAISE NOTICE '';
RAISE NOTICE '🎉 ¡TAREA CON QR SCANNER CREADA EXITOSAMENTE!';
RAISE NOTICE '';
RAISE NOTICE '📋 RESUMEN:';
RAISE NOTICE '   📅 Fecha: %', CURRENT_DATE;
RAISE NOTICE '   🆔 Tarea ID: %', task_id;
RAISE NOTICE '   👤 Asignado a: %', assigned_user_id;
RAISE NOTICE '   📍 Ubicación: Planta Industrial - Sección A';
RAISE NOTICE '';
RAISE NOTICE '🎯 SUBTAREAS CREADAS:';
RAISE NOTICE '   1. 🔴 QR REQUERIDO - Máquina CNC (OBLIGATORIO)';
RAISE NOTICE '   2. 🟡 QR OPCIONAL - Herramientas auxiliares';  
RAISE NOTICE '   3. 📋 Completar reporte final';
RAISE NOTICE '';
RAISE NOTICE '✅ PUEDES PROBAR AHORA:';
RAISE NOTICE '   • Abre la app y ve a la tarea de hoy';
RAISE NOTICE '   • Intenta completar las subtareas QR';
RAISE NOTICE '   • Observa la diferencia entre REQUERIDO vs OPCIONAL';
RAISE NOTICE '';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creando tarea QR: %', SQLERRM;
        
END $$; 