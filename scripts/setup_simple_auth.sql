-- Script para sistema simple: auth.users + profiles
-- Sistema estándar recomendado por Supabase

-- 1. Crear enum básico para roles (solo si no existe)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'supervisor', 'developer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Crear tabla profiles (extiende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'developer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas básicas de seguridad (solo si no existen)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles  
  FOR UPDATE USING (auth.uid() = id);

-- 5. Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Verificar que la tabla se creó correctamente
SELECT 'Tabla profiles creada correctamente' as status;

-- INSTRUCCIONES IMPORTANTES:
-- 
-- PASO 1: Ejecuta este script en SQL Editor de Supabase
-- 
-- PASO 2: Crea usuarios en Authentication > Users:
-- - manager@taskapp.com (contraseña: test123)
-- - supervisor@taskapp.com (contraseña: test123)  
-- - senior@taskapp.com (contraseña: test123)
-- - junior@taskapp.com (contraseña: test123)
-- ⚠️ Marca "Email confirmed" para cada uno
--
-- PASO 3: Ejecuta el script de configuración de perfiles: 