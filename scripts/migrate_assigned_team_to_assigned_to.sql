-- =============================================
-- MIGRACIÓN: SIMPLIFICAR ASSIGNED_TEAM Y ASSIGNED_TO
-- =============================================
-- Este script:
-- 1. Cambia assigned_to de UUID a UUID[]
-- 2. Elimina la columna assigned_team (ya no la usamos)
-- 3. Es seguro ejecutar múltiples veces

-- =============================================
-- 1. VERIFICAR ESTADO ACTUAL
-- =============================================

-- Mostrar estructura actual de la tabla
SELECT 
  'ESTRUCTURA ACTUAL DE PROJECTS:' AS info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'
AND column_name IN ('assigned_to', 'assigned_team')
ORDER BY ordinal_position;

-- =============================================
-- 2. MIGRAR assigned_to DE UUID A UUID[]
-- =============================================

-- Primero crear una columna temporal para el nuevo formato
DO $$ BEGIN
    ALTER TABLE projects ADD COLUMN assigned_to_new UUID[] DEFAULT '{}';
    RAISE NOTICE 'Columna temporal assigned_to_new creada';
EXCEPTION
    WHEN duplicate_column THEN
        RAISE NOTICE 'La columna assigned_to_new ya existe';
END $$;

-- Migrar datos existentes: si assigned_to tenía un UUID, ponerlo en el array
UPDATE projects 
SET assigned_to_new = CASE 
    WHEN assigned_to IS NOT NULL THEN ARRAY[assigned_to]
    ELSE '{}'
END
WHERE assigned_to_new = '{}'; -- Solo actualizar si no se ha migrado ya

-- Verificar migración
SELECT 
  'VERIFICACIÓN DE MIGRACIÓN:' AS info,
  name,
  assigned_to AS assigned_to_old,
  assigned_to_new
FROM projects
LIMIT 5;

-- =============================================
-- 3. REEMPLAZAR LA COLUMNA ORIGINAL
-- =============================================

-- Eliminar la columna antigua y renombrar la nueva
DO $$ BEGIN
    -- Eliminar columna antigua
    ALTER TABLE projects DROP COLUMN IF EXISTS assigned_to;
    RAISE NOTICE 'Columna assigned_to antigua eliminada';
    
    -- Renombrar la nueva columna
    ALTER TABLE projects RENAME COLUMN assigned_to_new TO assigned_to;
    RAISE NOTICE 'Columna assigned_to_new renombrada a assigned_to';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error en el reemplazo de columnas: %', SQLERRM;
END $$;

-- =============================================
-- 4. ELIMINAR assigned_team (YA NO SE USA)
-- =============================================

-- Eliminar la columna assigned_team ya que ahora usamos solo assigned_to como array
DO $$ BEGIN
    ALTER TABLE projects DROP COLUMN IF EXISTS assigned_team;
    RAISE NOTICE 'Columna assigned_team eliminada (ya no se usa)';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error eliminando assigned_team: %', SQLERRM;
END $$;

-- =============================================
-- 5. VERIFICACIÓN FINAL
-- =============================================

-- Mostrar estructura final
SELECT 
  'ESTRUCTURA FINAL DE PROJECTS:' AS info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'
AND column_name IN ('assigned_to', 'assigned_team')
ORDER BY ordinal_position;

-- Mostrar algunos datos migrados
SELECT 
  'DATOS MIGRADOS:' AS info,
  name,
  assigned_to,
  array_length(assigned_to, 1) as num_assigned_users
FROM projects
LIMIT 5;

-- Mensaje final
SELECT 
  '✅ MIGRACIÓN COMPLETADA' AS resultado,
  'assigned_to ahora es UUID[] y assigned_team fue eliminado' AS cambios; 