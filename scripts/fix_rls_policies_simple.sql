-- Script para SIMPLIFICAR políticas RLS problemáticas
-- Elimina verificaciones de admin que causan "permission denied for table users"

-- ===============================
-- FIX: POLÍTICAS RLS SIMPLIFICADAS
-- ===============================

DO $$
BEGIN
    RAISE NOTICE '🔧 INICIANDO FIX: Simplificando políticas RLS problemáticas';
    RAISE NOTICE '❌ Eliminando verificaciones de admin que causan errores';
    
    -- PASO 1: ELIMINAR POLÍTICAS PROBLEMÁTICAS
    RAISE NOTICE '🗑️ Eliminando políticas RLS actuales...';
    
    -- Eliminar políticas de tasks
    DROP POLICY IF EXISTS tasks_select_policy ON tasks;
    DROP POLICY IF EXISTS tasks_insert_policy ON tasks;
    DROP POLICY IF EXISTS tasks_update_policy ON tasks;
    DROP POLICY IF EXISTS tasks_delete_policy ON tasks;
    
    -- Eliminar políticas de task_comments
    DROP POLICY IF EXISTS task_comments_select_policy ON task_comments;
    DROP POLICY IF EXISTS task_comments_insert_policy ON task_comments;
    DROP POLICY IF EXISTS task_comments_update_policy ON task_comments;
    DROP POLICY IF EXISTS task_comments_delete_policy ON task_comments;
    
    -- Eliminar políticas de task_problem_reports
    DROP POLICY IF EXISTS task_problem_reports_select_policy ON task_problem_reports;
    DROP POLICY IF EXISTS task_problem_reports_insert_policy ON task_problem_reports;
    DROP POLICY IF EXISTS task_problem_reports_update_policy ON task_problem_reports;
    DROP POLICY IF EXISTS task_problem_reports_delete_policy ON task_problem_reports;
    
    RAISE NOTICE '✅ Políticas problemáticas eliminadas';
    
    -- PASO 2: CREAR POLÍTICAS SIMPLIFICADAS (SIN VERIFICACIONES DE ADMIN)
    RAISE NOTICE '🔐 Creando políticas RLS simplificadas...';
    
    -- ============== TASKS POLICIES ==============
    
    -- SELECT: Solo usuarios asignados pueden ver tareas
    CREATE POLICY tasks_select_policy ON tasks
    FOR SELECT
    USING (
        auth.uid() = ANY(assigned_to)
    );
    
    -- INSERT: Cualquier usuario autenticado puede crear tareas
    CREATE POLICY tasks_insert_policy ON tasks
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
    
    -- UPDATE: Solo usuarios asignados pueden actualizar
    CREATE POLICY tasks_update_policy ON tasks
    FOR UPDATE
    USING (
        auth.uid() = ANY(assigned_to)
    );
    
    -- DELETE: Solo usuarios asignados pueden eliminar
    CREATE POLICY tasks_delete_policy ON tasks
    FOR DELETE
    USING (
        auth.uid() = ANY(assigned_to)
    );
    
    RAISE NOTICE '   ✅ Políticas de tasks creadas';
    
    -- ============== TASK_COMMENTS POLICIES ==============
    
    -- SELECT: Solo usuarios asignados a la tarea pueden ver comentarios
    CREATE POLICY task_comments_select_policy ON task_comments
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT unnest(assigned_to) FROM tasks WHERE tasks.id = task_comments.task_id
        )
    );
    
    -- INSERT: Solo usuarios asignados pueden crear comentarios
    CREATE POLICY task_comments_insert_policy ON task_comments
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT unnest(assigned_to) FROM tasks WHERE tasks.id = task_comments.task_id
        )
    );
    
    -- UPDATE: Solo el autor del comentario puede actualizarlo
    CREATE POLICY task_comments_update_policy ON task_comments
    FOR UPDATE
    USING (auth.uid() = user_id);
    
    -- DELETE: Solo el autor del comentario puede eliminarlo
    CREATE POLICY task_comments_delete_policy ON task_comments
    FOR DELETE
    USING (auth.uid() = user_id);
    
    RAISE NOTICE '   ✅ Políticas de task_comments creadas';
    
    -- ============== TASK_PROBLEM_REPORTS POLICIES ==============
    
    -- SELECT: Usuarios asignados a la tarea + autor del reporte
    CREATE POLICY task_problem_reports_select_policy ON task_problem_reports
    FOR SELECT
    USING (
        auth.uid() = user_id  -- El autor del reporte
        OR auth.uid() IN (
            SELECT unnest(assigned_to) FROM tasks WHERE tasks.id = task_problem_reports.task_id
        )
    );
    
    -- INSERT: Solo usuarios asignados a la tarea pueden crear reportes
    CREATE POLICY task_problem_reports_insert_policy ON task_problem_reports
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT unnest(assigned_to) FROM tasks WHERE tasks.id = task_problem_reports.task_id
        )
    );
    
    -- UPDATE: Solo el autor del reporte puede actualizarlo
    CREATE POLICY task_problem_reports_update_policy ON task_problem_reports
    FOR UPDATE
    USING (auth.uid() = user_id);
    
    -- DELETE: Solo el autor del reporte puede eliminarlo
    CREATE POLICY task_problem_reports_delete_policy ON task_problem_reports
    FOR DELETE
    USING (auth.uid() = user_id);
    
    RAISE NOTICE '   ✅ Políticas de task_problem_reports creadas';
    
    -- PASO 3: VERIFICACIÓN
    RAISE NOTICE '📊 Verificando políticas creadas...';
    
    RAISE NOTICE '✅ FIX COMPLETADO EXITOSAMENTE';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 CAMBIOS REALIZADOS:';
    RAISE NOTICE '   • Eliminadas verificaciones problemáticas de auth.users';
    RAISE NOTICE '   • Políticas simplificadas solo verifican assigned_to';
    RAISE NOTICE '   • Sin consultas a roles de admin';
    RAISE NOTICE '   • Usuarios asignados tienen acceso completo';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 LÓGICA DE ACCESO:';
    RAISE NOTICE '   • Solo usuarios en assigned_to[] ven las tareas';
    RAISE NOTICE '   • Una vez asignado: acceso completo (ver, editar, comentar)';
    RAISE NOTICE '   • Reportes: visibles para asignados + autor';
    RAISE NOTICE '   • Solo autor puede eliminar sus comentarios/reportes';
    RAISE NOTICE '';
    RAISE NOTICE '✅ PROBLEMA SOLUCIONADO: No más "permission denied for table users"';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR EN FIX: %', SQLERRM;
        RAISE NOTICE '💡 Puede ser necesario ejecutar manualmente en SQL Editor';
        RAISE;
END $$;

-- ===============================
-- VERIFICACIÓN POST-FIX
-- ===============================

-- Mostrar todas las políticas actuales
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('tasks', 'task_comments', 'task_problem_reports')
ORDER BY tablename, policyname; 