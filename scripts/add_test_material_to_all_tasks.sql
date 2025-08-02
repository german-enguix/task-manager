-- Script para agregar material de prueba a todas las tareas
-- Ejecutar en el Query Editor de Supabase

-- Agregar "Prueba de material" a todas las tareas
UPDATE tasks 
SET material = 'Prueba de material'
WHERE material IS NULL OR material = '';

-- Verificar los cambios
SELECT 
  title,
  material,
  'Material agregado' as status
FROM tasks 
WHERE material = 'Prueba de material'
ORDER BY title; 