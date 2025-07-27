-- Script MEJORADO para migrar assigned_to de UUID único a UUID array
-- Maneja dependencias de RLS policies correctamente

-- ===============================
-- MIGRACIÓN ASSIGNED_TO → ARRAY (MEJORADA)
-- ===============================

DO $$
DECLARE
    task_record RECORD;
    backup_count INTEGER;
    policy_record RECORD;
BEGIN
    RAISE NOTICE '🔄 INICIANDO MIGRACIÓN MEJORADA: assigned_to UUID → UUID[]';
    RAISE NOTICE '🔧 Manejando dependencias de RLS policies...';
    
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
    
    -- PASO 3: ELIMINAR POLÍTICAS DEPENDIENTES
    RAISE NOTICE '🗑️ Eliminando políticas RLS dependientes...';
    
    -- Eliminar políticas de task_comments que dependen de assigned_to
    DROP POLICY IF EXISTS task_comments_all_own_tasks ON task_comments;
    RAISE NOTICE '   ✅ Eliminada: task_comments_all_own_tasks';
    
    DROP POLICY IF EXISTS task_comments_policy ON task_comments;
    RAISE NOTICE '   ✅ Eliminada: task_comments_policy';
    
    -- Eliminar políticas de task_problem_reports que dependen de assigned_to
    DROP POLICY IF EXISTS task_problem_reports_select_own_tasks ON task_problem_reports;
    RAISE NOTICE '   ✅ Eliminada: task_problem_reports_select_own_tasks';
    
    DROP POLICY IF EXISTS task_problem_reports_insert_own_tasks ON task_problem_reports;
    RAISE NOTICE '   ✅ Eliminada: task_problem_reports_insert_own_tasks';
    
    -- Eliminar cualquier otra política que pueda depender de assigned_to
    DROP POLICY IF EXISTS tasks_select_policy ON tasks;
    DROP POLICY IF EXISTS tasks_insert_policy ON tasks;
    DROP POLICY IF EXISTS tasks_update_policy ON tasks;
    DROP POLICY IF EXISTS tasks_delete_policy ON tasks;
    
    RAISE NOTICE '🔓 Políticas dependientes eliminadas';
    
    -- PASO 4: Eliminar columna actual y recrear como array
    RAISE NOTICE '🔄 Recreando columna como array...';
    
    ALTER TABLE tasks DROP COLUMN assigned_to;
    ALTER TABLE tasks ADD COLUMN assigned_to UUID[];
    
    -- PASO 5: Migrar datos del backup al nuevo formato array
    RAISE NOTICE '📦 Migrando datos a formato array...';
    
    UPDATE tasks 
    SET assigned_to = ARRAY[assigned_to_backup]
    WHERE assigned_to_backup IS NOT NULL;
    
    -- PASO 6: Verificar migración
    SELECT COUNT(*) INTO backup_count FROM tasks WHERE assigned_to IS NOT NULL AND array_length(assigned_to, 1) > 0;
    RAISE NOTICE '✅ Tareas migradas con assigned_to array: %', backup_count;
    
    -- PASO 7: Crear índices para el nuevo array
    RAISE NOTICE '📊 Creando índices para arrays...';
    
    -- Índice GIN para búsquedas eficientes en arrays
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_gin 
    ON tasks USING gin(assigned_to);
    
    RAISE NOTICE '✅ Índices creados';
    
    -- PASO 8: RECREAR POLÍTICAS RLS CON SOPORTE PARA ARRAYS
    RAISE NOTICE '🔐 Recreando políticas RLS con soporte para arrays...';
    
    -- Política básica para tasks: usuarios pueden ver tareas asignadas a ellos
    CREATE POLICY tasks_select_policy ON tasks
    FOR SELECT
    USING (
        auth.uid() = ANY(assigned_to) 
        OR auth.uid() IN (
            SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
        )
    );
    
    -- Política para insertar tasks (solo admins)
    CREATE POLICY tasks_insert_policy ON tasks
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
        )
    );
    
    -- Política para actualizar tasks (usuarios asignados + admins)
    CREATE POLICY tasks_update_policy ON tasks
    FOR UPDATE
    USING (
        auth.uid() = ANY(assigned_to)
        OR auth.uid() IN (
            SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
        )
    );
    
    -- Política para task_comments: usuarios pueden ver comentarios de sus tareas
    CREATE POLICY task_comments_select_policy ON task_comments
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT unnest(assigned_to) FROM tasks WHERE tasks.id = task_comments.task_id
        )
        OR auth.uid() IN (
            SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
        )
    );
    
    -- Política para insertar comentarios: usuarios asignados a la tarea
    CREATE POLICY task_comments_insert_policy ON task_comments
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT unnest(assigned_to) FROM tasks WHERE tasks.id = task_comments.task_id
        )
        OR auth.uid() IN (
            SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
        )
    );
    
    -- Política para task_problem_reports: usuarios pueden ver reportes de sus tareas
    CREATE POLICY task_problem_reports_select_policy ON task_problem_reports
    FOR SELECT
    USING (
        auth.uid() = user_id  -- El autor del reporte
        OR auth.uid() IN (
            SELECT unnest(assigned_to) FROM tasks WHERE tasks.id = task_problem_reports.task_id
        )
        OR auth.uid() IN (
            SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
        )
    );
    
    -- Política para insertar reportes: usuarios asignados a la tarea
    CREATE POLICY task_problem_reports_insert_policy ON task_problem_reports
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT unnest(assigned_to) FROM tasks WHERE tasks.id = task_problem_reports.task_id
        )
        OR auth.uid() IN (
            SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin'
        )
    );
    
    -- Política para actualizar reportes: solo el autor
    CREATE POLICY task_problem_reports_update_policy ON task_problem_reports
    FOR UPDATE
    USING (auth.uid() = user_id);
    
    -- Política para eliminar reportes: solo el autor
    CREATE POLICY task_problem_reports_delete_policy ON task_problem_reports
    FOR DELETE
    USING (auth.uid() = user_id);
    
    RAISE NOTICE '🔐 Políticas RLS recreadas con soporte para arrays';
    
    -- PASO 9: Limpiar columna temporal (opcional - mantener por seguridad)
    RAISE NOTICE '💡 Columna assigned_to_backup mantenida para seguridad';
    
    RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 CAMBIOS REALIZADOS:';
    RAISE NOTICE '   • assigned_to ahora es UUID[] (array)';
    RAISE NOTICE '   • Datos existentes migrados automáticamente';
    RAISE NOTICE '   • Índices GIN creados para performance';
    RAISE NOTICE '   • Políticas RLS actualizadas para arrays';
    RAISE NOTICE '   • Backup en assigned_to_backup (eliminar después)';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 POLÍTICAS RLS ACTUALIZADAS:';
    RAISE NOTICE '   • Usuarios ven tareas donde están en assigned_to array';
    RAISE NOTICE '   • Comentarios visibles para usuarios asignados';
    RAISE NOTICE '   • Reportes visibles para asignados + autor';
    RAISE NOTICE '   • Soporte completo para múltiples usuarios';
    RAISE NOTICE '';
    RAISE NOTICE '💻 ACTUALIZAR CÓDIGO:';
    RAISE NOTICE '   • TypeScript: assigned_to: string[] | null';
    RAISE NOTICE '   • Consultas: WHERE user_id = ANY(assigned_to)';
    RAISE NOTICE '   • Filtros: array_contains(assigned_to, user_id)';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR EN MIGRACIÓN: %', SQLERRM;
        RAISE NOTICE '🔄 Las políticas eliminadas necesitan ser recreadas manualmente';
        RAISE NOTICE '💾 Datos preservados en assigned_to_backup';
        RAISE;
END $$;

-- ===============================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ===============================

-- Verificar que las políticas existen
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename IN ('tasks', 'task_comments', 'task_problem_reports')
ORDER BY tablename, policyname;

-- Verificar datos migrados
SELECT 
    'Tareas con assigned_to array' as descripcion,
    COUNT(*) as cantidad
FROM tasks 
WHERE assigned_to IS NOT NULL;

-- Verificar backup
SELECT 
    'Tareas en backup' as descripcion,
    COUNT(*) as cantidad
FROM tasks 
WHERE assigned_to_backup IS NOT NULL; 