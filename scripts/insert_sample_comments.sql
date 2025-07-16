-- Script opcional para insertar comentarios de prueba
-- Ejecutar DESPUÉS de crear la tabla task_comments
-- Este script es solo para testing del sistema de comentarios

-- ===============================
-- INSERTAR COMENTARIOS DE PRUEBA
-- ===============================

DO $$
DECLARE
    -- Variables para IDs de usuarios existentes
    zizi_id UUID;
    german_id UUID;
    albert_id UUID;
    
    -- Variable para una tarea de prueba
    sample_task_id UUID;
BEGIN

-- Obtener IDs de usuarios existentes
SELECT p.id INTO zizi_id 
FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'zizi@taskmanager.com' 
LIMIT 1;

SELECT p.id INTO german_id 
FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'german@taskmanager.com' 
LIMIT 1;

SELECT p.id INTO albert_id 
FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'albert@taskmanager.com' 
LIMIT 1;

-- Obtener una tarea existente de Zizi para agregar comentarios
SELECT id INTO sample_task_id 
FROM tasks 
WHERE assigned_to = zizi_id 
LIMIT 1;

-- Verificar que tenemos los datos necesarios
IF zizi_id IS NULL OR sample_task_id IS NULL THEN
    RAISE NOTICE 'No se encontraron usuarios o tareas para insertar comentarios de prueba';
    RETURN;
END IF;

-- Insertar comentarios de prueba
INSERT INTO task_comments (task_id, user_id, type, content, created_at) VALUES
-- Comentario de texto de Zizi
(sample_task_id, zizi_id, 'text', 'Iniciando la tarea. Todo parece estar en orden.', NOW() - INTERVAL '2 hours'),

-- Comentario de German (si existe)
(sample_task_id, COALESCE(german_id, zizi_id), 'text', 'Revisé el área y está lista para comenzar.', NOW() - INTERVAL '1 hour 30 minutes'),

-- Comentario de voz de Zizi
(sample_task_id, zizi_id, 'voice', 'Nota de voz: He encontrado un pequeño problema en el área 3 que requiere atención adicional.', NOW() - INTERVAL '45 minutes'),

-- Comentario de seguimiento
(sample_task_id, zizi_id, 'text', 'Problema resuelto. Continuando con el resto de la tarea.', NOW() - INTERVAL '15 minutes'),

-- Comentario de Albert (si existe)
(sample_task_id, COALESCE(albert_id, zizi_id), 'text', 'Excelente trabajo en equipo. La coordinación ha sido perfecta.', NOW() - INTERVAL '5 minutes');

RAISE NOTICE '✅ Se han insertado comentarios de prueba en la tarea: %', sample_task_id;

END $$;

-- ===============================
-- VERIFICAR COMENTARIOS INSERTADOS
-- ===============================

SELECT 
  'COMENTARIOS DE PRUEBA INSERTADOS:' as info,
  tc.id,
  tc.type as tipo,
  tc.content as contenido,
  p.full_name as autor,
  tc.created_at::timestamp(0) as fecha
FROM task_comments tc
JOIN profiles p ON tc.user_id = p.id
ORDER BY tc.created_at DESC
LIMIT 10;

-- Mensaje final
SELECT '🎯 Script de comentarios de prueba completado' as resultado;
SELECT '💡 Los comentarios aparecerán en TaskDetailScreen automáticamente' as resultado; 