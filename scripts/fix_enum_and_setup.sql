-- SCRIPT DIAGNÓSTICO Y CORRECCIÓN - Arregla enum existente
-- Primero verificamos qué valores tiene el enum actual

-- 1. Ver valores actuales del enum user_role
SELECT enumlabel as valores_actuales_enum 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- 2. Eliminar el enum existente y recrearlo correctamente
DROP TYPE IF EXISTS user_role CASCADE;

-- 3. Crear el enum con los valores correctos
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'supervisor', 'developer');

-- 4. Eliminar tabla profiles si existe (para recrearla limpia)
DROP TABLE IF EXISTS profiles CASCADE;

-- 5. Crear tabla profiles correctamente
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'developer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas de seguridad
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles  
  FOR UPDATE USING (auth.uid() = id);

-- 8. Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Verificación final
SELECT 
    'Configuración CORREGIDA y completada' as status,
    'Tabla profiles recreada correctamente' as mensaje;

-- ✅ CONFIGURACIÓN LIMPIA COMPLETADA
-- 
-- El enum user_role se ha corregido con valores:
-- • admin, manager, supervisor, developer
--
-- PRÓXIMOS PASOS:
-- 1. Crea usuarios en Authentication > Users
-- 2. Ejecuta configure_test_data.sql
--
-- USUARIOS RECOMENDADOS:
-- • manager@taskapp.com (password: test123)
-- • supervisor@taskapp.com (password: test123)  
-- • senior@taskapp.com (password: test123)
-- • junior@taskapp.com (password: test123) 