-- Script para mover tareas de días pasados a días futuros
-- Para trabajar cómodamente con la app en fechas actuales

-- Mostrar fechas actuales antes del cambio
SELECT 
    '🔍 FECHAS ACTUALES (antes del cambio):' as info,
    DATE(due_date) as fecha_actual,
    COUNT(*) as num_tareas,
    STRING_AGG(title, ', ') as tareas
FROM tasks 
WHERE DATE(due_date) IN ('2025-07-14', '2025-07-15', '2025-07-16')
GROUP BY DATE(due_date)
ORDER BY DATE(due_date);

-- Mover las tareas:
-- Del día 14 al día 17 (avanzar 3 días)
UPDATE tasks 
SET due_date = due_date + INTERVAL '3 days',
    updated_at = NOW()
WHERE DATE(due_date) = '2025-07-14';

-- Del día 15 al día 18 (avanzar 3 días)  
UPDATE tasks 
SET due_date = due_date + INTERVAL '3 days',
    updated_at = NOW()
WHERE DATE(due_date) = '2025-07-15';

-- Del día 16 al día 19 (avanzar 3 días)
UPDATE tasks 
SET due_date = due_date + INTERVAL '3 days',
    updated_at = NOW()
WHERE DATE(due_date) = '2025-07-16';

-- Verificar el resultado
SELECT 
    '✅ FECHAS ACTUALIZADAS (después del cambio):' as info,
    DATE(due_date) as nueva_fecha,
    COUNT(*) as num_tareas,
    STRING_AGG(title, ', ') as tareas
FROM tasks 
WHERE DATE(due_date) IN ('2025-07-17', '2025-07-18', '2025-07-19')
GROUP BY DATE(due_date)
ORDER BY DATE(due_date);

-- Mostrar resumen de todos los cambios
SELECT 
    '📊 RESUMEN DE CAMBIOS:' as info,
    'Tareas movidas del 14-16 julio al 17-19 julio 2025' as descripcion,
    COUNT(*) as total_tareas_movidas
FROM tasks 
WHERE DATE(due_date) IN ('2025-07-17', '2025-07-18', '2025-07-19');

SELECT '🎉 Script completado - Las tareas ahora están en fechas futuras para trabajar cómodamente' as resultado; 