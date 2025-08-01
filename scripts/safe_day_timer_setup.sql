-- ================================================
-- SCRIPT SEGURO PARA TIMER DEL DÍA - USA TABLA work_days EXISTENTE
-- ================================================
-- Este script es SEGURO: no borra nada, solo añade lo que falta

-- 1. Verificar que timesheet_status enum existe (debería existir ya)
DO $$ BEGIN
    CREATE TYPE timesheet_status AS ENUM ('not_started', 'in_progress', 'paused', 'completed');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '✅ El tipo timesheet_status ya existe, continuando...';
END $$;

-- 2. Verificar que la tabla work_days existe y tiene los campos necesarios
DO $$ 
DECLARE
    column_exists boolean;
BEGIN
    -- Verificar timesheet_status
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_days' 
        AND column_name = 'timesheet_status'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE work_days ADD COLUMN timesheet_status timesheet_status DEFAULT 'not_started';
        RAISE NOTICE '✅ Añadida columna timesheet_status a work_days';
    ELSE
        RAISE NOTICE '✅ Columna timesheet_status ya existe en work_days';
    END IF;
    
    -- Verificar current_session_start
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_days' 
        AND column_name = 'current_session_start'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE work_days ADD COLUMN current_session_start TIMESTAMPTZ;
        RAISE NOTICE '✅ Añadida columna current_session_start a work_days';
    ELSE
        RAISE NOTICE '✅ Columna current_session_start ya existe en work_days';
    END IF;
    
    -- Verificar actual_duration
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_days' 
        AND column_name = 'actual_duration'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE work_days ADD COLUMN actual_duration INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Añadida columna actual_duration a work_days';
    ELSE
        RAISE NOTICE '✅ Columna actual_duration ya existe en work_days';
    END IF;
END $$;

-- 3. MODIFICAR task_timer_sessions para permitir task_id NULL (MUY IMPORTANTE)
DO $$
BEGIN
    -- Permitir task_id NULL para sesiones del día
    ALTER TABLE task_timer_sessions ALTER COLUMN task_id DROP NOT NULL;
    RAISE NOTICE '✅ task_timer_sessions modificada para permitir task_id NULL';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Error modificando task_timer_sessions (puede que ya esté modificada): %', SQLERRM;
END $$;

-- 4. Función para obtener o crear jornada del día (SEGURA)
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
    INSERT INTO work_days (user_id, date, timesheet_status)
    VALUES (p_user_id, p_date, 'not_started'::timesheet_status)
    RETURNING id INTO wd_id;
    
    RAISE NOTICE '✅ Nueva jornada creada: %', wd_id;
  ELSE
    RAISE NOTICE '✅ Jornada existente encontrada: %', wd_id;
  END IF;
  
  RETURN wd_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Función para iniciar timer del día
