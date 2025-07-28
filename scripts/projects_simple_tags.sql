-- =============================================
-- PROYECTOS: AÑADIR TAGS Y ELIMINAR RECURSOS
-- =============================================
-- Este script:
-- 1. Elimina la columna required_resources de projects
-- 2. Añade columna tag_ids UUID[] para las tags
-- 3. Asigna algunas tags automáticamente a los proyectos existentes

-- =============================================
-- 1. VERIFICAR ESTADO ACTUAL
-- =============================================

-- Mostrar estructura actual de projects
SELECT 
  'ESTRUCTURA ACTUAL DE PROJECTS:' AS info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'
AND column_name IN ('required_resources', 'assigned_to', 'tag_ids')
ORDER BY ordinal_position;

-- Mostrar tags disponibles
SELECT 
  'TAGS DISPONIBLES:' AS info,
  COUNT(*) AS total_tags,
  array_agg(name ORDER BY name) AS nombres_tags
FROM tags
LIMIT 1;

-- =============================================
-- 2. MODIFICAR TABLA PROJECTS
-- =============================================

-- Eliminar la columna required_resources
DO $$ BEGIN
    ALTER TABLE projects DROP COLUMN IF EXISTS required_resources;
    RAISE NOTICE 'Columna required_resources eliminada de projects';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error eliminando required_resources: %', SQLERRM;
END $$;

-- Añadir columna tag_ids para las tags del proyecto
DO $$ BEGIN
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS tag_ids UUID[] DEFAULT '{}';
    RAISE NOTICE 'Columna tag_ids añadida a projects';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error añadiendo tag_ids: %', SQLERRM;
END $$;

-- =============================================
-- 3. ASIGNAR TAGS AUTOMÁTICAMENTE
-- =============================================

-- Asignar tags a proyectos basándose en sus tareas
DO $$ 
DECLARE
    proyecto_record RECORD;
    tags_del_proyecto UUID[];
BEGIN
    RAISE NOTICE 'Iniciando asignación automática de tags a proyectos...';
    
    -- Para cada proyecto
    FOR proyecto_record IN 
        SELECT id, name FROM projects
    LOOP
        RAISE NOTICE 'Procesando proyecto: %', proyecto_record.name;
        
        -- Obtener tags únicas de todas las tareas de este proyecto
        SELECT array_agg(DISTINCT t.id)
        INTO tags_del_proyecto
        FROM tags t
        JOIN task_tags tt ON t.id = tt.tag_id
        JOIN tasks ta ON tt.task_id = ta.id
        WHERE ta.project_id = proyecto_record.id;
        
        -- Actualizar el proyecto con sus tags
        IF tags_del_proyecto IS NOT NULL AND array_length(tags_del_proyecto, 1) > 0 THEN
            UPDATE projects 
            SET tag_ids = tags_del_proyecto,
                updated_at = NOW()
            WHERE id = proyecto_record.id;
            
            RAISE NOTICE 'Proyecto "%" actualizado con % tags', 
                proyecto_record.name, array_length(tags_del_proyecto, 1);
        ELSE
            RAISE NOTICE 'Proyecto "%" no tiene tareas con tags', proyecto_record.name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Asignación automática de tags completada';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error en asignación de tags: %', SQLERRM;
END $$;

-- =============================================
-- 4. ASIGNAR TAGS ADICIONALES POR TIPO
-- =============================================

-- Asignar tags específicas según el nombre del proyecto
DO $$
DECLARE
    mantenimiento_tag_id UUID;
    oficina_tag_id UUID;
    evento_tag_id UUID;
    logistica_tag_id UUID;
