-- Script CORREGIDO para crear tags del sistema y asignarlas a las tareas existentes
-- Usa UUIDs válidos en lugar de strings
-- Ejecutar en el panel SQL de Supabase

DO $$
DECLARE
  -- Variables para almacenar los UUIDs de las tags
  tag_safety_id UUID := gen_random_uuid();
  tag_urgent_id UUID := gen_random_uuid();
  tag_maintenance_id UUID := gen_random_uuid();
  tag_inspection_id UUID := gen_random_uuid();
  tag_quality_id UUID := gen_random_uuid();
  tag_training_id UUID := gen_random_uuid();
  tag_equipment_id UUID := gen_random_uuid();
  tag_compliance_id UUID := gen_random_uuid();
  tag_documentation_id UUID := gen_random_uuid();
  tag_environmental_id UUID := gen_random_uuid();
  tag_security_id UUID := gen_random_uuid();
  tag_routine_id UUID := gen_random_uuid();
  tag_cleaning_id UUID := gen_random_uuid();
  tag_facility_id UUID := gen_random_uuid();
  tag_delivery_id UUID := gen_random_uuid();
  tag_event_id UUID := gen_random_uuid();
  
  -- Variable para iterar sobre tareas
  task_record RECORD;
BEGIN
  
  -- ===============================
  -- 1. INSERTAR TAGS DEL SISTEMA
  -- ===============================
  
  RAISE NOTICE 'Eliminando tags existentes...';
  DELETE FROM task_tags;
  DELETE FROM tags;
  
  RAISE NOTICE 'Creando tags del sistema con UUIDs válidos...';
  
  -- Insertar todas las tags del sistema con UUIDs válidos
  INSERT INTO tags (id, name, color, category, created_at) VALUES 
    (tag_safety_id, 'Seguridad', '#ff5722', 'Operaciones', NOW()),
    (tag_urgent_id, 'Urgente', '#f44336', 'Prioridad', NOW()),
    (tag_maintenance_id, 'Mantenimiento', '#2196f3', 'Operaciones', NOW()),
    (tag_inspection_id, 'Inspección', '#9c27b0', 'Calidad', NOW()),
    (tag_quality_id, 'Control de Calidad', '#4caf50', 'Calidad', NOW()),
    (tag_training_id, 'Capacitación', '#ff9800', 'RRHH', NOW()),
    (tag_equipment_id, 'Equipamiento', '#607d8b', 'Operaciones', NOW()),
    (tag_compliance_id, 'Cumplimiento', '#795548', 'Legal', NOW()),
    (tag_documentation_id, 'Documentación', '#3f51b5', 'Administración', NOW()),
    (tag_environmental_id, 'Ambiental', '#8bc34a', 'Sostenibilidad', NOW()),
    (tag_security_id, 'Seguridad Industrial', '#e91e63', 'Operaciones', NOW()),
    (tag_routine_id, 'Rutina', '#9e9e9e', 'Frecuencia', NOW()),
    (tag_cleaning_id, 'Limpieza', '#00bcd4', 'Operaciones', NOW()),
    (tag_facility_id, 'Instalaciones', '#795548', 'Infraestructura', NOW()),
    (tag_delivery_id, 'Entrega', '#ff5722', 'Logística', NOW()),
    (tag_event_id, 'Evento', '#e91e63', 'Actividades', NOW());
  
  RAISE NOTICE 'Tags creadas exitosamente. Total: 16';
  
  -- ===============================
  -- 2. ASIGNAR TAGS A TAREAS EXISTENTES
  -- ===============================
  
  RAISE NOTICE 'Iniciando asignación automática de tags a tareas...';
  
  -- Recorrer todas las tareas existentes y asignar tags apropiadas
  FOR task_record IN 
    SELECT id, title, description, location, project_name 
    FROM tasks 
    ORDER BY created_at
  LOOP
    RAISE NOTICE 'Procesando tarea: %', task_record.title;
    
    -- TAGS BASADAS EN PROYECTO
    CASE 
      WHEN task_record.project_name ILIKE '%Limpieza%' THEN
        -- Tareas de limpieza
        INSERT INTO task_tags (task_id, tag_id) VALUES 
          (task_record.id, tag_cleaning_id),
          (task_record.id, tag_routine_id),
          (task_record.id, tag_environmental_id);
        RAISE NOTICE '  -> Asignadas tags de LIMPIEZA';
          
      WHEN task_record.project_name ILIKE '%Mantenimiento%' THEN
        -- Tareas de mantenimiento
        INSERT INTO task_tags (task_id, tag_id) VALUES 
          (task_record.id, tag_maintenance_id),
          (task_record.id, tag_equipment_id),
          (task_record.id, tag_safety_id);
        RAISE NOTICE '  -> Asignadas tags de MANTENIMIENTO';
          
      WHEN task_record.project_name ILIKE '%Facility%' OR task_record.project_name ILIKE '%Sesame%' THEN
        -- Tareas de facilities
        INSERT INTO task_tags (task_id, tag_id) VALUES 
          (task_record.id, tag_facility_id),
          (task_record.id, tag_event_id),
          (task_record.id, tag_quality_id);
        RAISE NOTICE '  -> Asignadas tags de FACILITY';
          
      ELSE
        -- Tags por defecto
        INSERT INTO task_tags (task_id, tag_id) VALUES 
          (task_record.id, tag_routine_id);
        RAISE NOTICE '  -> Asignada tag por DEFECTO';
    END CASE;
    
    -- TAGS BASADAS EN CONTENIDO DEL TÍTULO/DESCRIPCIÓN
    
    -- Limpieza y mantenimiento
    IF task_record.title ILIKE '%limpi%' OR task_record.description ILIKE '%limpi%' THEN
      INSERT INTO task_tags (task_id, tag_id) VALUES (task_record.id, tag_cleaning_id)
      ON CONFLICT (task_id, tag_id) DO NOTHING;
      RAISE NOTICE '  -> Tag LIMPIEZA por contenido';
    END IF;
    
    -- Eventos y coordinación
    IF task_record.title ILIKE '%evento%' OR task_record.title ILIKE '%coordin%' OR 
       task_record.description ILIKE '%evento%' OR task_record.description ILIKE '%coordin%' THEN
      INSERT INTO task_tags (task_id, tag_id) VALUES (task_record.id, tag_event_id)
      ON CONFLICT (task_id, tag_id) DO NOTHING;
      RAISE NOTICE '  -> Tag EVENTO por contenido';
    END IF;
    
    -- Entregas y paquetes
    IF task_record.title ILIKE '%paquete%' OR task_record.title ILIKE '%entrega%' OR 
       task_record.description ILIKE '%paquete%' OR task_record.description ILIKE '%entrega%' THEN
      INSERT INTO task_tags (task_id, tag_id) VALUES (task_record.id, tag_delivery_id)
      ON CONFLICT (task_id, tag_id) DO NOTHING;
      RAISE NOTICE '  -> Tag ENTREGA por contenido';
    END IF;
    
    -- Mantenimiento
    IF task_record.title ILIKE '%mantenimiento%' OR task_record.title ILIKE '%reparar%' OR 
       task_record.description ILIKE '%mantenimiento%' OR task_record.description ILIKE '%reparar%' THEN
      INSERT INTO task_tags (task_id, tag_id) VALUES (task_record.id, tag_maintenance_id)
      ON CONFLICT (task_id, tag_id) DO NOTHING;
      RAISE NOTICE '  -> Tag MANTENIMIENTO por contenido';
    END IF;
    
    -- Seguridad
    IF task_record.title ILIKE '%seguridad%' OR task_record.description ILIKE '%seguridad%' THEN
      INSERT INTO task_tags (task_id, tag_id) VALUES (task_record.id, tag_safety_id)
      ON CONFLICT (task_id, tag_id) DO NOTHING;
      RAISE NOTICE '  -> Tag SEGURIDAD por contenido';
    END IF;
    
    -- Inspección y verificación
    IF task_record.title ILIKE '%inspecci%' OR task_record.title ILIKE '%verific%' OR 
       task_record.description ILIKE '%inspecci%' OR task_record.description ILIKE '%verific%' THEN
      INSERT INTO task_tags (task_id, tag_id) VALUES (task_record.id, tag_inspection_id)
      ON CONFLICT (task_id, tag_id) DO NOTHING;
      RAISE NOTICE '  -> Tag INSPECCIÓN por contenido';
    END IF;
    
    -- Control de calidad
    IF task_record.title ILIKE '%calidad%' OR task_record.description ILIKE '%calidad%' THEN
      INSERT INTO task_tags (task_id, tag_id) VALUES (task_record.id, tag_quality_id)
      ON CONFLICT (task_id, tag_id) DO NOTHING;
      RAISE NOTICE '  -> Tag CALIDAD por contenido';
    END IF;
    
    -- Documentación
    IF task_record.title ILIKE '%documento%' OR task_record.title ILIKE '%informe%' OR 
       task_record.description ILIKE '%documento%' OR task_record.description ILIKE '%informe%' THEN
      INSERT INTO task_tags (task_id, tag_id) VALUES (task_record.id, tag_documentation_id)
      ON CONFLICT (task_id, tag_id) DO NOTHING;
      RAISE NOTICE '  -> Tag DOCUMENTACIÓN por contenido';
    END IF;
    
    -- TAGS BASADAS EN UBICACIÓN
    IF task_record.location ILIKE '%Base%' THEN
      INSERT INTO task_tags (task_id, tag_id) VALUES (task_record.id, tag_facility_id)
      ON CONFLICT (task_id, tag_id) DO NOTHING;
      RAISE NOTICE '  -> Tag INSTALACIONES por ubicación Base';
    END IF;
    
    IF task_record.location ILIKE '%Marina%' OR task_record.location ILIKE '%Valencia%' THEN
      INSERT INTO task_tags (task_id, tag_id) VALUES (task_record.id, tag_environmental_id)
      ON CONFLICT (task_id, tag_id) DO NOTHING;
      RAISE NOTICE '  -> Tag AMBIENTAL por ubicación Marina/Valencia';
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'Asignación de tags completada exitosamente';
  
