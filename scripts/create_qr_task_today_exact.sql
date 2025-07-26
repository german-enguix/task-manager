-- =============================================
-- TAREA QR PARA ZIZI - FECHA EXACTA DE HOY
-- =============================================
-- Crea tarea que aparece en "tareas de hoy"
-- con fecha de vencimiento de HOY
-- =============================================

DO $$
DECLARE
    zizi_user_id UUID;
    user_email TEXT;
    task_id UUID := gen_random_uuid();
    subtask1_id UUID := gen_random_uuid();
    subtask2_id UUID := gen_random_uuid();
    subtask3_id UUID := gen_random_uuid();
    requirement1_id UUID := gen_random_uuid();
    requirement2_id UUID := gen_random_uuid();
    today_date DATE := CURRENT_DATE;
BEGIN

-- =============================================
-- 1. AÑADIR TIPO QR AL ENUM (SI NO EXISTE)
-- =============================================

IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid 
    WHERE t.typname = 'evidence_type' AND e.enumlabel = 'qr'
) THEN
    ALTER TYPE evidence_type ADD VALUE 'qr';
    RAISE NOTICE '✅ Tipo qr añadido al enum';
ELSE
    RAISE NOTICE '⚠️ Tipo qr ya existe en enum';
END IF;

-- =============================================
-- 2. BUSCAR USUARIO ZIZI
-- =============================================

RAISE NOTICE '🔍 Buscando usuario ZIZI...';

-- Buscar específicamente a ZIZI
SELECT p.id INTO zizi_user_id FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'zizi@taskmanager.com' LIMIT 1;

-- Si no existe, buscar email similar
IF zizi_user_id IS NULL THEN
    SELECT p.id INTO zizi_user_id FROM profiles p 
    JOIN auth.users u ON p.id = u.id 
    WHERE LOWER(u.email) LIKE '%zizi%' LIMIT 1;
    
    IF zizi_user_id IS NOT NULL THEN
        RAISE NOTICE '⚠️ ZIZI exacto no encontrado, usando email similar';
    END IF;
END IF;

-- Último fallback
IF zizi_user_id IS NULL THEN
    SELECT id INTO zizi_user_id FROM profiles 
    WHERE role IN ('user', 'admin') LIMIT 1;
    
    IF zizi_user_id IS NOT NULL THEN
        RAISE NOTICE '⚠️ Usando primer usuario disponible';
    END IF;
END IF;

-- Verificar que tenemos usuario
IF zizi_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ningún usuario en la base de datos';
END IF;

-- Debug info
SELECT u.email INTO user_email FROM auth.users u WHERE u.id = zizi_user_id;
RAISE NOTICE '✅ Usuario encontrado: % (%)', COALESCE(user_email, 'sin email'), zizi_user_id;

-- =============================================
-- 3. CREAR TAREA PARA HOY
-- =============================================

RAISE NOTICE '📅 Creando tarea para HOY: %', today_date;

INSERT INTO tasks (
    id, title, description, status, priority, 
    due_date, estimated_duration, project_name, location, 
    assigned_to, created_at, updated_at
) VALUES (
    task_id,
    '🎯 Verificación QR - Equipos HOY',
    'Verificación urgente de equipos con códigos QR para el día de hoy. Incluye verificación obligatoria de maquinaria crítica y opcional de herramientas.',
    'not_started',
    'high',
    today_date::timestamptz, -- ¡VENCE HOY!
    90,
    'Control QR Urgente',
    'Planta Industrial - Sección Principal',
    zizi_user_id,
    NOW(),
    NOW()
);

RAISE NOTICE '✅ Tarea creada para HOY: %', task_id;

-- =============================================
-- 4. SUBTAREA 1: QR OBLIGATORIO 🔴
-- =============================================

INSERT INTO subtasks (
    id, task_id, title, description, 
    is_completed, order_index, created_at
) VALUES (
    subtask1_id, task_id,
    '🔴 QR OBLIGATORIO - Máquina Principal',
    'Escanear QR de máquina CNC principal. OBLIGATORIO para completar tarea.',
    false, 1, NOW()
);

INSERT INTO subtask_evidence_requirements (
    id, subtask_id, type, is_required, 
    title, description, config
) VALUES (
    requirement1_id, subtask1_id, 
    'qr', true, -- ¡REQUERIDO!
    'Scanner QR Máquina CNC',
    'Código QR en placa frontal de máquina CNC. OBLIGATORIO escanear.',
    '{"scanTimeout": 30, "requiredFormat": "QR_CODE", "mandatory": true}'
);

RAISE NOTICE '🔴 Subtarea QR OBLIGATORIA creada';

-- =============================================
-- 5. SUBTAREA 2: QR OPCIONAL 🟡
-- =============================================

INSERT INTO subtasks (
    id, task_id, title, description, 
    is_completed, order_index, created_at
) VALUES (
    subtask2_id, task_id,
    '🟡 QR OPCIONAL - Herramientas',
    'Escanear QR de herramientas auxiliares. Opcional - puede omitirse.',
    false, 2, NOW()
);

INSERT INTO subtask_evidence_requirements (
    id, subtask_id, type, is_required, 
    title, description, config
) VALUES (
    requirement2_id, subtask2_id, 
    'qr', false, -- ¡OPCIONAL!
    'Scanner QR Herramientas',
    'Códigos QR de herramientas auxiliares. Escaneo opcional.',
    '{"scanTimeout": 15, "requiredFormat": "QR_CODE", "optional": true}'
);

RAISE NOTICE '🟡 Subtarea QR OPCIONAL creada';

-- =============================================
-- 6. SUBTAREA 3: REPORTE FINAL 📋
-- =============================================

INSERT INTO subtasks (
    id, task_id, title, description, 
    is_completed, order_index, created_at
) VALUES (
    subtask3_id, task_id,
    '📋 Finalizar reporte del día',
    'Completar reporte final de verificaciones realizadas hoy.',
    false, 3, NOW()
);

RAISE NOTICE '📋 Subtarea de reporte creada';

-- =============================================
-- 7. CONFIRMACIÓN FINAL
-- =============================================

RAISE NOTICE '';
RAISE NOTICE '🎉 ¡TAREA QR CREADA PARA HOY!';
RAISE NOTICE '';
RAISE NOTICE '📋 DETALLES:';
RAISE NOTICE '   📅 Fecha vencimiento: % (HOY)', today_date;
RAISE NOTICE '   👤 Asignado a: %', COALESCE(user_email, 'Usuario encontrado');
RAISE NOTICE '   🎯 Título: "Verificación QR - Equipos HOY"';
RAISE NOTICE '   📍 Ubicación: Planta Industrial - Sección Principal';
RAISE NOTICE '';
RAISE NOTICE '🎮 BUSCAR EN APP:';
RAISE NOTICE '   📱 Abre la app como ZIZI';
RAISE NOTICE '   📅 Ve a "Tareas de Hoy"';
RAISE NOTICE '   🔍 Busca: "Verificación QR - Equipos HOY"';
RAISE NOTICE '';
RAISE NOTICE '🎯 SUBTAREAS A PROBAR:';
RAISE NOTICE '   🔴 QR OBLIGATORIO (con candado 🔒)';
RAISE NOTICE '   🟡 QR OPCIONAL (sin candado 🔓)';
RAISE NOTICE '   📋 Reporte final (normal)';
RAISE NOTICE '';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error: %', SQLERRM;
        
END $$; 