BEGIN
    -- Buscar tags existentes por nombre
    SELECT id INTO mantenimiento_tag_id FROM tags WHERE name ILIKE '%mantenimiento%' LIMIT 1;
    SELECT id INTO oficina_tag_id FROM tags WHERE name ILIKE '%oficina%' OR name ILIKE '%administr%' LIMIT 1;
    SELECT id INTO evento_tag_id FROM tags WHERE name ILIKE '%evento%' LIMIT 1;
    SELECT id INTO logistica_tag_id FROM tags WHERE name ILIKE '%logistic%' OR name ILIKE '%entrega%' LIMIT 1;
    
    -- Proyecto de mantenimiento
    IF mantenimiento_tag_id IS NOT NULL THEN
        UPDATE projects 
        SET tag_ids = array_append(COALESCE(tag_ids, '{}'), mantenimiento_tag_id),
            updated_at = NOW()
        WHERE (name ILIKE '%mantenimiento%' OR name ILIKE '%verificac%')
          AND NOT (mantenimiento_tag_id = ANY(COALESCE(tag_ids, '{}')));
        
        RAISE NOTICE 'Tag mantenimiento asignada a proyectos de mantenimiento';
    END IF;
    
    -- Proyecto de oficinas
    IF oficina_tag_id IS NOT NULL THEN
        UPDATE projects 
        SET tag_ids = array_append(COALESCE(tag_ids, '{}'), oficina_tag_id),
            updated_at = NOW()
        WHERE (name ILIKE '%oficina%' OR name ILIKE '%gestión%')
          AND NOT (oficina_tag_id = ANY(COALESCE(tag_ids, '{}')));
        
        RAISE NOTICE 'Tag oficina asignada a proyectos de oficina';
    END IF;
    
    -- Proyecto de eventos
    IF evento_tag_id IS NOT NULL THEN
        UPDATE projects 
        SET tag_ids = array_append(COALESCE(tag_ids, '{}'), evento_tag_id),
            updated_at = NOW()
        WHERE (name ILIKE '%evento%' OR name ILIKE '%corporativo%')
          AND NOT (evento_tag_id = ANY(COALESCE(tag_ids, '{}')));
        
        RAISE NOTICE 'Tag evento asignada a proyectos de eventos';
    END IF;
    
    -- Proyecto de logística
    IF logistica_tag_id IS NOT NULL THEN
        UPDATE projects 
        SET tag_ids = array_append(COALESCE(tag_ids, '{}'), logistica_tag_id),
            updated_at = NOW()
        WHERE (name ILIKE '%logistic%' OR name ILIKE '%servicios%')
          AND NOT (logistica_tag_id = ANY(COALESCE(tag_ids, '{}')));
        
        RAISE NOTICE 'Tag logística asignada a proyectos de logística';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error asignando tags específicas: %', SQLERRM;
END $$;

-- =============================================
-- 5. VERIFICACIÓN FINAL
-- =============================================

-- Mostrar estructura final de projects
SELECT 
  'ESTRUCTURA FINAL DE PROJECTS:' AS info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'
AND column_name IN ('required_resources', 'assigned_to', 'tag_ids', 'name')
ORDER BY ordinal_position;

-- Mostrar proyectos con sus tags
SELECT 
  'PROYECTOS CON TAGS:' AS info,
  p.name AS proyecto,
  array_length(p.tag_ids, 1) AS num_tags,
  p.tag_ids AS tag_ids_array
FROM projects p
ORDER BY p.name;

-- Mostrar detalle de tags por proyecto (con nombres)
WITH project_tags_expanded AS (
  SELECT 
    p.id,
    p.name AS proyecto,
    unnest(COALESCE(p.tag_ids, '{}')) AS tag_id
  FROM projects p
  WHERE array_length(p.tag_ids, 1) > 0
)
SELECT 
  'DETALLE TAGS POR PROYECTO:' AS info,
  pte.proyecto,
  t.name AS tag_nombre,
  t.color AS color_tag,
  t.category AS categoria_tag
FROM project_tags_expanded pte
JOIN tags t ON pte.tag_id = t.id
ORDER BY pte.proyecto, t.category, t.name;

-- Estadísticas finales
SELECT 
  'ESTADÍSTICAS FINALES:' AS info,
  (SELECT COUNT(*) FROM projects) AS total_proyectos,
  (SELECT COUNT(*) FROM projects WHERE array_length(tag_ids, 1) > 0) AS proyectos_con_tags,
  (SELECT ROUND(AVG(array_length(tag_ids, 1)::numeric), 2) FROM projects WHERE array_length(tag_ids, 1) > 0) AS promedio_tags_por_proyecto,
  (SELECT COUNT(*) FROM tags) AS tags_totales_disponibles;

-- Mensaje final
SELECT 
  '✅ ACTUALIZACIÓN COMPLETADA' AS resultado,
  'required_resources eliminado y tag_ids añadido' AS cambios,
  'Los proyectos ahora tienen array de UUIDs de tags existentes' AS nota; 