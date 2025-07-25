-- VERIFICAR CONFIGURACIÓN DE SUPABASE STORAGE
-- Ejecuta este script para confirmar que todo está bien configurado

-- 1. Verificar que el bucket existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'task-evidences') 
    THEN '✅ Bucket task-evidences existe'
    ELSE '❌ Bucket task-evidences NO EXISTE - Ejecuta setup_supabase_storage.sql'
  END as bucket_status;

-- 2. Verificar configuración del bucket
SELECT 
  id,
  name,
  CASE WHEN public THEN '✅ Público' ELSE '❌ Privado' END as public_status,
  CASE 
    WHEN file_size_limit >= 52428800 THEN '✅ Límite OK (≥50MB)'
    ELSE '⚠️ Límite bajo: ' || (file_size_limit/1024/1024) || 'MB'
  END as size_limit,
  CASE 
    WHEN 'audio/mp4' = ANY(allowed_mime_types) THEN '✅ MIME types OK'
    ELSE '⚠️ Verificar MIME types'
  END as mime_status
FROM storage.buckets 
WHERE id = 'task-evidences';

-- 3. Verificar políticas
SELECT 
  COUNT(*) as policies_count,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ Políticas configuradas'
    ELSE '⚠️ Faltan políticas - Ejecuta setup_supabase_storage.sql'
  END as policies_status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%audio%';

-- 4. Verificar RLS
SELECT 
  CASE 
    WHEN rowsecurity THEN '✅ RLS habilitado'
    ELSE '⚠️ RLS deshabilitado (OK para testing)'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 5. Resumen final
SELECT 
  '🎵 VERIFICACIÓN COMPLETA' as titulo,
  'Si todos los items anteriores muestran ✅, el storage está listo' as instruccion,
  'Prueba grabando un audio en tu app' as siguiente_paso; 