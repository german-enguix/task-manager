-- Script para agregar campo de material requerido a la tabla tasks
-- Ejecutar en el Query Editor de Supabase

-- Agregar columna material a la tabla tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS material TEXT;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN tasks.material IS 'Material requerido para completar la tarea (ej: materiales de limpieza, herramientas de mantenimiento, etc.)';

-- Verificación
SELECT 
  'Campo material agregado exitosamente a la tabla tasks' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND column_name = 'material'; 