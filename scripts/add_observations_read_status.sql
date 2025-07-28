-- =============================================
-- AÑADIR ESTADO "LEÍDO" A OBSERVACIONES
-- =============================================
-- Este script añade funcionalidad para marcar observaciones como leídas

-- =============================================
-- 1. VERIFICAR ESTADO ACTUAL
-- =============================================

-- Mostrar estructura actual de supervisor_observations
SELECT 
  'ESTRUCTURA ACTUAL DE SUPERVISOR_OBSERVATIONS:' AS info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'supervisor_observations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 2. AÑADIR CAMPO is_read
-- =============================================

-- Añadir columna is_read para controlar si la observación ha sido leída
DO $$ BEGIN
    ALTER TABLE supervisor_observations 
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
    
    RAISE NOTICE 'Columna is_read añadida a supervisor_observations';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error añadiendo is_read: %', SQLERRM;
END $$;

-- Añadir columna read_at para timestamp de cuándo se marcó como leída
DO $$ BEGIN
    ALTER TABLE supervisor_observations 
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
    
    RAISE NOTICE 'Columna read_at añadida a supervisor_observations';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error añadiendo read_at: %', SQLERRM;
END $$;

-- =============================================
-- 3. ACTUALIZAR OBSERVACIONES RESUELTAS COMO LEÍDAS
-- =============================================

-- Marcar todas las observaciones ya resueltas como leídas automáticamente
UPDATE supervisor_observations 
SET is_read = TRUE, 
    read_at = resolved_at
WHERE is_resolved = TRUE 
  AND resolved_at IS NOT NULL 
  AND (is_read IS NULL OR is_read = FALSE);

-- Obtener estadísticas de la actualización
DO $$ 
DECLARE
    observaciones_marcadas INTEGER;
BEGIN
    GET DIAGNOSTICS observaciones_marcadas = ROW_COUNT;
    RAISE NOTICE 'Observaciones resueltas marcadas como leídas: %', observaciones_marcadas;
END $$;

-- =============================================
-- 4. CREAR FUNCIÓN PARA MARCAR COMO LEÍDA
-- =============================================

-- Función para marcar una observación como leída/no leída
CREATE OR REPLACE FUNCTION mark_observation_as_read(
    observation_id UUID,
    read_status BOOLEAN DEFAULT TRUE
) RETURNS BOOLEAN AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    UPDATE supervisor_observations 
    SET 
        is_read = read_status,
        read_at = CASE 
            WHEN read_status = TRUE THEN NOW() 
            ELSE NULL 
        END
    WHERE id = observation_id;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    IF updated_rows > 0 THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos para usar la función
GRANT EXECUTE ON FUNCTION mark_observation_as_read(UUID, BOOLEAN) TO authenticated;

-- =============================================
-- 5. VERIFICACIÓN FINAL
-- =============================================

-- Mostrar estructura final
SELECT 
  'ESTRUCTURA FINAL DE SUPERVISOR_OBSERVATIONS:' AS info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'supervisor_observations' AND table_schema = 'public'
AND column_name IN ('is_read', 'read_at', 'is_resolved', 'observation')
ORDER BY ordinal_position;

-- Mostrar estadísticas de observaciones
SELECT 
  'ESTADÍSTICAS DE OBSERVACIONES:' AS info,
  COUNT(*) AS total_observaciones,
  COUNT(*) FILTER (WHERE is_read = TRUE) AS observaciones_leidas,
  COUNT(*) FILTER (WHERE is_read = FALSE OR is_read IS NULL) AS observaciones_pendientes,
  COUNT(*) FILTER (WHERE is_resolved = TRUE) AS observaciones_resueltas,
  COUNT(*) FILTER (WHERE is_resolved = FALSE) AS observaciones_activas
FROM supervisor_observations;

-- Mostrar observaciones por proyecto
SELECT 
  'OBSERVACIONES POR PROYECTO:' AS info,
  p.name AS proyecto,
  COUNT(so.*) AS total_observaciones,
  COUNT(*) FILTER (WHERE so.is_read = TRUE) AS leidas,
  COUNT(*) FILTER (WHERE so.is_read = FALSE OR so.is_read IS NULL) AS pendientes,
  COUNT(*) FILTER (WHERE so.is_resolved = FALSE) AS activas_no_resueltas
FROM projects p
LEFT JOIN supervisor_observations so ON p.id = so.project_id
GROUP BY p.id, p.name
HAVING COUNT(so.*) > 0
ORDER BY pendientes DESC, p.name;

-- Mensaje final
SELECT 
  '✅ FUNCIONALIDAD DE LECTURA AÑADIDA' AS resultado,
  'Campo is_read y read_at añadidos' AS cambio_1,
  'Función mark_observation_as_read() creada' AS cambio_2,
  'Observaciones resueltas marcadas como leídas' AS cambio_3; 