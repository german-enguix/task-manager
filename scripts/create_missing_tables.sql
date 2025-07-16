-- CREAR TABLAS FALTANTES PARA EVITAR ERRORES
-- Tablas básicas que el código referencia pero no existen

-- 1. Crear tabla work_notifications (básica por ahora)
CREATE TABLE IF NOT EXISTS work_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  action_required BOOLEAN DEFAULT false,
  action_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- 2. Habilitar RLS
ALTER TABLE work_notifications ENABLE ROW LEVEL SECURITY;

-- 3. Política simple: usuarios ven solo sus notificaciones
CREATE POLICY "work_notifications_select_own" ON work_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "work_notifications_update_own" ON work_notifications  
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Insertar algunas notificaciones de ejemplo
INSERT INTO work_notifications (user_id, title, message, type, is_read) VALUES 
(
  (SELECT id FROM auth.users WHERE email = 'german@taskmanager.com' LIMIT 1),
  'Sistema configurado',
  'El sistema de autenticación está funcionando correctamente',
  'system',
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'zizi@taskmanager.com' LIMIT 1),
  'Bienvenida al sistema',
  'Tu cuenta ha sido configurada exitosamente',
  'welcome',
  false
),
(
  (SELECT id FROM auth.users WHERE email = 'albert@taskmanager.com' LIMIT 1),
  'Nueva funcionalidad',
  'Se han agregado nuevas características al sistema',
  'feature',
  false
);

-- 5. Verificar creación
SELECT 
  'TABLA WORK_NOTIFICATIONS CREADA:' as info,
  count(*) as total_notifications,
  count(*) FILTER (WHERE is_read = false) as unread_notifications
FROM work_notifications;

-- ✅ TABLAS FALTANTES CREADAS
-- 
-- TABLAS CREADAS:
-- • work_notifications - Para notificaciones del sistema
--
-- ¡LOS ERRORES DE CONSOLA DEBERÍAN DESAPARECER! 