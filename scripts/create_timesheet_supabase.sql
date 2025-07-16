-- Script para crear tablas de timesheet en Supabase
-- Ejecutar en el Query Editor de Supabase

-- 1. Crear enums para estados de timesheet y jornada
DO $$ BEGIN
    CREATE TYPE timesheet_status AS ENUM ('not_started', 'in_progress', 'paused', 'completed');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'El tipo timesheet_status ya existe, continuando...';
END $$;

DO $$ BEGIN
    CREATE TYPE day_status AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'El tipo day_status ya existe, continuando...';
END $$;

-- 2. Crear tabla de jornadas laborales (work_days)
CREATE TABLE IF NOT EXISTS work_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status day_status DEFAULT 'pending',
  
  -- Horarios planificados
  planned_start_time TIME DEFAULT '08:00:00',
  planned_end_time TIME DEFAULT '17:00:00',
  planned_duration INTEGER DEFAULT 540, -- 9 horas en minutos
  
  -- Horarios reales
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  actual_duration INTEGER DEFAULT 0, -- en segundos
  
  -- Estado del timesheet
  timesheet_status timesheet_status DEFAULT 'not_started',
  current_session_start TIMESTAMPTZ,
  
  -- Pausas y descansos
  total_break_time INTEGER DEFAULT 0, -- en minutos
  
  -- Notas y observaciones
  notes TEXT,
  location_check_in TEXT,
  location_check_out TEXT,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Restricción única por usuario y fecha
  UNIQUE(user_id, date)
);

-- 3. Crear tabla de sesiones de trabajo
CREATE TABLE IF NOT EXISTS work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_day_id UUID NOT NULL REFERENCES work_days(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tiempos de la sesión
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER, -- en segundos, calculado automáticamente
  
  -- Tipo de sesión
  session_type TEXT DEFAULT 'work', -- 'work', 'break', 'pause'
  
  -- Ubicación (opcional)
  start_location TEXT,
  end_location TEXT,
  
  -- Tareas asociadas (opcional)
  task_id UUID, -- Sin FK por ahora
  task_notes TEXT,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear tabla de notificaciones de jornada
CREATE TABLE IF NOT EXISTS work_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_day_id UUID REFERENCES work_days(id) ON DELETE CASCADE,
  
  -- Contenido de la notificación
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  
  -- Estado
  is_read BOOLEAN DEFAULT FALSE,
  is_urgent BOOLEAN DEFAULT FALSE,
  
  -- Acción requerida (opcional)
  action_required BOOLEAN DEFAULT FALSE,
  action_type TEXT, -- 'navigate_to_task', 'approve_timesheet', etc.
  action_data JSONB,
  
  -- Tiempos
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Crear función para calcular duración de sesiones automáticamente
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo calcular si se ha establecido end_time
  IF NEW.end_time IS NOT NULL THEN
    NEW.duration = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear función para actualizar estadísticas de work_day
CREATE OR REPLACE FUNCTION update_work_day_stats()
RETURNS TRIGGER AS $$
DECLARE
  total_work_duration INTEGER;
  wd_id UUID;
BEGIN
  -- Determinar work_day_id según el tipo de operación
  IF TG_OP = 'DELETE' THEN
    wd_id = OLD.work_day_id;
  ELSE
    wd_id = NEW.work_day_id;
  END IF;
  
  -- Calcular duración total de trabajo (sesiones tipo 'work')
  SELECT COALESCE(SUM(duration), 0) INTO total_work_duration
  FROM work_sessions 
  WHERE work_day_id = wd_id AND session_type = 'work' AND end_time IS NOT NULL;
  
  -- Actualizar work_day
  UPDATE work_days SET
    actual_duration = total_work_duration, -- en segundos
    updated_at = NOW()
  WHERE id = wd_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 7. Crear triggers
-- Trigger para calcular duración de sesiones
DROP TRIGGER IF EXISTS trigger_calculate_session_duration ON work_sessions;
CREATE TRIGGER trigger_calculate_session_duration
  BEFORE INSERT OR UPDATE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_duration();

-- Trigger para actualizar estadísticas de work_day cuando cambian las sesiones
DROP TRIGGER IF EXISTS trigger_update_work_day_stats_sessions ON work_sessions;
CREATE TRIGGER trigger_update_work_day_stats_sessions
  AFTER INSERT OR UPDATE OR DELETE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_work_day_stats();

-- 8. Crear función para obtener jornada actual o crear una nueva
CREATE OR REPLACE FUNCTION get_or_create_work_day(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
  wd_id UUID;
BEGIN
  -- Buscar jornada existente
  SELECT id INTO wd_id
  FROM work_days
  WHERE user_id = p_user_id AND date = p_date;
  
  -- Si no existe, crear una nueva
  IF wd_id IS NULL THEN
    INSERT INTO work_days (user_id, date)
    VALUES (p_user_id, p_date)
    RETURNING id INTO wd_id;
  END IF;
  
  RETURN wd_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_work_days_user_date ON work_days(user_id, date);
CREATE INDEX IF NOT EXISTS idx_work_days_status ON work_days(status);
CREATE INDEX IF NOT EXISTS idx_work_days_timesheet_status ON work_days(timesheet_status);
CREATE INDEX IF NOT EXISTS idx_work_sessions_work_day ON work_sessions(work_day_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_date ON work_sessions(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_work_notifications_user ON work_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_work_notifications_unread ON work_notifications(user_id, is_read) WHERE is_read = false;

-- 10. Configurar Row Level Security
ALTER TABLE work_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_notifications ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own work days" ON work_days;
DROP POLICY IF EXISTS "Users can manage own work days" ON work_days;
DROP POLICY IF EXISTS "Users can view own work sessions" ON work_sessions;
DROP POLICY IF EXISTS "Users can manage own work sessions" ON work_sessions;
DROP POLICY IF EXISTS "Users can view own notifications" ON work_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON work_notifications;

-- Políticas para work_days
CREATE POLICY "Users can view own work days" ON work_days
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own work days" ON work_days
  FOR ALL USING (user_id = auth.uid());

-- Políticas para work_sessions
CREATE POLICY "Users can view own work sessions" ON work_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own work sessions" ON work_sessions
  FOR ALL USING (user_id = auth.uid());

-- Políticas para work_notifications
CREATE POLICY "Users can view own notifications" ON work_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON work_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- 11. Crear work_day para el usuario de prueba
INSERT INTO work_days (user_id, date, timesheet_status, status)
SELECT 
  id as user_id,
  CURRENT_DATE as date,
  'not_started'::timesheet_status,
  'pending'::day_status
FROM auth.users 
WHERE email IN (
  'german@taskmanager.com',
  'zizi@taskmanager.com', 
  'albert@taskmanager.com'
)
ON CONFLICT (user_id, date) DO NOTHING;

-- Verificar que todo se creó correctamente
SELECT 
  'TABLAS DE TIMESHEET CREADAS EXITOSAMENTE' as status,
  (SELECT COUNT(*) FROM work_days) as work_days_count,
  (SELECT COUNT(*) FROM work_sessions) as work_sessions_count,
  (SELECT COUNT(*) FROM work_notifications) as work_notifications_count; 