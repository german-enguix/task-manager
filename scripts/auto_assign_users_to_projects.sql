-- =============================================
-- AUTO-ASIGNAR USUARIOS A PROYECTOS
-- =============================================
-- Este script asigna automáticamente usuarios a proyectos
-- basándose en las tareas que tienen asignadas.
-- 
-- Lógica: Si un usuario tiene al menos 1 tarea asignada en un proyecto,
-- entonces ese usuario debe estar en el array assigned_to del proyecto.

-- =============================================
-- 1. DIAGNÓSTICO: VER ESTADO ACTUAL
-- =============================================

-- Mostrar proyectos actuales y sus asignaciones
SELECT 
  'PROYECTOS ACTUALES:' AS info,
  p.name AS proyecto,
  p.assigned_to AS usuarios_asignados_proyecto,
  array_length(p.assigned_to, 1) AS num_usuarios_proyecto
FROM projects p
ORDER BY p.name;

-- Mostrar tareas y sus asignaciones por proyecto
SELECT 
  'TAREAS POR PROYECTO:' AS info,
  p.name AS proyecto,
  t.title AS tarea,
  t.assigned_to AS usuarios_asignados_tarea,
  array_length(t.assigned_to, 1) AS num_usuarios_tarea
FROM tasks t
JOIN projects p ON t.project_id = p.id
WHERE t.assigned_to IS NOT NULL AND array_length(t.assigned_to, 1) > 0
ORDER BY p.name, t.title;

-- =============================================
-- 2. ANÁLISIS: USUARIOS ÚNICOS POR PROYECTO
-- =============================================

-- Mostrar qué usuarios deberían estar asignados a cada proyecto
WITH usuarios_por_proyecto AS (
  SELECT 
    p.id AS project_id,
    p.name AS proyecto,
    unnest(t.assigned_to) AS user_id
  FROM projects p
  JOIN tasks t ON t.project_id = p.id
  WHERE t.assigned_to IS NOT NULL 
    AND array_length(t.assigned_to, 1) > 0
),
usuarios_unicos AS (
  SELECT 
    project_id,
    proyecto,
    array_agg(DISTINCT user_id) AS usuarios_deberian_estar
  FROM usuarios_por_proyecto
  GROUP BY project_id, proyecto
)
SELECT 
  'ANÁLISIS - USUARIOS QUE DEBERÍAN ESTAR EN CADA PROYECTO:' AS info,
  u.proyecto,
  u.usuarios_deberian_estar,
  array_length(u.usuarios_deberian_estar, 1) AS num_usuarios_deberian_estar,
  p.assigned_to AS usuarios_actualmente_asignados,
  array_length(p.assigned_to, 1) AS num_usuarios_actualmente
FROM usuarios_unicos u
JOIN projects p ON p.id = u.project_id
ORDER BY u.proyecto;

-- =============================================
-- 3. ACTUALIZACIÓN: ASIGNAR USUARIOS A PROYECTOS
-- =============================================

-- Actualizar cada proyecto con los usuarios que tienen tareas asignadas
WITH usuarios_por_proyecto AS (
  SELECT 
    p.id AS project_id,
    unnest(t.assigned_to) AS user_id
  FROM projects p
  JOIN tasks t ON t.project_id = p.id
  WHERE t.assigned_to IS NOT NULL 
    AND array_length(t.assigned_to, 1) > 0
),
usuarios_unicos AS (
  SELECT 
    project_id,
    array_agg(DISTINCT user_id) AS usuarios_asignados
  FROM usuarios_por_proyecto
  GROUP BY project_id
)
UPDATE projects 
SET 
  assigned_to = COALESCE(u.usuarios_asignados, '{}'),
  updated_at = NOW()
FROM usuarios_unicos u
WHERE projects.id = u.project_id;

-- También actualizar proyectos que no tienen tareas asignadas (array vacío)
UPDATE projects 
SET 
  assigned_to = '{}',
  updated_at = NOW()
WHERE id NOT IN (
  SELECT DISTINCT t.project_id 
  FROM tasks t 
  WHERE t.project_id IS NOT NULL 
    AND t.assigned_to IS NOT NULL 
    AND array_length(t.assigned_to, 1) > 0
);

-- =============================================
-- 4. VERIFICACIÓN: MOSTRAR RESULTADO
-- =============================================

-- Mostrar el resultado final
SELECT 
  'RESULTADO FINAL - PROYECTOS ACTUALIZADOS:' AS info,
  p.name AS proyecto,
  p.assigned_to AS usuarios_asignados,
  array_length(p.assigned_to, 1) AS num_usuarios
FROM projects p
ORDER BY p.name;

-- Mostrar detalle: qué usuarios están en cada proyecto y sus nombres
WITH usuarios_expandidos AS (
  SELECT 
    p.name AS proyecto,
    unnest(p.assigned_to) AS user_id
  FROM projects p
  WHERE array_length(p.assigned_to, 1) > 0
)
SELECT 
  'DETALLE - USUARIOS POR PROYECTO:' AS info,
  ue.proyecto,
  ue.user_id,
  pr.full_name AS nombre_usuario,
  pr.role AS rol_usuario
FROM usuarios_expandidos ue
JOIN profiles pr ON pr.id = ue.user_id
ORDER BY ue.proyecto, pr.full_name;

-- =============================================
-- 5. RESUMEN ESTADÍSTICO
-- =============================================

-- Resumen final
SELECT 
  'RESUMEN ESTADÍSTICO:' AS info,
  COUNT(*) AS total_proyectos,
  COUNT(CASE WHEN array_length(assigned_to, 1) > 0 THEN 1 END) AS proyectos_con_usuarios,
  COUNT(CASE WHEN array_length(assigned_to, 1) = 0 OR assigned_to = '{}' THEN 1 END) AS proyectos_sin_usuarios,
  SUM(array_length(assigned_to, 1)) AS total_asignaciones
FROM projects;

-- Mostrar proyectos sin usuarios asignados (pueden necesitar atención)
SELECT 
  'PROYECTOS SIN USUARIOS ASIGNADOS:' AS info,
  p.name AS proyecto,
  COUNT(t.id) AS num_tareas_total,
  COUNT(CASE WHEN t.assigned_to IS NOT NULL AND array_length(t.assigned_to, 1) > 0 THEN 1 END) AS num_tareas_con_usuarios
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
WHERE p.assigned_to = '{}' OR array_length(p.assigned_to, 1) = 0
GROUP BY p.id, p.name
ORDER BY p.name;

-- =============================================
-- MENSAJE FINAL
-- =============================================

SELECT 
  '✅ AUTO-ASIGNACIÓN COMPLETADA' AS resultado,
  'Los usuarios ahora están asignados a proyectos basándose en sus tareas' AS descripcion,
  'Revisa la sección DETALLE para ver los usuarios por proyecto' AS siguiente_paso; 