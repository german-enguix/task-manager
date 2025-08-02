-- Script opcional para agregar datos de ejemplo de material a las tareas
-- Ejecutar DESPUÉS del script add_material_field_to_tasks.sql

-- Agregar material de ejemplo a una tarea cualquiera para probar
UPDATE tasks 
SET material = 'Detergente, paños de microfibra, aspiradora'
WHERE id IN (SELECT id FROM tasks LIMIT 1);

-- Ver las tareas con material
SELECT title, material 
FROM tasks 
WHERE material IS NOT NULL;

-- Verificar los cambios
SELECT 
  title,
  material,
  CASE 
    WHEN material IS NOT NULL THEN 'Con material'
    ELSE 'Sin material'
  END as estado_material
FROM tasks 
ORDER BY 
  CASE WHEN material IS NOT NULL THEN 0 ELSE 1 END,
  title; 