END $$;

-- ===============================
-- 3. VERIFICACIÓN Y ESTADÍSTICAS
-- ===============================

-- Mostrar estadísticas de tags
SELECT 'RESUMEN DE TAGS CREADAS:' as info;
SELECT 
  t.name as tag_name,
  t.category,
  t.color,
  COUNT(tt.task_id) as tareas_asignadas
FROM tags t
LEFT JOIN task_tags tt ON t.id = tt.tag_id
GROUP BY t.id, t.name, t.category, t.color
ORDER BY t.category, t.name;

-- Mostrar tareas con sus tags
SELECT 'TAREAS CON TAGS ASIGNADAS:' as info;
SELECT 
  t.title as tarea,
  t.project_name as proyecto,
  STRING_AGG(tags.name, ', ' ORDER BY tags.name) as tags_asignadas,
  COUNT(tags.id) as total_tags
FROM tasks t
LEFT JOIN task_tags tt ON t.id = tt.task_id
LEFT JOIN tags ON tt.tag_id = tags.id
GROUP BY t.id, t.title, t.project_name
ORDER BY t.created_at;

-- Contar tags por categoría
SELECT 'DISTRIBUCIÓN POR CATEGORÍA:' as info;
SELECT 
  category,
  COUNT(*) as total_tags,
  STRING_AGG(name, ', ' ORDER BY name) as tags_en_categoria
FROM tags
GROUP BY category
ORDER BY category;

-- Verificar que todas las tareas tienen al menos una tag
SELECT 'VERIFICACIÓN TAREAS SIN TAGS:' as info;
SELECT 
  COUNT(*) as tareas_sin_tags,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todas las tareas tienen tags asignadas'
    ELSE '⚠️ Hay tareas sin tags'
  END as resultado
FROM tasks t
LEFT JOIN task_tags tt ON t.id = tt.task_id
WHERE tt.task_id IS NULL;

-- Mensajes de éxito
SELECT '✅ SISTEMA DE TAGS CONFIGURADO EXITOSAMENTE' as resultado;
SELECT '🏷️ 16 tags creadas con UUIDs válidos' as resultado;
SELECT '🎯 Tags asignadas automáticamente según proyecto, contenido y ubicación' as resultado;
SELECT '📊 Sistema listo para usar en la aplicación' as resultado; 