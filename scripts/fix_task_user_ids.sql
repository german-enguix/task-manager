-- Script para actualizar las tareas de Zizi al ID hardcodeado de la app
-- Solución rápida sin necesidad de cambiar código

-- ===============================
-- 1. CREAR USUARIO CON ID HARDCODEADO (si no existe)
-- ===============================

-- Primero verificar si el ID hardcodeado existe en profiles
DO $$
DECLARE
    hardcoded_id UUID := '550e8400-e29b-41d4-a716-446655440001';
    zizi_real_id UUID;
BEGIN
    -- Obtener el ID real de Zizi
    SELECT p.id INTO zizi_real_id 
    FROM profiles p 
    JOIN auth.users u ON p.id = u.id 
    WHERE u.email = 'zizi@taskmanager.com' 
    LIMIT 1;
    
    IF zizi_real_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el usuario zizi@taskmanager.com';
    END IF;
    
    -- Verificar si el ID hardcodeado ya existe en profiles
    IF EXISTS (SELECT 1 FROM profiles WHERE id = hardcoded_id) THEN
        RAISE NOTICE 'El ID hardcodeado ya existe en profiles, actualizando datos...';
        
        -- Actualizar el perfil existente con los datos de Zizi
        UPDATE profiles SET 
            full_name = (SELECT full_name FROM profiles WHERE id = zizi_real_id),
            role = (SELECT role FROM profiles WHERE id = zizi_real_id)
        WHERE id = hardcoded_id;
        
    ELSE
        RAISE NOTICE 'Creando nuevo perfil con ID hardcodeado...';
        
        -- Crear nuevo perfil con el ID hardcodeado y los datos de Zizi
        INSERT INTO profiles (id, full_name, role, created_at, updated_at)
        SELECT 
            hardcoded_id,
            p.full_name,
            p.role,
            NOW(),
            NOW()
        FROM profiles p 
        WHERE p.id = zizi_real_id;
    END IF;
    
    RAISE NOTICE 'ID hardcodeado configurado: % con datos de Zizi (ID real: %)', hardcoded_id, zizi_real_id;
END $$;

-- ===============================
-- 2. ACTUALIZAR TAREAS AL ID HARDCODEADO
-- ===============================

-- Actualizar todas las tareas asignadas a Zizi para que usen el ID hardcodeado
UPDATE tasks 
SET assigned_to = '550e8400-e29b-41d4-a716-446655440001'
WHERE assigned_to IN (
    SELECT p.id 
    FROM profiles p 
    JOIN auth.users u ON p.id = u.id 
    WHERE u.email = 'zizi@taskmanager.com'
);

-- ===============================
-- 3. ACTUALIZAR ASIGNACIONES MÚLTIPLES
-- ===============================

-- Actualizar la tabla task_assignments para Zizi
UPDATE task_assignments
SET user_id = '550e8400-e29b-41d4-a716-446655440001'
WHERE user_id IN (
    SELECT p.id 
    FROM profiles p 
    JOIN auth.users u ON p.id = u.id 
    WHERE u.email = 'zizi@taskmanager.com'
);

-- ===============================
-- 4. VERIFICAR RESULTADO
-- ===============================

-- Verificar que las tareas ahora están asignadas al ID hardcodeado
SELECT 
    'VERIFICACIÓN FINAL:' as info,
    COUNT(*) as total_tasks_updated,
    MIN(DATE(due_date)) as primera_fecha,
    MAX(DATE(due_date)) as ultima_fecha
FROM tasks 
WHERE assigned_to = '550e8400-e29b-41d4-a716-446655440001'
    AND DATE(due_date) IN ('2025-07-14', '2025-07-15', '2025-07-16');

-- Mostrar las tareas actualizadas
SELECT 
    'TAREAS AHORA VISIBLES EN LA APP:' as info,
    title,
    DATE(due_date) as fecha,
    project_name,
    location,
    status
FROM tasks 
WHERE assigned_to = '550e8400-e29b-41d4-a716-446655440001'
    AND DATE(due_date) IN ('2025-07-14', '2025-07-15', '2025-07-16')
ORDER BY due_date, title;

-- ===============================
-- 5. CAMBIAR FECHAS A 2024 (OPCIONAL)
-- ===============================

-- Si quieres ver las tareas ahora mismo, cambiar las fechas de 2025 a 2024
-- Descomenta las siguientes líneas:

/*
UPDATE tasks 
SET due_date = due_date - INTERVAL '1 year'
WHERE assigned_to = '550e8400-e29b-41d4-a716-446655440001'
    AND DATE(due_date) IN ('2025-07-14', '2025-07-15', '2025-07-16');

SELECT 'FECHAS ACTUALIZADAS A 2024' as info;
*/

SELECT '✅ SCRIPT COMPLETADO - Las tareas deberían aparecer en la app' as resultado; 