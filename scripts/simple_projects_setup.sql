-- =============================================
-- SETUP SIMPLE DE PROYECTOS
-- =============================================
-- Este script simplemente:
-- 1. Crea algunos proyectos básicos
-- 2. Agrupa las tareas existentes en esos proyectos
-- Sin complicaciones de usuarios, supervisores, etc.

-- =============================================
-- 1. CREAR TABLA PROJECTS SIMPLE
-- =============================================

-- Crear enum básico si no existe
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('programmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'El tipo project_status ya existe, continuando...';
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'El tipo priority_level ya existe, continuando...';
        -- Si ya existe, intentar agregar 'critical' si no está
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e 
            JOIN pg_type t ON e.enumtypid = t.oid 
            WHERE t.typname = 'priority_level' AND e.enumlabel = 'critical'
        ) THEN
            ALTER TYPE priority_level ADD VALUE 'critical';
        END IF;
END $$;

-- Crear tabla projects simple
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status project_status DEFAULT 'in_progress',
  priority priority_level DEFAULT 'medium',
  location TEXT NOT NULL,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  
  -- Estadísticas (se calculan automáticamente)
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  -- Supervisor simple
  supervisor_name TEXT DEFAULT 'Supervisor General',
  supervisor_email TEXT DEFAULT 'supervisor@empresa.com',
  
  -- Campos adicionales requeridos por la app
  estimated_duration INTEGER DEFAULT 30,
  actual_duration INTEGER,
  required_resources TEXT[] DEFAULT '{}',
  created_by UUID,
  assigned_to UUID[] DEFAULT '{}',
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de observaciones simple (requerida por la app)
CREATE TABLE IF NOT EXISTS supervisor_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  supervisor_name TEXT NOT NULL,
  supervisor_role TEXT NOT NULL,
  observation TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  priority priority_level NOT NULL DEFAULT 'medium',
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Añadir columna project_id a tasks si no existe
DO $$ BEGIN
    ALTER TABLE tasks ADD COLUMN project_id UUID REFERENCES projects(id);
EXCEPTION
    WHEN duplicate_column THEN 
        RAISE NOTICE 'La columna project_id ya existe en tasks';
END $$;

-- Habilitar RLS muy permisivo
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
CREATE POLICY "Anyone can view projects" ON projects FOR ALL USING (true);

ALTER TABLE supervisor_observations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view observations" ON supervisor_observations;
CREATE POLICY "Anyone can view observations" ON supervisor_observations FOR ALL USING (true);

-- =============================================
-- 2. CREAR PROYECTOS BASADOS EN TAREAS REALES
-- =============================================

-- Proyecto 1: Mantenimiento y Verificaciones
INSERT INTO projects (
  id,
  name,
  description,
  status,
  priority,
  location,
  supervisor_name,
  supervisor_email
) VALUES (
  'a1234567-89ab-cdef-0123-456789abcdef',
  'Mantenimiento y Verificaciones',
  'Mantenimiento preventivo de equipos y verificaciones con códigos QR',
  'in_progress',
  'high',
  'Oficinas y Equipos',
  'Responsable Mantenimiento',
  'mantenimiento@empresa.com'
)
ON CONFLICT (id) DO NOTHING;

-- Proyecto 2: Gestión de Oficinas
INSERT INTO projects (
  id,
  name,
  description,
  status,
  priority,
  location,
  supervisor_name,
  supervisor_email
) VALUES (
  'b1234567-89ab-cdef-0123-456789abcdef',
  'Gestión de Oficinas',
  'Limpieza, reorganización y preparación de espacios de trabajo',
  'in_progress',
  'medium',
  'Oficinas Principales',
  'Responsable Facility',
  'facility@empresa.com'
)
ON CONFLICT (id) DO NOTHING;

-- Proyecto 3: Eventos Corporativos
INSERT INTO projects (
  id,
  name,
  description,
  status,
  priority,
  location,
  supervisor_name,
  supervisor_email
) VALUES (
  'c1234567-89ab-cdef-0123-456789abcdef',
  'Eventos Corporativos',
  'Preparación y organización de eventos corporativos',
  'in_progress',
  'medium',
  'Salas de Reuniones',
  'Coordinador Eventos',
  'eventos@empresa.com'
)
ON CONFLICT (id) DO NOTHING;

