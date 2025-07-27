-- Script para migrar assigned_to de UUID único a UUID array
-- Esto permite asignar una tarea a múltiples usuarios

-- ===============================
-- MIGRACIÓN ASSIGNED_TO → ARRAY
-- ===============================

DO $$
DECLARE
    task_record RECORD;
    backup_count INTEGER;
BEGIN
    RAISE NOTICE '🔄 INICIANDO MIGRACIÓN: assigned_to UUID → UUID[]';
    
    -- PASO 1: Verificar estado actual
    SELECT COUNT(*) INTO backup_count FROM tasks WHERE assigned_to IS NOT NULL;
    RAISE NOTICE '📊 Tareas con assigned_to actual: %', backup_count;
    
    -- PASO 2: Crear columna temporal para backup
    RAISE NOTICE '💾 Creando backup de datos actuales...';
    
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_backup UUID;
    
    -- Hacer backup de los datos actuales
    UPDATE tasks 
    SET assigned_to_backup = assigned_to 
    WHERE assigned_to IS NOT NULL;
    
    RAISE NOTICE '✅ Backup completado';
    
    -- PASO 3: Eliminar columna actual y recrear como array
    RAISE NOTICE '🔄 Recreando columna como array...';
    
    ALTER TABLE tasks DROP COLUMN IF EXISTS assigned_to;
    ALTER TABLE tasks ADD COLUMN assigned_to UUID[];
    
    -- PASO 4: Migrar datos del backup al nuevo formato array
    RAISE NOTICE '📦 Migrando datos a formato array...';
    
    UPDATE tasks 
    SET assigned_to = ARRAY[assigned_to_backup]
    WHERE assigned_to_backup IS NOT NULL;
    
    -- PASO 5: Verificar migración
    SELECT COUNT(*) INTO backup_count FROM tasks WHERE assigned_to IS NOT NULL AND array_length(assigned_to, 1) > 0;
    RAISE NOTICE '✅ Tareas migradas con assigned_to array: %', backup_count;
    
    -- PASO 6: Limpiar columna temporal (opcional - puedes mantenerla por seguridad)
    -- ALTER TABLE tasks DROP COLUMN assigned_to_backup;
    RAISE NOTICE '💡 Columna assigned_to_backup mantenida para seguridad';
    
    -- PASO 7: Crear índices para el nuevo array
    RAISE NOTICE '📊 Creando índices para arrays...';
    
    -- Índice GIN para búsquedas eficientes en arrays
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_gin 
    ON tasks USING gin(assigned_to);
    
    -- Índice para verificar si un usuario específico está asignado
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_contains 
    ON tasks USING gin(assigned_to gin__int_ops);
    
    RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 CAMBIOS REALIZADOS:';
    RAISE NOTICE '   • assigned_to ahora es UUID[] (array)';
    RAISE NOTICE '   • Datos existentes migrados automáticamente';
    RAISE NOTICE '   • Índices GIN creados para performance';
    RAISE NOTICE '   • Backup en assigned_to_backup (puedes eliminarlo después)';
    RAISE NOTICE '';
    RAISE NOTICE '💻 ACTUALIZAR CÓDIGO:';
    RAISE NOTICE '   • TypeScript: assigned_to: string[] | null';
    RAISE NOTICE '   • Consultas: WHERE user_id = ANY(assigned_to)';
    RAISE NOTICE '   • Filtros: array_contains(assigned_to, user_id)';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR EN MIGRACIÓN: %', SQLERRM;
        RAISE NOTICE '🔄 Puedes revertir usando assigned_to_backup si es necesario';
        RAISE;
END $$;

-- ===============================
-- EJEMPLOS DE USO POST-MIGRACIÓN
-- ===============================

-- Buscar tareas asignadas a un usuario específico
-- SELECT * FROM tasks WHERE 'user-uuid-here' = ANY(assigned_to);

-- Buscar tareas asignadas a múltiples usuarios específicos
-- SELECT * FROM tasks WHERE assigned_to && ARRAY['user1-uuid', 'user2-uuid'];

-- Agregar usuario a tarea existente
-- UPDATE tasks SET assigned_to = array_append(assigned_to, 'new-user-uuid') WHERE id = 'task-uuid';

-- Remover usuario de tarea
-- UPDATE tasks SET assigned_to = array_remove(assigned_to, 'user-uuid-to-remove') WHERE id = 'task-uuid';

-- Reemplazar completamente la asignación
-- UPDATE tasks SET assigned_to = ARRAY['user1-uuid', 'user2-uuid'] WHERE id = 'task-uuid'; 