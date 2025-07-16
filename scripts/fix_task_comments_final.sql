-- ============================================
-- SCRIPT FINAL: Fix Task Comments Table
-- ============================================
-- Este script diagnostica y crea la tabla task_comments 
-- con todas las configuraciones necesarias

-- Paso 1: Verificar si la tabla existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_comments') THEN
    RAISE NOTICE 'La tabla task_comments ya existe';
  ELSE
    RAISE NOTICE 'La tabla task_comments NO existe - se creará';
  END IF;
END $$;

-- Paso 2: Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'voice')),
  content TEXT NOT NULL,
  file_path TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Paso 3: Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON public.task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON public.task_comments(created_at);

-- Paso 4: Configurar RLS (Row Level Security)
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Paso 5: Crear políticas RLS básicas
DROP POLICY IF EXISTS "Users can view task comments" ON public.task_comments;
CREATE POLICY "Users can view task comments" ON public.task_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create task comments" ON public.task_comments;
CREATE POLICY "Users can create task comments" ON public.task_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.task_comments;
CREATE POLICY "Users can update their own comments" ON public.task_comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.task_comments;
CREATE POLICY "Users can delete their own comments" ON public.task_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Paso 6: Conceder permisos básicos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_comments TO authenticated;
GRANT SELECT ON public.task_comments TO anon;

-- Paso 7: Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Paso 8: Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_task_comments_updated_at ON public.task_comments;
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Paso 9: Insertar datos de prueba si la tabla está vacía
INSERT INTO public.task_comments (task_id, user_id, type, content)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  id,
  'text',
  'Comentario de prueba - tabla configurada correctamente'
FROM auth.users 
WHERE EXISTS (SELECT 1 FROM auth.users)
AND NOT EXISTS (SELECT 1 FROM public.task_comments)
LIMIT 1;

-- Paso 10: Verificación final
DO $$
DECLARE
  table_count INT;
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_name = 'task_comments';
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'task_comments';
  
  RAISE NOTICE '=== VERIFICACIÓN FINAL ===';
  RAISE NOTICE 'Tabla task_comments existe: %', (table_count > 0);
  RAISE NOTICE 'Políticas RLS configuradas: %', policy_count;
  RAISE NOTICE 'Estado: % CONFIGURADA CORRECTAMENTE', CASE WHEN table_count > 0 AND policy_count > 0 THEN '✅' ELSE '❌' END;
END $$;

-- Mostrar estructura final de la tabla
\d public.task_comments;

-- Mostrar políticas configuradas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'task_comments'; 