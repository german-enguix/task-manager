-- Script para crear tabla de proyectos y sus relaciones
-- Ejecutar este script después del setup inicial de Supabase

-- 1. Crear enum para estados de proyecto
CREATE TYPE project_status AS ENUM ('programmed', 'in_progress', 'completed', 'cancelled');

-- 2. Crear tabla de observaciones de supervisor
CREATE TABLE supervisor_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL, -- Se añadirá la FK después de crear projects
  supervisor_name TEXT NOT NULL,
  supervisor_role TEXT NOT NULL,
  observation TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  priority priority_level NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear tabla de proyectos
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status project_status DEFAULT 'programmed',
  priority priority_level NOT NULL,
  
  -- Lugar y fechas
  location TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  estimated_duration INTEGER NOT NULL, -- en días
  actual_duration INTEGER, -- en días
  
  -- Progreso y estadísticas
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  -- Supervisor
  supervisor_name TEXT NOT NULL,
  supervisor_email TEXT NOT NULL,
  
  -- Equipos y recursos (arrays de texto)
  assigned_team TEXT[] DEFAULT '{}',
  required_resources TEXT[] DEFAULT '{}',
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id)
);

-- 4. Añadir FK a supervisor_observations
ALTER TABLE supervisor_observations 
ADD CONSTRAINT fk_supervisor_observations_project 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 5. Modificar tabla tasks para referenciar projects
-- Primero añadir la nueva columna
ALTER TABLE tasks ADD COLUMN project_id UUID;

-- Luego añadir la FK (opcional, puede ser NULL para tareas sin proyecto)
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_project 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- 6. Crear función para actualizar estadísticas del proyecto
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar estadísticas del proyecto cuando cambian las tareas
  IF (TG_OP = 'DELETE') THEN
    UPDATE projects SET
      total_tasks = (SELECT COUNT(*) FROM tasks WHERE project_id = OLD.project_id),
      completed_tasks = (SELECT COUNT(*) FROM tasks WHERE project_id = OLD.project_id AND status = 'completed'),
      updated_at = NOW()
    WHERE id = OLD.project_id;
    
    -- Calcular porcentaje de completitud
    UPDATE projects SET
      completion_percentage = CASE 
        WHEN total_tasks = 0 THEN 0
        ELSE (completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100
      END
    WHERE id = OLD.project_id;
    
    RETURN OLD;
  ELSE
    UPDATE projects SET
      total_tasks = (SELECT COUNT(*) FROM tasks WHERE project_id = NEW.project_id),
      completed_tasks = (SELECT COUNT(*) FROM tasks WHERE project_id = NEW.project_id AND status = 'completed'),
      updated_at = NOW()
    WHERE id = NEW.project_id;
    
    -- Calcular porcentaje de completitud
    UPDATE projects SET
      completion_percentage = CASE 
        WHEN total_tasks = 0 THEN 0
        ELSE (completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100
      END
    WHERE id = NEW.project_id;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear triggers para mantener estadísticas actualizadas
CREATE TRIGGER trigger_update_project_stats_on_task_change
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  WHEN (NEW.project_id IS NOT NULL OR OLD.project_id IS NOT NULL)
  EXECUTE FUNCTION update_project_stats();

-- 8. Crear índices para performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_assigned_to ON projects(assigned_to);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_start_date ON projects(start_date);
CREATE INDEX idx_supervisor_observations_project_id ON supervisor_observations(project_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);

-- 9. Configurar Row Level Security para proyectos
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_observations ENABLE ROW LEVEL SECURITY;

-- Políticas para proyectos
CREATE POLICY "Users can view assigned projects" ON projects
  FOR SELECT USING (
    assigned_to = auth.uid() OR 
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins and project creators can update projects" ON projects
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para observaciones de supervisor
CREATE POLICY "Users can view project observations" ON supervisor_observations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id AND (
        p.assigned_to = auth.uid() OR 
        p.created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "Admins can manage observations" ON supervisor_observations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 10. Función para calcular duración actual del proyecto
CREATE OR REPLACE FUNCTION calculate_project_duration(project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  start_date TIMESTAMPTZ;
  end_date TIMESTAMPTZ;
  duration INTEGER;
BEGIN
  SELECT p.start_date, p.end_date INTO start_date, end_date
  FROM projects p WHERE p.id = project_id;
  
  IF end_date IS NULL THEN
    -- Si no está terminado, calcular duración hasta ahora
    duration := EXTRACT(DAY FROM NOW() - start_date);
  ELSE
    -- Si está terminado, calcular duración total
    duration := EXTRACT(DAY FROM end_date - start_date);
  END IF;
  
  RETURN GREATEST(duration, 0); -- No permitir duraciones negativas
END;
$$ LANGUAGE plpgsql; 