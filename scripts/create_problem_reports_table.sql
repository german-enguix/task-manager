-- Script para crear tabla de reportes de problemas de tareas
-- Ejecutar en el panel SQL de Supabase

-- ===============================
-- 1. CREAR ENUM PARA TIPOS DE REPORTE
-- ===============================

-- Crear enum para tipos de reporte de problemas
DO $$ BEGIN
    CREATE TYPE problem_report_type AS ENUM (
        'blocking_issue',      -- Problema que bloquea completamente la tarea
        'missing_tools',       -- Herramientas o equipos faltantes
        'unsafe_conditions',   -- Condiciones inseguras de trabajo
        'technical_issue',     -- Problema técnico
        'access_denied',       -- Falta de acceso a ubicación o recursos
        'material_shortage',   -- Falta de materiales
        'weather_conditions',  -- Condiciones climáticas adversas
        'other'               -- Otro problema
    );
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'El tipo problem_report_type ya existe, continuando...';
END $$;

-- Crear enum para severidad del problema
DO $$ BEGIN
    CREATE TYPE problem_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'El tipo problem_severity ya existe, continuando...';
END $$;

-- ===============================
-- 2. CREAR TABLA DE REPORTES DE PROBLEMAS
-- ===============================

-- Crear tabla para reportes de problemas de tareas
CREATE TABLE IF NOT EXISTS task_problem_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type problem_report_type NOT NULL,
  severity problem_severity NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================
-- 3. HABILITAR ROW LEVEL SECURITY
-- ===============================

-- Habilitar RLS en la tabla de reportes de problemas
ALTER TABLE task_problem_reports ENABLE ROW LEVEL SECURITY;

-- ===============================
-- 4. CREAR POLÍTICAS DE SEGURIDAD
-- ===============================

-- Política: Los usuarios pueden ver reportes de sus tareas asignadas
CREATE POLICY "task_problem_reports_select_own_tasks" ON task_problem_reports
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks 
      WHERE assigned_to = auth.uid()
    )
  );

-- Política: Los usuarios pueden insertar reportes en sus tareas
CREATE POLICY "task_problem_reports_insert_own_tasks" ON task_problem_reports
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    task_id IN (
      SELECT id FROM tasks 
      WHERE assigned_to = auth.uid()
    )
  );

-- Política: Los usuarios pueden actualizar sus propios reportes
CREATE POLICY "task_problem_reports_update_own" ON task_problem_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: Solo el usuario que reportó puede eliminar el reporte
CREATE POLICY "task_problem_reports_delete_own" ON task_problem_reports
  FOR DELETE USING (auth.uid() = user_id);

-- ===============================
-- 5. CREAR ÍNDICES PARA PERFORMANCE
-- ===============================

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_task_problem_reports_task_id ON task_problem_reports(task_id);
CREATE INDEX IF NOT EXISTS idx_task_problem_reports_user_id ON task_problem_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_task_problem_reports_created_at ON task_problem_reports(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_problem_reports_severity ON task_problem_reports(severity);
CREATE INDEX IF NOT EXISTS idx_task_problem_reports_type ON task_problem_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_task_problem_reports_task_user ON task_problem_reports(task_id, user_id);

-- ===============================
-- 6. CREAR FUNCIÓN PARA ACTUALIZAR updated_at
-- ===============================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_task_problem_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS trigger_update_task_problem_reports_updated_at ON task_problem_reports;
CREATE TRIGGER trigger_update_task_problem_reports_updated_at
  BEFORE UPDATE ON task_problem_reports
  FOR EACH ROW EXECUTE FUNCTION update_task_problem_reports_updated_at();

-- ===============================
-- 7. COMENTARIOS PARA DOCUMENTACIÓN
-- ===============================

COMMENT ON TABLE task_problem_reports IS 'Reportes de problemas en tareas';
COMMENT ON COLUMN task_problem_reports.report_type IS 'Tipo de problema reportado';
COMMENT ON COLUMN task_problem_reports.severity IS 'Severidad del problema: low, medium, high, critical';
COMMENT ON COLUMN task_problem_reports.title IS 'Título descriptivo del problema';
COMMENT ON COLUMN task_problem_reports.description IS 'Descripción detallada del problema';
COMMENT ON COLUMN task_problem_reports.reported_at IS 'Fecha y hora cuando se reportó el problema';
COMMENT ON COLUMN task_problem_reports.resolved_at IS 'Fecha y hora cuando se resolvió el problema';
COMMENT ON COLUMN task_problem_reports.resolution IS 'Descripción de cómo se resolvió el problema';

-- ===============================
-- 8. DATOS DE CONFIGURACIÓN
-- ===============================

-- Crear función para obtener información de tipos de reportes
CREATE OR REPLACE FUNCTION get_problem_report_types_info()
RETURNS TABLE(
  type problem_report_type,
  title TEXT,
  description TEXT,
  icon TEXT,
  suggested_severity problem_severity
) AS $$
BEGIN
  RETURN QUERY VALUES
    ('blocking_issue'::problem_report_type, 'Problema que bloquea la tarea', 'No puedo continuar con la tarea debido a este problema', 'block-helper', 'high'::problem_severity),
    ('missing_tools'::problem_report_type, 'Herramientas faltantes', 'Faltan herramientas o equipos necesarios para la tarea', 'toolbox-outline', 'medium'::problem_severity),
    ('unsafe_conditions'::problem_report_type, 'Condiciones inseguras', 'Las condiciones de trabajo no son seguras', 'shield-alert-outline', 'critical'::problem_severity),
    ('technical_issue'::problem_report_type, 'Problema técnico', 'Error técnico o mal funcionamiento de equipos', 'tools', 'medium'::problem_severity),
    ('access_denied'::problem_report_type, 'Acceso denegado', 'No tengo acceso a la ubicación o recursos necesarios', 'lock-outline', 'high'::problem_severity),
    ('material_shortage'::problem_report_type, 'Falta de materiales', 'Materiales insuficientes o faltantes', 'package-variant', 'medium'::problem_severity),
    ('weather_conditions'::problem_report_type, 'Condiciones climáticas', 'El clima impide realizar la tarea de forma segura', 'weather-lightning-rainy', 'medium'::problem_severity),
    ('other'::problem_report_type, 'Otro problema', 'Problema no categorizado en las opciones anteriores', 'alert-circle-outline', 'low'::problem_severity);
END;
$$ LANGUAGE plpgsql; 