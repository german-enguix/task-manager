-- Script para actualizar las fechas de las tareas de Zizi de 2025 a 2024
-- Para que aparezcan inmediatamente en la app sin navegar a 2025

-- Cambiar las fechas de julio 2025 a julio 2024
UPDATE tasks 
SET due_date = due_date - INTERVAL '1 year'
WHERE DATE(due_date) IN ('2025-07-14', '2025-07-15', '2025-07-16');

-- Verificar el resultado
SELECT 
    '✅ FECHAS ACTUALIZADAS:' as info,
    title,
    DATE(due_date) as nueva_fecha,
    project_name,
    location
FROM tasks 
WHERE DATE(due_date) IN ('2024-07-14', '2024-07-15', '2024-07-16')
ORDER BY due_date, title;

SELECT 'Script completado - Las tareas ahora aparecen en julio 2024' as resultado; 