-- Proyecto 4: Logística y Servicios
INSERT INTO projects (
  id,
  name,
  description,
  status,
  priority,
  location,
  supervisor_name,
  supervisor_email
) VALUES (
  'd1234567-89ab-cdef-0123-456789abcdef',
  'Logística y Servicios',
  'Gestión de residuos, reciclaje y distribución de paquetería',
  'in_progress',
  'medium',
  'Almacén y Distribución',
  'Responsable Logística',
  'logistica@empresa.com'
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. ASIGNAR TAREAS REALES A PROYECTOS
-- =============================================

-- Tareas de mantenimiento y verificaciones → Proyecto Mantenimiento y Verificaciones
UPDATE tasks SET project_id = 'a1234567-89ab-cdef-0123-456789abcdef' 
WHERE (
  title ILIKE '%mantenimiento preventivo%' OR 
  title ILIKE '%verificación%' OR 
  title ILIKE '%QR%' OR 
  title ILIKE '%equipos%' OR
  title ILIKE '%inspección%'
);

-- Tareas de oficinas → Proyecto Gestión de Oficinas
UPDATE tasks SET project_id = 'b1234567-89ab-cdef-0123-456789abcdef' 
WHERE (
  title ILIKE '%limpieza%' OR 
  title ILIKE '%oficinas%' OR 
  title ILIKE '%reorganización%' OR 
  title ILIKE '%almacén%' OR
  title ILIKE '%suministros%'
);

-- Tareas de eventos → Proyecto Eventos Corporativos
UPDATE tasks SET project_id = 'c1234567-89ab-cdef-0123-456789abcdef' 
WHERE (
  title ILIKE '%evento%' OR 
  title ILIKE '%corporativo%' OR 
  title ILIKE '%reuniones%' OR 
  title ILIKE '%preparación%' AND title ILIKE '%sala%'
);

-- Tareas de logística → Proyecto Logística y Servicios
UPDATE tasks SET project_id = 'd1234567-89ab-cdef-0123-456789abcdef' 
WHERE (
  title ILIKE '%residuos%' OR 
  title ILIKE '%reciclaje%' OR 
  title ILIKE '%paquetería%' OR 
  title ILIKE '%recogida%' OR
  title ILIKE '%distribución%'
);

-- El resto de tareas → Proyecto Mantenimiento (como fallback)
UPDATE tasks SET project_id = 'a1234567-89ab-cdef-0123-456789abcdef' 
WHERE project_id IS NULL;

-- =============================================
-- 4. AÑADIR ALGUNAS OBSERVACIONES SIMPLES
-- =============================================

-- Observaciones para los proyectos
INSERT INTO supervisor_observations (
  project_id,
  supervisor_name,
  supervisor_role,
  observation,
  priority,
  is_resolved
) VALUES 
(
  'a1234567-89ab-cdef-0123-456789abcdef',
  'Responsable Mantenimiento',
  'Supervisor',
  'Revisar que todas las verificaciones QR se completen correctamente',
  'medium',
  false
),
(
  'b1234567-89ab-cdef-0123-456789abcdef',
  'Responsable Facility',
  'Coordinador',
  'Excelente progreso en la limpieza de oficinas principales',
  'low',
  true
)
ON CONFLICT DO NOTHING;

-- =============================================
-- 5. CALCULAR ESTADÍSTICAS
-- =============================================

-- Actualizar contadores de tareas para cada proyecto
UPDATE projects SET
  total_tasks = (SELECT COUNT(*) FROM tasks WHERE project_id = projects.id),
  completed_tasks = (SELECT COUNT(*) FROM tasks WHERE project_id = projects.id AND status = 'completed'),
  updated_at = NOW();

-- Calcular porcentajes
UPDATE projects SET
  completion_percentage = CASE 
    WHEN total_tasks = 0 THEN 0
    ELSE (completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100
  END;

-- =============================================
-- 6. VERIFICACIÓN
-- =============================================

-- Mostrar resumen
SELECT 
  '🎉 CONFIGURACIÓN SIMPLE COMPLETADA' AS mensaje,
  (SELECT COUNT(*) FROM projects) AS proyectos_creados,
  (SELECT COUNT(*) FROM tasks WHERE project_id IS NOT NULL) AS tareas_asignadas,
  (SELECT COUNT(*) FROM tasks WHERE project_id IS NULL) AS tareas_sin_proyecto;

-- Mostrar proyectos con sus tareas
SELECT 
  p.name AS proyecto,
  p.total_tasks AS tareas_totales,
  p.completed_tasks AS tareas_completadas,
  p.completion_percentage AS porcentaje_completado,
  p.status AS estado
FROM projects p
ORDER BY p.total_tasks DESC;

-- Mostrar algunas tareas asignadas
SELECT 
  'EJEMPLO DE TAREAS ASIGNADAS:' AS info,
  p.name AS proyecto,
  t.title AS tarea,
  t.status AS estado_tarea
FROM tasks t
JOIN projects p ON t.project_id = p.id
LIMIT 10;

SELECT '✅ Script completado - Ve a la app para ver los proyectos' AS resultado; 