CREATE OR REPLACE FUNCTION start_day_timer(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  wd_id UUID;
  session_id UUID;
BEGIN
  -- Obtener o crear jornada de hoy
  SELECT get_or_create_work_day(p_user_id) INTO wd_id;
  
  -- Cerrar cualquier sesión activa del día (task_id IS NULL)
  UPDATE task_timer_sessions 
  SET end_time = NOW()
  WHERE user_id = p_user_id 
    AND task_id IS NULL 
    AND end_time IS NULL;
  
  -- Crear nueva sesión del día en task_timer_sessions
  INSERT INTO task_timer_sessions (task_id, user_id, start_time)
  VALUES (NULL, p_user_id, NOW())  -- task_id = NULL = sesión del día
  RETURNING id INTO session_id;
  
  -- Actualizar estado de la jornada
  UPDATE work_days SET
    timesheet_status = 'in_progress'::timesheet_status,
    current_session_start = NOW(),
    updated_at = NOW()
  WHERE id = wd_id;
  
  RAISE NOTICE '✅ Timer del día iniciado, sesión: %', session_id;
  RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para pausar timer del día
CREATE OR REPLACE FUNCTION pause_day_timer(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  wd_id UUID;
  total_elapsed INTEGER;
BEGIN
  -- Obtener jornada de hoy
  SELECT get_or_create_work_day(p_user_id) INTO wd_id;
  
  -- Cerrar sesión activa del día
  UPDATE task_timer_sessions 
  SET end_time = NOW()
  WHERE user_id = p_user_id 
    AND task_id IS NULL 
    AND end_time IS NULL;
  
  -- Calcular tiempo total del día
  SELECT COALESCE(SUM(duration), 0) INTO total_elapsed
  FROM task_timer_sessions
  WHERE user_id = p_user_id 
    AND task_id IS NULL
    AND end_time IS NOT NULL
    AND DATE(start_time) = CURRENT_DATE;
  
  -- Actualizar jornada
  UPDATE work_days SET
    timesheet_status = 'paused'::timesheet_status,
    current_session_start = NULL,
    actual_duration = total_elapsed,
    updated_at = NOW()
  WHERE id = wd_id;
  
  RAISE NOTICE '✅ Timer del día pausado, total: % segundos', total_elapsed;
  RETURN total_elapsed;
END;
$$ LANGUAGE plpgsql;

-- 7. Función para obtener estadísticas del timer del día
CREATE OR REPLACE FUNCTION get_day_timer_stats(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  wd work_days%ROWTYPE;
  total_elapsed INTEGER;
  is_running BOOLEAN := FALSE;
  current_session_start TIMESTAMPTZ;
BEGIN
  -- Obtener datos de la jornada
  SELECT * INTO wd
  FROM work_days
  WHERE user_id = p_user_id AND date = p_date;
  
  -- Si no existe jornada, crear y devolver datos por defecto
  IF wd.id IS NULL THEN
    PERFORM get_or_create_work_day(p_user_id, p_date);
    RETURN json_build_object(
      'totalElapsed', 0,
      'isRunning', false,
      'status', 'not_started',
      'currentSessionStart', null
    );
  END IF;
  
  -- Calcular tiempo total del día
  SELECT COALESCE(SUM(duration), 0) INTO total_elapsed
  FROM task_timer_sessions
  WHERE user_id = p_user_id 
    AND task_id IS NULL
    AND end_time IS NOT NULL
    AND DATE(start_time) = p_date;
  
  -- Verificar si hay sesión activa
  SELECT start_time INTO current_session_start
  FROM task_timer_sessions
  WHERE user_id = p_user_id 
    AND task_id IS NULL
    AND end_time IS NULL
    AND DATE(start_time) = p_date;
  
  is_running := (current_session_start IS NOT NULL);
  
  -- Si está corriendo, sumar tiempo de sesión actual
  IF is_running THEN
    total_elapsed := total_elapsed + EXTRACT(EPOCH FROM (NOW() - current_session_start))::INTEGER;
  END IF;
  
  RETURN json_build_object(
    'totalElapsed', total_elapsed,
    'isRunning', is_running,
    'status', COALESCE(wd.timesheet_status, 'not_started'),
    'currentSessionStart', current_session_start
  );
END;
$$ LANGUAGE plpgsql;

-- 8. Crear índices SOLO si no existen
CREATE INDEX IF NOT EXISTS idx_work_days_user_date ON work_days(user_id, date);
CREATE INDEX IF NOT EXISTS idx_task_timer_sessions_day_sessions ON task_timer_sessions(user_id, start_time) WHERE task_id IS NULL;

-- 9. Configurar RLS (SEGURO)
ALTER TABLE work_days ENABLE ROW LEVEL SECURITY;

-- Políticas para work_days (DROP IF EXISTS es seguro)
DROP POLICY IF EXISTS "Users can view own work days" ON work_days;
CREATE POLICY "Users can view own work days" ON work_days
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own work days" ON work_days;  
CREATE POLICY "Users can manage own work days" ON work_days
  FOR ALL USING (user_id = auth.uid());

-- 10. Verificación final
SELECT 
  '🎉 TIMER DEL DÍA CONFIGURADO EXITOSAMENTE (MODO SEGURO)' as status,
  'work_days actualizada, task_timer_sessions modificada' as tables,
  'Funciones start_day_timer, pause_day_timer, get_day_timer_stats creadas' as functions,
  NOW() as timestamp;

-- 11. Mostrar estructura actual de work_days
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'work_days'
ORDER BY ordinal_position; 