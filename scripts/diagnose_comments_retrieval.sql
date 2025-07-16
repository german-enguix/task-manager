-- ============================================
-- DIAGNÓSTICO: Por qué no se recuperan los comentarios
-- ============================================

-- Paso 1: Verificar que la tabla existe y tiene datos
SELECT 'TABLA TASK_COMMENTS' as check_type, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_comments') 
            THEN '✅ Existe' 
            ELSE '❌ No existe' 
       END as status;

-- Paso 2: Contar comentarios totales
SELECT 'COMENTARIOS TOTALES' as check_type, 
       COUNT(*)::text || ' comentarios' as status 
FROM public.task_comments;

-- Paso 3: Mostrar todos los comentarios que existen
SELECT 'COMENTARIOS EXISTENTES' as info, 
       id, task_id, user_id, type, content, created_at
FROM public.task_comments 
ORDER BY created_at DESC
LIMIT 10;

-- Paso 4: Verificar el usuario actual
SELECT 'USUARIO ACTUAL' as check_type,
       COALESCE(auth.uid()::text, 'NULL - no autenticado') as status;

-- Paso 5: Verificar políticas RLS en task_comments
SELECT 'POLÍTICAS RLS' as check_type,
       COUNT(*)::text || ' políticas activas' as status
FROM pg_policies 
WHERE tablename = 'task_comments';

-- Mostrar las políticas específicas
SELECT policyname, cmd, permissive, qual
FROM pg_policies 
WHERE tablename = 'task_comments';

-- Paso 6: Probar si el usuario actual puede ver comentarios
SELECT 'TEST ACCESO LECTURA' as check_type,
       CASE WHEN EXISTS (SELECT 1 FROM public.task_comments LIMIT 1)
            THEN '✅ Puede leer comentarios'
            ELSE '❌ No puede leer o no hay datos'
       END as status;

-- Paso 7: Verificar si hay comentarios para tareas específicas
SELECT task_id, COUNT(*) as comment_count
FROM public.task_comments 
GROUP BY task_id
ORDER BY comment_count DESC;

-- Paso 8: Test completo de una consulta similar a la app
SELECT 
  'TEST CONSULTA APP' as info,
  id, 
  task_id, 
  user_id, 
  content,
  created_at,
  CASE WHEN LENGTH(content) > 50 
       THEN LEFT(content, 50) || '...' 
       ELSE content 
  END as content_preview
FROM public.task_comments 
ORDER BY created_at DESC
LIMIT 5;

-- Paso 9: Verificar permisos de la tabla
SELECT 'PERMISOS TABLA' as check_type,
       grantee, privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'task_comments'
AND grantee IN ('authenticated', 'anon', 'public'); 