-- ==========================================
-- CONFIGURACIÓN COMPLETA DE SUPABASE STORAGE
-- Para funcionalidad de grabación de audio
-- ==========================================

-- 1. Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-evidences',
  'task-evidences', 
  true,
  52428800, -- 50MB en bytes
  ARRAY['audio/mp4', 'audio/m4a', 'audio/wav', 'audio/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Verificar que el bucket se creó correctamente
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'task-evidences';

-- 3. Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Permitir subir archivos de audio" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leer archivos de audio" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminar archivos de audio" ON storage.objects;

-- 4. Crear políticas de acceso para el bucket
-- Política para INSERT (subir archivos)
CREATE POLICY "Permitir subir archivos de audio" ON storage.objects
FOR INSERT 
TO authenticated, anon
WITH CHECK (
  bucket_id = 'task-evidences' AND 
  (storage.foldername(name))[1] = 'audio-evidences'
);

-- Política para SELECT (leer archivos públicos)
CREATE POLICY "Permitir leer archivos de audio" ON storage.objects
FOR SELECT 
TO authenticated, anon
USING (
  bucket_id = 'task-evidences' AND 
  (storage.foldername(name))[1] = 'audio-evidences'
);

-- Política para DELETE (eliminar archivos - opcional)
CREATE POLICY "Permitir eliminar archivos de audio" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'task-evidences' AND 
  (storage.foldername(name))[1] = 'audio-evidences'
);

-- 5. Verificar políticas creadas
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%audio%';

-- 6. Verificar configuración completa
SELECT 
  'Bucket configurado correctamente: ' || b.name as status,
  'Público: ' || b.public as public_status,
  'Límite: ' || (b.file_size_limit / 1024 / 1024) || 'MB' as size_limit,
  'MIME types: ' || array_to_string(b.allowed_mime_types, ', ') as mime_types
FROM storage.buckets b
WHERE b.id = 'task-evidences';

-- 7. Mensaje de confirmación
SELECT 
  '🎵 Configuración de Supabase Storage completada exitosamente!' as mensaje,
  'El bucket task-evidences está listo para recibir archivos de audio' as detalle,
  'Carpeta de destino: audio-evidences/' as path_info; 