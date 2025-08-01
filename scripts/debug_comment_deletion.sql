-- ============================================
-- DIAGNÓSTICO: Borrado de comentarios
-- ============================================
-- Ejecutar este script en Supabase SQL editor

-- 1. Verificar el usuario actual
SELECT 'USUARIO ACTUAL' as check_type, 
       COALESCE(auth.uid()::text, 'NULL - no autenticado') as status;

-- 2. Verificar políticas RLS en task_comments
SELECT 'POLÍTICAS TASK_COMMENTS' as info,
       policyname, cmd, permissive, qual, with_check
FROM pg_policies 
WHERE tablename = 'task_comments'
ORDER BY cmd;

-- 3. Contar comentarios totales vs visibles para el usuario
SELECT 'COMENTARIOS TOTALES' as info, COUNT(*) as count
FROM public.task_comments;

SELECT 'COMENTARIOS VISIBLES' as info, COUNT(*) as count  
FROM task_comments;

-- 4. Verificar comentarios del usuario actual
SELECT 'MIS COMENTARIOS' as info,
       id, task_id, user_id, content, created_at
FROM task_comments 
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- 5. Test de borrado manual (reemplazar UUID_DEL_COMENTARIO)
-- DELETE FROM task_comments WHERE id = 'UUID_DEL_COMENTARIO' AND user_id = auth.uid();

-- 6. Verificar si RLS está habilitado
SELECT 'RLS STATUS' as info,
       CASE WHEN relrowsecurity THEN 'RLS HABILITADO' ELSE 'RLS DESHABILITADO' END as status
FROM pg_class 
WHERE relname = 'task_comments'; 