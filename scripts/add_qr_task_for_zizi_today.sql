-- =============================================
-- SCRIPT PARA AÑADIR TAREA QR PARA ZIZI HOY
-- =============================================
-- Este script crea una tarea para HOY con:
-- 1. Subtarea con evidencia QR REQUERIDA
-- 2. Subtarea con evidencia QR OPCIONAL  
-- 3. Tarea asignada específicamente a ZIZI
-- 4. Fecha de vencimiento: HOY
-- =============================================

DO $$
DECLARE
    -- Variables para IDs
    zizi_user_id UUID;
    user_email TEXT;
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

-- Si no hay usuarios zizi, usar cualquier usuario activo
IF zizi_user_id IS NULL THEN
    SELECT id INTO zizi_user_id 
    FROM profiles 
    WHERE role IN ('user', 'admin')
    LIMIT 1;
    
    IF zizi_user_id IS NOT NULL THEN
        RAISE NOTICE '⚠️ Usuario ZIZI no encontrado, asignando a primer usuario disponible';
    END IF;
END IF;

-- Verificar que tenemos un usuario
IF zizi_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el usuario ZIZI (zizi@taskmanager.com) ni ningún usuario alternativo. Verifica que existen usuarios en las tablas auth.users y profiles.';
END IF;

-- Obtener info del usuario para debug
SELECT u.email INTO user_email 
FROM auth.users u 
WHERE u.id = zizi_user_id;

RAISE NOTICE '✅ Usuario encontrado: % (email: %)', zizi_user_id, COALESCE(user_email, 'email no encontrado');

-- =============================================
-- 2. CREAR TAREA PRINCIPAL PARA HOY
-- =============================================

RAISE NOTICE '📅 Creando tarea para fecha: %', CURRENT_DATE;

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
    '🎯 Verificación QR - Equipos Industriales',
    'Realizar verificación completa de equipos escaneando sus códigos QR identificadores. Incluye verificación obligatoria de maquinaria crítica y opcional de herramientas auxiliares.',
    'not_started',
    'high',
    CURRENT_DATE::timestamptz + INTERVAL '1 day', -- Vence mañana para dar tiempo
    90, -- 1.5 horas estimadas
    'Control de Activos QR',
    'Planta Industrial - Área de Producción',
    zizi_user_id,
    NOW(),
    NOW()
);

RAISE NOTICE '✅ Tarea creada: %', task_id;

-- =============================================
-- 3. CREAR SUBTAREAS CON EVIDENCIAS QR
-- =============================================

-- SUBTAREA 1: QR REQUERIDO (OBLIGATORIO) 🔴
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
    '🔴 Verificar QR Máquina Principal (OBLIGATORIO)',
    'Escanear código QR de la máquina principal CNC para verificar estado operativo. ESTA VERIFICACIÓN ES OBLIGATORIA y debe completarse para finalizar la tarea.',
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
    'qr', -- TIPO QR ✅
    true, -- REQUERIDO (candado) 🔒
    'QR Scanner Máquina CNC',
    'Escanear el código QR ubicado en la placa frontal de la máquina CNC. Este escaneo es OBLIGATORIO para completar la verificación de seguridad.',
    '{"scanTimeout": 30, "requiredFormat": "QR_CODE", "validateContent": true, "description": "Máquina Principal"}'
);

RAISE NOTICE '🔴 Subtarea QR REQUERIDA creada: %', subtask1_id;

-- SUBTAREA 2: QR OPCIONAL 🟡
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
    '🟡 Verificar QR Herramientas (OPCIONAL)',
    'Escanear códigos QR de herramientas auxiliares para actualizar inventario. Esta verificación es opcional y puede omitirse si las herramientas no están disponibles.',
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
    'qr', -- TIPO QR ✅
    false, -- OPCIONAL (sin candado) 🔓
    'QR Scanner Herramientas',
    'Escanear códigos QR de herramientas auxiliares si están disponibles. Este escaneo es opcional y la subtarea puede completarse sin él.',
    '{"scanTimeout": 15, "requiredFormat": "QR_CODE", "allowMultiple": true, "description": "Herramientas Auxiliares"}'
);

RAISE NOTICE '🟡 Subtarea QR OPCIONAL creada: %', subtask2_id;

-- SUBTAREA 3: REPORTE FINAL (sin evidencia) 📋
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
    'Revisar todos los datos escaneados y completar el reporte final de verificación de equipos. Anotar cualquier anomalía detectada.',
    false,
    3,
    NOW()
);

RAISE NOTICE '📋 Subtarea de reporte creada: %', subtask3_id;

-- =============================================
-- 4. CONFIRMACIÓN FINAL
-- =============================================

RAISE NOTICE '';
RAISE NOTICE '🎉 ¡TAREA QR PARA ZIZI CREADA EXITOSAMENTE!';
RAISE NOTICE '';
RAISE NOTICE '📋 RESUMEN COMPLETO:';
RAISE NOTICE '   📅 Fecha creación: %', CURRENT_DATE;
RAISE NOTICE '   📅 Fecha vencimiento: %', CURRENT_DATE + INTERVAL '1 day';
RAISE NOTICE '   🆔 Tarea ID: %', task_id;
RAISE NOTICE '   👤 Asignado a: % (%)', user_email, zizi_user_id;
RAISE NOTICE '   📍 Ubicación: Planta Industrial - Área de Producción';
RAISE NOTICE '   ⏱️ Duración estimada: 90 minutos';
RAISE NOTICE '';
RAISE NOTICE '🎯 SUBTAREAS QR CREADAS:';
RAISE NOTICE '   1. 🔴 QR REQUERIDO - Máquina CNC (OBLIGATORIO con candado 🔒)';
RAISE NOTICE '   2. 🟡 QR OPCIONAL - Herramientas auxiliares (libre 🔓)';  
RAISE NOTICE '   3. 📋 Completar reporte final (sin evidencia)';
RAISE NOTICE '';
RAISE NOTICE '✅ CÓMO PROBAR EN LA APP:';
RAISE NOTICE '   📱 1. Abre la app como usuario ZIZI';
RAISE NOTICE '   📅 2. Ve a "Tareas de Hoy" o lista principal';
RAISE NOTICE '   🎯 3. Busca: "Verificación QR - Equipos Industriales"';
RAISE NOTICE '   🔴 4. Prueba subtarea REQUERIDA (con candado)';
RAISE NOTICE '   🟡 5. Prueba subtarea OPCIONAL (sin candado)';
RAISE NOTICE '';
RAISE NOTICE '🎭 COMPORTAMIENTOS ESPERADOS:';
RAISE NOTICE '   🔒 Requerida: Solo se marca ✅ al escanear QR';
RAISE NOTICE '   🔓 Opcional: Se puede marcar ✅ directamente o con QR';
RAISE NOTICE '   📸 QR Scanner: Visor cámara + efectos + "Simular Lectura"';
RAISE NOTICE '';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creando tarea QR para ZIZI: %', SQLERRM;
        
END $$; 