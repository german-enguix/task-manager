-- ================================================
-- SCRIPT COMPLETO PARA PERSISTENCIA DEL TIMER DEL DÍA
-- ================================================
-- Ejecutar en el Query Editor de Supabase
-- Este script crea todas las tablas y funciones necesarias

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
  
  -- Estado del timesheet (IMPORTANTE PARA PERSISTENCIA)
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

-- 4. Función para calcular duración de sesiones automáticamente
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo calcular si se ha establecido end_time
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
    NEW.updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger para calcular duración automáticamente
DROP TRIGGER IF EXISTS trigger_calculate_session_duration ON work_sessions;
CREATE TRIGGER trigger_calculate_session_duration
  BEFORE INSERT OR UPDATE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_duration();

-- 6. Función para actualizar estadísticas de work_day
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

-- 7. Crear trigger para actualizar estadísticas
DROP TRIGGER IF EXISTS trigger_update_work_day_stats_sessions ON work_sessions;
CREATE TRIGGER trigger_update_work_day_stats_sessions
  AFTER INSERT OR UPDATE OR DELETE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_work_day_stats();

-- 8. Función para obtener o crear jornada (CRÍTICA PARA LA APP)
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
    
    RAISE NOTICE 'Nueva jornada creada para usuario % en fecha %', p_user_id, p_date;
  ELSE
    RAISE NOTICE 'Jornada existente encontrada: %', wd_id;
  END IF;
  
  RETURN wd_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Función para iniciar sesión de trabajo (CRÍTICA PARA EL TIMER)
CREATE OR REPLACE FUNCTION start_work_session(
  p_user_id UUID,
  p_task_id UUID DEFAULT NULL,
  p_location TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  wd_id UUID;
  session_id UUID;
BEGIN
  -- Obtener o crear work_day para hoy
  SELECT get_or_create_work_day(p_user_id) INTO wd_id;
  
  -- Crear nueva sesión de trabajo
  INSERT INTO work_sessions (
    work_day_id,
    user_id,
    start_time,
    session_type,
    start_location,
    task_id
  ) VALUES (
    wd_id,
    p_user_id,
    NOW(),
    'work',
    p_location,
    p_task_id
  ) RETURNING id INTO session_id;
  
  -- Actualizar work_day para reflejar que está en progreso
  UPDATE work_days SET
    timesheet_status = 'in_progress'::timesheet_status,
    current_session_start = NOW(),
    actual_start_time = CASE 
      WHEN actual_start_time IS NULL THEN NOW()
      ELSE actual_start_time
    END,
    status = 'in_progress'::day_status,
    updated_at = NOW()
  WHERE id = wd_id;
  
  RAISE NOTICE 'Sesión de trabajo iniciada: %, work_day: %', session_id, wd_id;
  RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_work_days_user_date ON work_days(user_id, date);
CREATE INDEX IF NOT EXISTS idx_work_days_status ON work_days(status);
CREATE INDEX IF NOT EXISTS idx_work_days_timesheet_status ON work_days(timesheet_status);
CREATE INDEX IF NOT EXISTS idx_work_sessions_work_day ON work_sessions(work_day_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_date ON work_sessions(user_id, start_time);

-- 11. Configurar Row Level Security (RLS)
ALTER TABLE work_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own work days" ON work_days;
DROP POLICY IF EXISTS "Users can manage own work days" ON work_days;
DROP POLICY IF EXISTS "Users can view own work sessions" ON work_sessions;
DROP POLICY IF EXISTS "Users can manage own work sessions" ON work_sessions;

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

-- 12. Verificación final
SELECT 
  'SETUP COMPLETADO EXITOSAMENTE' as status,
  'Tablas work_days y work_sessions creadas' as tables,
  'Funciones RPC get_or_create_work_day y start_work_session creadas' as functions,
  'RLS policies configuradas' as security,
  NOW() as timestamp;

-- 13. Mostrar estructura final
\d work_days;
\d work_sessions; 