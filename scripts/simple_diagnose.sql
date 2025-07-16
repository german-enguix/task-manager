-- DIAGNÓSTICO SIMPLE Y SEGURO

-- 1. ¿Existe el enum user_role?
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') 
        THEN 'SÍ EXISTE' 
        ELSE 'NO EXISTE' 
    END as "¿Existe enum user_role?";

-- 2. Valores del enum user_role (solo si existe)
SELECT 
    enumlabel as "Valores en user_role"
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- 3. ¿Existe la tabla profiles?
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
        THEN 'SÍ EXISTE' 
        ELSE 'NO EXISTE' 
    END as "¿Existe tabla profiles?";

-- RESULTADO DEL DIAGNÓSTICO:
-- - Si user_role EXISTE pero NO tiene 'developer' → Necesitas fix_enum_and_setup.sql
-- - Si user_role NO EXISTE → Necesitas fix_enum_and_setup.sql  
-- - Si profiles NO EXISTE → Es normal, se creará después 