-- Script para agregar campos de timer a la tabla tasks
-- Ejecutar en el panel SQL de Supabase

-- ===============================
-- 1. AGREGAR CAMPOS DE TIMER A TABLA TASKS
-- ===============================

-- Agregar campos para persistir el estado del timer
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS timer_total_elapsed INTEGER DEFAULT 0; -- en segundos
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS timer_is_running BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS timer_current_session_start TIMESTAMPTZ NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS timer_last_session_end TIMESTAMPTZ NULL;

-- ===============================
-- 2. CREAR TABLA PARA SESIONES DE TIMER DE TAREAS
-- ===============================

-- Crear tabla para almacenar las sesiones individuales del timer de cada tarea
CREATE TABLE IF NOT EXISTS task_timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER, -- en segundos, calculado automáticamente
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================
-- 3. CREAR FUNCIÓN PARA CALCULAR DURACIÓN AUTOMÁTICAMENTE
-- ===============================

-- Función para calcular duración de sesiones de timer automáticamente
CREATE OR REPLACE FUNCTION calculate_task_timer_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo calcular si se ha establecido end_time
  IF NEW.end_time IS NOT NULL THEN
    NEW.duration = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
    NEW.updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para calcular duración automáticamente
DROP TRIGGER IF EXISTS trigger_calculate_task_timer_session_duration ON task_timer_sessions;
CREATE TRIGGER trigger_calculate_task_timer_session_duration
  BEFORE UPDATE ON task_timer_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_task_timer_session_duration();

-- ===============================
-- 4. CREAR FUNCIÓN PARA INICIAR SESIÓN DE TIMER
-- ===============================

CREATE OR REPLACE FUNCTION start_task_timer(
  p_task_id UUID,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  -- Verificar que la tarea existe
  IF NOT EXISTS (SELECT 1 FROM tasks WHERE id = p_task_id) THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  
  -- Pausar cualquier sesión activa de esta tarea
  UPDATE task_timer_sessions 
  SET end_time = NOW()
  WHERE task_id = p_task_id 
    AND user_id = p_user_id 
    AND end_time IS NULL;
  
  -- Crear nueva sesión
  INSERT INTO task_timer_sessions (task_id, user_id, start_time)
  VALUES (p_task_id, p_user_id, NOW())
  RETURNING id INTO session_id;
  
  -- Actualizar estado del timer en la tarea
  UPDATE tasks SET
    timer_is_running = TRUE,
    timer_current_session_start = NOW(),
    updated_at = NOW()
  WHERE id = p_task_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 5. CREAR FUNCIÓN PARA PAUSAR/PARAR SESIÓN DE TIMER
-- ===============================

CREATE OR REPLACE FUNCTION stop_task_timer(
  p_task_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  session_duration INTEGER;
  total_elapsed INTEGER;
BEGIN
  -- Cerrar sesión activa
  UPDATE task_timer_sessions 
  SET end_time = NOW()
  WHERE task_id = p_task_id 
    AND user_id = p_user_id 
    AND end_time IS NULL;
  
  -- Obtener duración de la sesión que acabamos de cerrar
  SELECT duration INTO session_duration
  FROM task_timer_sessions
  WHERE task_id = p_task_id 
    AND user_id = p_user_id 
    AND end_time = (
      SELECT MAX(end_time) 
      FROM task_timer_sessions 
      WHERE task_id = p_task_id AND user_id = p_user_id
    );
  
  -- Si no se pudo obtener la duración, calcularla
  IF session_duration IS NULL THEN
    session_duration := 0;
  END IF;
  
  -- Calcular tiempo total acumulado
  SELECT COALESCE(SUM(duration), 0) INTO total_elapsed
  FROM task_timer_sessions
  WHERE task_id = p_task_id AND user_id = p_user_id AND duration IS NOT NULL;
  
  -- Actualizar estado del timer en la tarea
  UPDATE tasks SET
    timer_is_running = FALSE,
    timer_current_session_start = NULL,
    timer_last_session_end = NOW(),
    timer_total_elapsed = total_elapsed,
    updated_at = NOW()
  WHERE id = p_task_id;
  
  RETURN total_elapsed;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 6. CREAR FUNCIÓN PARA OBTENER ESTADÍSTICAS DE TIMER
-- ===============================

CREATE OR REPLACE FUNCTION get_task_timer_stats(
  p_task_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  total_elapsed INTEGER,
  is_running BOOLEAN,
  current_session_start TIMESTAMPTZ,
  session_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.timer_total_elapsed,
    t.timer_is_running,
    t.timer_current_session_start,
    (SELECT COUNT(*)::INTEGER FROM task_timer_sessions WHERE task_id = p_task_id AND user_id = p_user_id)
  FROM tasks t
  WHERE t.id = p_task_id;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 7. CREAR ÍNDICES PARA PERFORMANCE
-- ===============================

CREATE INDEX IF NOT EXISTS idx_task_timer_sessions_task_id ON task_timer_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_timer_sessions_user_id ON task_timer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_timer_sessions_task_user ON task_timer_sessions(task_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_timer_running ON tasks(timer_is_running) WHERE timer_is_running = TRUE;

-- ===============================
-- 8. COMENTARIOS PARA DOCUMENTACIÓN
-- ===============================

COMMENT ON COLUMN tasks.timer_total_elapsed IS 'Tiempo total acumulado del timer en segundos';
COMMENT ON COLUMN tasks.timer_is_running IS 'Si el timer está actualmente corriendo';
COMMENT ON COLUMN tasks.timer_current_session_start IS 'Inicio de la sesión actual (si está corriendo)';
COMMENT ON COLUMN tasks.timer_last_session_end IS 'Fin de la última sesión completada';

COMMENT ON TABLE task_timer_sessions IS 'Sesiones individuales del timer para cada tarea';
COMMENT ON COLUMN task_timer_sessions.duration IS 'Duración de la sesión en segundos (calculado automáticamente)';

-- ===============================
-- 9. VERIFICACIÓN FINAL
-- ===============================

-- Mostrar estructura actualizada
SELECT 'ESTRUCTURA ACTUALIZADA DE TABLA TASKS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' AND table_schema = 'public' 
  AND column_name LIKE '%timer%'
ORDER BY ordinal_position;

SELECT 'NUEVA TABLA TASK_TIMER_SESSIONS:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'task_timer_sessions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mensaje de éxito
SELECT '✅ Timer fields agregados exitosamente a la tabla tasks' as resultado;
SELECT '✅ Tabla task_timer_sessions creada exitosamente' as resultado;
SELECT '✅ Funciones de timer creadas: start_task_timer(), stop_task_timer(), get_task_timer_stats()' as resultado; 