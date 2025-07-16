-- =============================================
-- SCRIPT COMPLETO DE CONFIGURACIÓN DE BASE DE DATOS
-- =============================================
-- Este script configura completamente la base de datos con:
-- 1. Autenticación y perfiles
-- 2. Todas las tablas necesarias  
-- 3. Datos reales de tareas
-- 4. Usuarios de prueba
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto Supabase en supabase.com
-- 2. Navega a SQL Editor
-- 3. Ejecuta este script completo
-- 4. Crea los usuarios en Authentication > Users (ver abajo)
-- =============================================

-- =============================================
-- 1. CONFIGURACIÓN DE AUTENTICACIÓN Y ROLES
-- =============================================

-- Crear enum para roles de usuario
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'supervisor', 'developer');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'El tipo user_role ya existe, continuando...';
END $$;

-- Crear enum para estados de tarea
DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'paused', 'completed');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'El tipo task_status ya existe, continuando...';
END $$;

-- Crear enum para niveles de prioridad
DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'El tipo priority_level ya existe, continuando...';
END $$;

-- Crear enum para estados de proyecto
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('programmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'El tipo project_status ya existe, continuando...';
END $$;

-- Crear enum para tipos de evidencia
DO $$ BEGIN
    CREATE TYPE evidence_type AS ENUM ('photo_video', 'audio', 'signature', 'location', 'nfc');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'El tipo evidence_type ya existe, continuando...';
END $$;

-- =============================================
-- 2. CREAR TABLA DE PERFILES DE USUARIO
-- =============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'developer',
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles  
  FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- 3. CREAR TABLAS PRINCIPALES
-- =============================================

-- Tabla de tags/etiquetas
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tareas
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status task_status DEFAULT 'not_started',
  priority priority_level NOT NULL,
  due_date TIMESTAMPTZ,
  estimated_duration INTEGER, -- en minutos
  project_name TEXT NOT NULL,
  location TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  project_id UUID,
  -- Campos del timer
  timer_total_elapsed INTEGER DEFAULT 0,
  timer_is_running BOOLEAN DEFAULT FALSE,
  timer_current_session_start TIMESTAMPTZ,
  timer_last_session_end TIMESTAMPTZ,
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de subtareas
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Tabla de relación tareas-tags
CREATE TABLE IF NOT EXISTS task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, tag_id)
);

-- Tabla de comentarios de tareas
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  file_path TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de evidencias de subtareas
CREATE TABLE IF NOT EXISTS subtask_evidence_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtask_id UUID NOT NULL REFERENCES subtasks(id) ON DELETE CASCADE,
  type evidence_type NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de evidencias completadas
CREATE TABLE IF NOT EXISTS subtask_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtask_id UUID NOT NULL REFERENCES subtasks(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES subtask_evidence_requirements(id) ON DELETE CASCADE,
  type evidence_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  data JSONB,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de sesiones de timer
CREATE TABLE IF NOT EXISTS task_timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER, -- en segundos
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS work_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  action_required BOOLEAN DEFAULT false,
  action_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- =============================================
-- 4. CONFIGURAR ROW LEVEL SECURITY
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para tareas
DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
CREATE POLICY "Users can view assigned tasks" ON tasks
  FOR SELECT USING (auth.uid() = assigned_to);

DROP POLICY IF EXISTS "Users can update assigned tasks" ON tasks;
CREATE POLICY "Users can update assigned tasks" ON tasks
  FOR UPDATE USING (auth.uid() = assigned_to);

-- Políticas para subtareas
DROP POLICY IF EXISTS "Users can view subtasks of assigned tasks" ON subtasks;
CREATE POLICY "Users can view subtasks of assigned tasks" ON subtasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = subtasks.task_id 
      AND tasks.assigned_to = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update subtasks of assigned tasks" ON subtasks;
CREATE POLICY "Users can update subtasks of assigned tasks" ON subtasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = subtasks.task_id 
      AND tasks.assigned_to = auth.uid()
    )
  );

-- Políticas para comentarios
DROP POLICY IF EXISTS "Users can view comments on assigned tasks" ON task_comments;
CREATE POLICY "Users can view comments on assigned tasks" ON task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_comments.task_id 
      AND tasks.assigned_to = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert comments on assigned tasks" ON task_comments;
CREATE POLICY "Users can insert comments on assigned tasks" ON task_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_comments.task_id 
      AND tasks.assigned_to = auth.uid()
    )
  );

-- Políticas para notificaciones
DROP POLICY IF EXISTS "Users can view own notifications" ON work_notifications;
CREATE POLICY "Users can view own notifications" ON work_notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON work_notifications;
CREATE POLICY "Users can update own notifications" ON work_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 5. CREAR ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);

-- =============================================
-- 6. CREAR FUNCIONES Y TRIGGERS
-- =============================================

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 7. INSERTAR TAGS DEL SISTEMA
-- =============================================

INSERT INTO tags (id, name, color, category) VALUES 
('tag-safety', 'Seguridad', '#ff5722', 'Operaciones'),
('tag-urgent', 'Urgente', '#f44336', 'Prioridad'),
('tag-maintenance', 'Mantenimiento', '#2196f3', 'Operaciones'),
('tag-inspection', 'Inspección', '#9c27b0', 'Calidad'),
('tag-quality', 'Control de Calidad', '#4caf50', 'Calidad'),
('tag-training', 'Capacitación', '#ff9800', 'RRHH'),
('tag-equipment', 'Equipamiento', '#607d8b', 'Operaciones'),
('tag-compliance', 'Cumplimiento', '#795548', 'Legal'),
('tag-documentation', 'Documentación', '#3f51b5', 'Administración'),
('tag-environmental', 'Ambiental', '#8bc34a', 'Sostenibilidad')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 8. MENSAJE FINAL
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ¡BASE DE DATOS CONFIGURADA EXITOSAMENTE!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 SIGUIENTE PASO: CREAR USUARIOS';
  RAISE NOTICE 'Ve a Authentication > Users en Supabase y crea estos usuarios:';
  RAISE NOTICE '';
  RAISE NOTICE '• zizi@taskmanager.com (password: test123, role: developer)';
  RAISE NOTICE '• german@taskmanager.com (password: test123, role: developer)';  
  RAISE NOTICE '• albert@taskmanager.com (password: test123, role: developer)';
  RAISE NOTICE '• manager@taskapp.com (password: test123, role: manager)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE: Marca "Email confirmed" para cada usuario';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 DESPUÉS ejecuta: scripts/create_real_tasks_data.sql';
  RAISE NOTICE '';
END $$; 