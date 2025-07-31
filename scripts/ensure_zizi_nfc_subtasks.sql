-- =============================================
-- SCRIPT PARA ASEGURAR SUBTAREAS NFC DE ZIZI
-- =============================================
-- Este script verifica y crea subtareas con evidencia NFC para el usuario Zizi
-- Para usar con el sistema de simulación de NFC externo

DO $$
DECLARE
    zizi_user_id UUID;
    test_task_id UUID;
    subtask_id UUID;
    requirement_id UUID;
    existing_count INTEGER;
BEGIN

-- 1. Encontrar usuario Zizi
SELECT u.id INTO zizi_user_id
FROM auth.users u
WHERE u.email LIKE '%zizi%' OR u.id = '550e8400-e29b-41d4-a716-446655440001'
LIMIT 1;

RAISE NOTICE '👤 Usuario Zizi encontrado: %', zizi_user_id;

IF zizi_user_id IS NULL THEN
    RAISE NOTICE '❌ Usuario Zizi no encontrado. No se pueden crear subtareas NFC.';
    RETURN;
END IF;

-- 2. Verificar si ya existen subtareas NFC para Zizi
SELECT COUNT(*) INTO existing_count
FROM tasks t
JOIN subtasks s ON s.task_id = t.id
JOIN subtask_evidence_requirements ser ON ser.subtask_id = s.id
WHERE zizi_user_id = ANY(t.assigned_to)
  AND ser.type = 'nfc'
  AND NOT s.is_completed;

RAISE NOTICE '📊 Subtareas NFC existentes para Zizi: %', existing_count;

-- 3. Si no hay suficientes subtareas NFC, crear una nueva
IF existing_count < 1 THEN
    RAISE NOTICE '🔧 Creando tarea y subtarea NFC para Zizi...';
    
    -- Crear una tarea de prueba para NFC
    test_task_id := gen_random_uuid();
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
        test_task_id,
        'Control de Inventario con NFC',
        'Verificar y registrar equipos del inventario utilizando tecnología NFC para un control preciso de activos.',
        'in_progress',
        'medium',
        NOW() + INTERVAL '2 days',
        60,
        'Mantenimiento Base',
        'Almacén Central',
        ARRAY[zizi_user_id]::UUID[],
        NOW(),
        NOW()
    );
    
    -- Crear subtarea con evidencia NFC
    subtask_id := gen_random_uuid();
    INSERT INTO subtasks (
        id, 
        task_id, 
        title, 
        description, 
        is_completed, 
        "order", 
        created_at
    ) VALUES (
        subtask_id,
        test_task_id,
        'Escanear etiquetas NFC de equipos',
        'Utilizar el lector NFC para escanear las etiquetas de cada equipo y registrar su ubicación actual.',
        false,
        1,
        NOW()
    );
    
    -- Crear requisito de evidencia NFC
    requirement_id := gen_random_uuid();
    INSERT INTO subtask_evidence_requirements (
        id, 
        subtask_id, 
        type, 
        is_required, 
        title, 
        description, 
        config
    ) VALUES (
        requirement_id,
        subtask_id,
        'nfc',
        true,
        'Lectura de etiqueta NFC',
        'Acercar el dispositivo móvil a la etiqueta NFC del equipo para registrar su ID único',
        '{"allowAnyTag": true, "expectedLocation": "warehouse"}'
    );
    
    RAISE NOTICE '✅ Tarea creada: % con subtarea NFC: %', test_task_id, subtask_id;
    RAISE NOTICE '✅ Requisito NFC creado: %', requirement_id;
ELSE
    RAISE NOTICE '✅ Ya existen suficientes subtareas NFC para Zizi';
END IF;

-- 4. Mostrar resumen final
SELECT COUNT(*) INTO existing_count
FROM tasks t
JOIN subtasks s ON s.task_id = t.id
JOIN subtask_evidence_requirements ser ON ser.subtask_id = s.id
WHERE zizi_user_id = ANY(t.assigned_to)
  AND ser.type = 'nfc';

RAISE NOTICE '📈 RESUMEN FINAL:';
RAISE NOTICE '• Usuario Zizi: %', zizi_user_id;
RAISE NOTICE '• Total subtareas NFC: %', existing_count;
RAISE NOTICE '🎯 LISTO PARA PROBAR SIMULACIÓN NFC EXTERNA';

END $$;

-- =============================================
-- CONSULTA DE VERIFICACIÓN
-- =============================================
-- Ejecutar después del script para verificar los datos

SELECT 
    '🎯 SUBTAREAS NFC DISPONIBLES PARA ZIZI:' as info,
    t.title as tarea,
    s.title as subtarea,
    s.description as descripcion,
    ser.title as evidencia_requerida,
    ser.is_required as obligatoria,
    s.is_completed as completada
FROM tasks t
JOIN subtasks s ON s.task_id = t.id
JOIN subtask_evidence_requirements ser ON ser.subtask_id = s.id
JOIN auth.users u ON u.id = ANY(t.assigned_to)
WHERE (u.email LIKE '%zizi%' OR u.id = '550e8400-e29b-41d4-a716-446655440001')
  AND ser.type = 'nfc'
ORDER BY t.created_at DESC, s."order"; 