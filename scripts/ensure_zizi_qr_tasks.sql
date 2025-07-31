-- =============================================
-- SCRIPT PARA ASEGURAR TAREAS DE ZIZI PARA QR
-- =============================================
-- Este script verifica y crea tareas para el usuario Zizi
-- Para usar con el sistema de simulación de QR externo

DO $$
DECLARE
    zizi_user_id UUID;
    test_task_id UUID;
    existing_count INTEGER;
BEGIN

-- 1. Encontrar usuario Zizi
SELECT u.id INTO zizi_user_id
FROM auth.users u
WHERE u.email LIKE '%zizi%' OR u.id = '550e8400-e29b-41d4-a716-446655440001'
LIMIT 1;

RAISE NOTICE '👤 Usuario Zizi encontrado: %', zizi_user_id;

IF zizi_user_id IS NULL THEN
    RAISE NOTICE '❌ Usuario Zizi no encontrado. No se pueden crear tareas para QR.';
    RETURN;
END IF;

-- 2. Verificar si ya existen tareas para Zizi
SELECT COUNT(*) INTO existing_count
FROM tasks t
WHERE zizi_user_id = ANY(t.assigned_to)
  AND t.status != 'completed';

RAISE NOTICE '📊 Tareas activas existentes para Zizi: %', existing_count;

-- 3. Si no hay suficientes tareas, crear una nueva
IF existing_count < 2 THEN
    RAISE NOTICE '🔧 Creando tarea adicional para QR externo...';
    
    -- Crear una tarea que puede ser vinculada a un QR
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
        'Inspección de Equipos QR',
        'Revisar equipos utilizando códigos QR para acceso rápido a información técnica y procedimientos de mantenimiento.',
        'not_started',
        'medium',
        NOW() + INTERVAL '3 days',
        90,
        'Mantenimiento Base',
        'Área Técnica - Sector B',
        ARRAY[zizi_user_id]::UUID[],
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ Tarea QR creada: %', test_task_id;
    RAISE NOTICE '✅ Título: "Inspección de Equipos QR"';
ELSE
    RAISE NOTICE '✅ Ya existen suficientes tareas para Zizi';
END IF;

-- 4. Mostrar resumen final
SELECT COUNT(*) INTO existing_count
FROM tasks t
WHERE zizi_user_id = ANY(t.assigned_to);

RAISE NOTICE '📈 RESUMEN FINAL:';
RAISE NOTICE '• Usuario Zizi: %', zizi_user_id;
RAISE NOTICE '• Total tareas asignadas: %', existing_count;
RAISE NOTICE '🎯 LISTO PARA PROBAR SIMULACIÓN QR EXTERNA';

END $$;

-- =============================================
-- CONSULTA DE VERIFICACIÓN
-- =============================================
-- Ejecutar después del script para verificar los datos

SELECT 
    '📱 TAREAS DISPONIBLES PARA QR EXTERNO:' as info,
    t.id,
    t.title as tarea,
    t.description as descripcion,
    t.status as estado,
    t.priority as prioridad,
    t.location as ubicacion,
    t.project_name as proyecto
FROM tasks t
JOIN auth.users u ON u.id = ANY(t.assigned_to)
WHERE (u.email LIKE '%zizi%' OR u.id = '550e8400-e29b-41d4-a716-446655440001')
ORDER BY t.created_at DESC
LIMIT 5; 