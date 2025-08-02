-- Función corregida para obtener estadísticas del timer del día
-- Incluye TANTO sesiones del día independiente como sesiones de tareas
CREATE OR REPLACE FUNCTION get_day_timer_stats(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  wd work_days%ROWTYPE;
  total_day_independent INTEGER := 0;
  total_tasks INTEGER := 0;
  total_elapsed INTEGER := 0;
  is_day_running BOOLEAN := FALSE;
  day_session_start TIMESTAMPTZ;
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
  
  -- 1. Calcular tiempo del día independiente (task_id = NULL)
  SELECT COALESCE(SUM(duration), 0) INTO total_day_independent
  FROM task_timer_sessions
  WHERE user_id = p_user_id 
    AND task_id IS NULL
    AND end_time IS NOT NULL
    AND DATE(start_time) = p_date;
  
  -- 2. Calcular tiempo de todas las tareas (task_id != NULL)
  SELECT COALESCE(SUM(duration), 0) INTO total_tasks
  FROM task_timer_sessions
  WHERE user_id = p_user_id 
    AND task_id IS NOT NULL
    AND end_time IS NOT NULL
    AND DATE(start_time) = p_date;
  
  -- 3. Verificar si hay sesión del día independiente activa
  SELECT start_time INTO day_session_start
  FROM task_timer_sessions
  WHERE user_id = p_user_id 
    AND task_id IS NULL
    AND end_time IS NULL
    AND DATE(start_time) = p_date;
  
  is_day_running := (day_session_start IS NOT NULL);
  current_session_start := day_session_start;
  
  -- 4. Sumar tiempo total (día independiente + tareas)
  total_elapsed := total_day_independent + total_tasks;
  
  -- 5. Si el día está corriendo, sumar tiempo de sesión actual
  IF is_day_running THEN
    total_elapsed := total_elapsed + EXTRACT(EPOCH FROM (NOW() - day_session_start))::INTEGER;
  END IF;
  
  -- 6. También verificar tareas activas y sumarlas al total
  -- (esto es para mostrar el tiempo real combinado)
  DECLARE
    task_sessions_time INTEGER := 0;
  BEGIN
    SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER), 0) 
    INTO task_sessions_time
    FROM task_timer_sessions
    WHERE user_id = p_user_id 
      AND task_id IS NOT NULL
      AND end_time IS NULL
      AND DATE(start_time) = p_date;
    
    total_elapsed := total_elapsed + task_sessions_time;
  END;
  
  RETURN json_build_object(
    'totalElapsed', total_elapsed,
    'isRunning', is_day_running,
    'status', wd.timesheet_status,
    'currentSessionStart', current_session_start,
    'dayIndependent', total_day_independent,
    'tasksTime', total_tasks
  );
END;
$$ LANGUAGE plpgsql; 