-- =============================================
-- AÑADIR TIPO QR AL ENUM EVIDENCE_TYPE
-- =============================================
-- Este script añade 'qr' al enum evidence_type
-- para soportar el nuevo QR Scanner
-- =============================================

DO $$
DECLARE
    rec RECORD;
BEGIN

-- =============================================
-- 1. VERIFICAR ENUM ACTUAL
-- =============================================

RAISE NOTICE '🔍 Verificando enum evidence_type actual...';

-- Mostrar valores actuales
RAISE NOTICE 'Valores actuales del enum evidence_type:';
FOR rec IN (
    SELECT enumlabel 
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid 
    WHERE t.typname = 'evidence_type'
    ORDER BY e.enumsortorder
) LOOP
    RAISE NOTICE '   • %', rec.enumlabel;
END LOOP;

-- =============================================
-- 2. AÑADIR VALOR 'QR' SI NO EXISTE
-- =============================================

-- Verificar si 'qr' ya existe
IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid 
    WHERE t.typname = 'evidence_type' 
    AND e.enumlabel = 'qr'
) THEN
    RAISE NOTICE '➕ Añadiendo valor ''qr'' al enum evidence_type...';
    
    -- Añadir 'qr' al enum
    ALTER TYPE evidence_type ADD VALUE 'qr';
    
    RAISE NOTICE '✅ Valor ''qr'' añadido exitosamente';
ELSE
    RAISE NOTICE '⚠️ El valor ''qr'' ya existe en evidence_type';
END IF;

-- =============================================
-- 3. VERIFICAR ENUM ACTUALIZADO
-- =============================================

RAISE NOTICE '';
RAISE NOTICE '🔍 Verificando enum evidence_type actualizado...';

-- Mostrar todos los valores después de la actualización
RAISE NOTICE 'Valores finales del enum evidence_type:';
FOR rec IN (
    SELECT enumlabel 
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid 
    WHERE t.typname = 'evidence_type'
    ORDER BY e.enumsortorder
) LOOP
    RAISE NOTICE '   • %', rec.enumlabel;
END LOOP;

-- =============================================
-- 4. CONFIRMACIÓN FINAL
-- =============================================

RAISE NOTICE '';
RAISE NOTICE '🎉 ¡ENUM EVIDENCE_TYPE ACTUALIZADO!';
RAISE NOTICE '';
RAISE NOTICE '✅ AHORA PUEDES:';
RAISE NOTICE '   1. Ejecutar add_qr_task_today.sql';
RAISE NOTICE '   2. Crear subtareas con evidencia tipo ''qr''';
RAISE NOTICE '   3. Usar el QR Scanner en la app';
RAISE NOTICE '';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error actualizando enum evidence_type: %', SQLERRM;
        
END $$; 