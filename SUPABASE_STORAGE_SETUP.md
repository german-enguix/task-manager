# 🗄️ Configuración de Supabase Storage para Audio

## 📋 Problema Común
Si al grabar audio no se guarda y no se marca el check, probablemente sea porque **Supabase Storage no está configurado**.

## ✅ Solución: Configurar Storage

### 1. 🏗️ Crear el Bucket
Ve a tu dashboard de Supabase → Storage → Create bucket:

- **Nombre:** `task-evidences`
- **Público:** ✅ Si (para poder reproducir audios)
- **File size limit:** 50MB (suficiente para audios)

### 2. 🔐 Configurar Políticas RLS

Ejecuta estos comandos SQL en tu Supabase SQL Editor:

```sql
-- Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-evidences',
  'task-evidences', 
  true,
  52428800, -- 50MB
  ARRAY['audio/m4a', 'audio/mp4', 'audio/wav', 'audio/mpeg']
) ON CONFLICT (id) DO NOTHING;

-- Política para subir archivos (autenticados)
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'task-evidences' 
  AND auth.role() = 'authenticated'
);

-- Política para leer archivos (público)
CREATE POLICY "Anyone can view files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'task-evidences'
);

-- Política para eliminar archivos (autenticados)
CREATE POLICY "Authenticated users can delete files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'task-evidences' 
  AND auth.role() = 'authenticated'
);
```

### 3. 🧪 Verificar Configuración

Ejecuta este SQL para verificar:

```sql
-- Verificar que el bucket existe
SELECT * FROM storage.buckets WHERE id = 'task-evidences';

-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

## 🔄 Comportamiento del Sistema

### ✅ **Con Storage Configurado:**
- Audio se sube a Supabase Storage
- URLs públicas persisten después de refrescar
- Archivos se eliminan automáticamente al desmarcar

### ⚠️ **Sin Storage (Fallback):**
- Audio se guarda con URI local temporal
- Funciona hasta refrescar la app
- Mensaje: "Audio se perderá al refrescar"

## 🔍 Debug

Si sigues teniendo problemas, revisa los logs en la consola:

```
🎵 handleAudioSuccess called with: {...}
🔄 Starting audio evidence capture process...
📤 Starting audio file upload: {...}
🔄 Fetching audio file from URI...
✅ Audio file fetched, size: X bytes
🔄 Uploading to Supabase Storage: audio-evidences/...
```

### 🚨 Errores Comunes:

| Error | Solución |
|-------|----------|
| `Bucket not found` | Crear bucket `task-evidences` |
| `permission denied` | Configurar políticas RLS |
| `file size` | Aumentar límite del bucket |
| `URI de audio vacío` | Problema en grabación, revisar permisos de micrófono |

## 📱 Verificación Final

1. Graba un audio ✅
2. Se marca el check ✅  
3. Aparece "Ver Audio" ✅
4. Refrescar app ✅
5. Audio sigue reproducible ✅

¡Si todos los pasos funcionan, Storage está configurado correctamente! 🎉 