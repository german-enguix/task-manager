-- Script para crear tabla de comentarios de tareas
-- Ejecutar en el panel SQL de Supabase

-- ===============================
-- 1. CREAR ENUM PARA TIPOS DE COMENTARIO
-- ===============================

-- Crear enum para tipos de comentario (texto o voz)
DO $$ BEGIN
    CREATE TYPE comment_type AS ENUM ('text', 'voice');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'El tipo comment_type ya existe, continuando...';
END $$;

-- ===============================
-- 2. CREAR TABLA DE COMENTARIOS
-- ===============================

-- Crear tabla para comentarios de tareas
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type comment_type NOT NULL,
  content TEXT NOT NULL,
  file_path TEXT, -- Para almacenar ruta del archivo de audio en comentarios de voz
  file_url TEXT, -- URL del archivo si se almacena en storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================
-- 3. HABILITAR ROW LEVEL SECURITY
-- ===============================

-- Habilitar RLS en la tabla de comentarios
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- ===============================
-- 4. CREAR POLÍTICAS DE SEGURIDAD
-- ===============================

-- Política: Los usuarios pueden ver comentarios de sus tareas asignadas
CREATE POLICY "task_comments_select_own_tasks" ON task_comments
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks 
      WHERE assigned_to = auth.uid()
    )
  );

-- Política: Los usuarios pueden insertar comentarios en sus tareas
CREATE POLICY "task_comments_insert_own_tasks" ON task_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    task_id IN (
      SELECT id FROM tasks 
      WHERE assigned_to = auth.uid()
    )
  );

-- Política: Los usuarios pueden actualizar sus propios comentarios
CREATE POLICY "task_comments_update_own" ON task_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propios comentarios
CREATE POLICY "task_comments_delete_own" ON task_comments
  FOR DELETE USING (auth.uid() = user_id);

-- ===============================
-- 5. CREAR ÍNDICES PARA PERFORMANCE
-- ===============================

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_comments_type ON task_comments(type);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_user ON task_comments(task_id, user_id);

-- ===============================
-- 6. CREAR FUNCIÓN PARA ACTUALIZAR updated_at
-- ===============================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_task_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS trigger_update_task_comments_updated_at ON task_comments;
CREATE TRIGGER trigger_update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION update_task_comments_updated_at();

-- ===============================
-- 7. COMENTARIOS PARA DOCUMENTACIÓN
-- ===============================

COMMENT ON TABLE task_comments IS 'Comentarios de tareas (texto y voz)';
COMMENT ON COLUMN task_comments.type IS 'Tipo de comentario: text o voice';
COMMENT ON COLUMN task_comments.content IS 'Contenido del comentario (texto o descripción para voz)';
COMMENT ON COLUMN task_comments.file_path IS 'Ruta local del archivo de audio (para comentarios de voz)';
COMMENT ON COLUMN task_comments.file_url IS 'URL del archivo en storage (para comentarios de voz)';

-- ===============================
-- 8. VERIFICACIÓN FINAL
-- ===============================

-- Mostrar estructura de la tabla creada
SELECT 'ESTRUCTURA DE TABLA TASK_COMMENTS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'task_comments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar políticas creadas
SELECT 'POLÍTICAS RLS CREADAS:' as info;
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'task_comments';

-- Mensaje de éxito
SELECT '✅ Tabla task_comments creada exitosamente' as resultado;
SELECT '✅ Enum comment_type creado (text, voice)' as resultado;
SELECT '✅ Políticas RLS configuradas' as resultado;
SELECT '✅ Índices de performance creados' as resultado; 