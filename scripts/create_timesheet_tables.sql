-- Script para crear tablas de timesheet y gestión de jornadas laborales
-- Ejecutar después del setup inicial de Supabase

-- 1. Crear enums para estados de timesheet y jornada
CREATE TYPE timesheet_status AS ENUM ('not_started', 'in_progress', 'paused', 'completed');
CREATE TYPE day_status AS ENUM ('pending', 'in_progress', 'completed');

-- 2. Crear tabla de jornadas laborales (work_days)
CREATE TABLE work_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  status day_status DEFAULT 'pending',
  
  -- Horarios planificados
  planned_start_time TIME,
  planned_end_time TIME,
  planned_duration INTEGER, -- en minutos
  
  -- Horarios reales
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  actual_duration INTEGER DEFAULT 0, -- en minutos
  
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
CREATE TABLE work_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_day_id UUID NOT NULL REFERENCES work_days(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
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
  task_id UUID REFERENCES tasks(id),
  task_notes TEXT,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear tabla de pausas/breaks
CREATE TABLE work_breaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_day_id UUID NOT NULL REFERENCES work_days(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Tiempos de la pausa
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER, -- en minutos
  
  -- Tipo y motivo de la pausa
  break_type TEXT NOT NULL DEFAULT 'break', -- 'break', 'lunch', 'personal', 'technical'
  reason TEXT,
  
  -- Ubicación
  location TEXT,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Crear tabla de notificaciones de jornada
CREATE TABLE work_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
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

-- 6. Crear función para calcular duración de sesiones automáticamente
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

-- 7. Crear función para actualizar estadísticas de work_day
CREATE OR REPLACE FUNCTION update_work_day_stats()
RETURNS TRIGGER AS $$
DECLARE
  total_work_duration INTEGER;
  total_break_duration INTEGER;
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
  
  -- Calcular duración total de pausas
  SELECT COALESCE(SUM(duration), 0) INTO total_break_duration
  FROM work_breaks 
  WHERE work_day_id = wd_id AND end_time IS NOT NULL;
  
  -- Actualizar work_day
  UPDATE work_days SET
    actual_duration = total_work_duration / 60, -- convertir segundos a minutos
    total_break_time = total_break_duration,
    updated_at = NOW()
  WHERE id = wd_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 8. Crear triggers
-- Trigger para calcular duración de sesiones
CREATE TRIGGER trigger_calculate_session_duration
  BEFORE INSERT OR UPDATE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_duration();

-- Trigger para actualizar estadísticas de work_day cuando cambian las sesiones
CREATE TRIGGER trigger_update_work_day_stats_sessions
  AFTER INSERT OR UPDATE OR DELETE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_work_day_stats();

-- Trigger para actualizar estadísticas de work_day cuando cambian los breaks
CREATE TRIGGER trigger_update_work_day_stats_breaks
  AFTER INSERT OR UPDATE OR DELETE ON work_breaks
  FOR EACH ROW
  EXECUTE FUNCTION update_work_day_stats();

-- 9. Crear función para obtener jornada actual o crear una nueva
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
    INSERT INTO work_days (user_id, date, planned_start_time, planned_end_time, planned_duration)
    VALUES (
      p_user_id, 
      p_date, 
      '08:00:00'::TIME, 
      '17:00:00'::TIME, 
      540 -- 9 horas en minutos
    )
    RETURNING id INTO wd_id;
  END IF;
  
  RETURN wd_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Crear función para iniciar sesión de trabajo
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
  wd_id = get_or_create_work_day(p_user_id);
  
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
  
  -- Actualizar work_day
  UPDATE work_days SET
    timesheet_status = 'in_progress',
    current_session_start = NOW(),
    actual_start_time = CASE 
      WHEN actual_start_time IS NULL THEN NOW()
      ELSE actual_start_time
    END,
    status = 'in_progress',
    updated_at = NOW()
  WHERE id = wd_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Crear índices para performance
CREATE INDEX idx_work_days_user_date ON work_days(user_id, date);
CREATE INDEX idx_work_days_status ON work_days(status);
CREATE INDEX idx_work_days_timesheet_status ON work_days(timesheet_status);
CREATE INDEX idx_work_sessions_work_day ON work_sessions(work_day_id);
CREATE INDEX idx_work_sessions_user_date ON work_sessions(user_id, start_time);
CREATE INDEX idx_work_sessions_task ON work_sessions(task_id);
CREATE INDEX idx_work_breaks_work_day ON work_breaks(work_day_id);
CREATE INDEX idx_work_notifications_user ON work_notifications(user_id);
CREATE INDEX idx_work_notifications_unread ON work_notifications(user_id, is_read) WHERE is_read = false;

-- 12. Configurar Row Level Security
ALTER TABLE work_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para work_days (usuarios ven solo sus jornadas, admins ven todas)
CREATE POLICY "Users can view own work days" ON work_days
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage own work days" ON work_days
  FOR ALL USING (user_id = auth.uid());

-- Políticas para work_sessions
CREATE POLICY "Users can view own work sessions" ON work_sessions
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage own work sessions" ON work_sessions
  FOR ALL USING (user_id = auth.uid());

-- Políticas para work_breaks
CREATE POLICY "Users can view own work breaks" ON work_breaks
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage own work breaks" ON work_breaks
  FOR ALL USING (user_id = auth.uid());

-- Políticas para work_notifications
CREATE POLICY "Users can view own notifications" ON work_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON work_notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications" ON work_notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  ); 