-- CONFIGURACIÓN RÁPIDA PARA TESTING
-- ⚠️ Solo para desarrollo/testing

-- Crear bucket público simple
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-evidences', 'task-evidences', true)
ON CONFLICT (id) DO NOTHING;

-- Desactivar RLS temporalmente para testing
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT 'Bucket creado: task-evidences (PÚBLICO - Solo para testing)' as status; 