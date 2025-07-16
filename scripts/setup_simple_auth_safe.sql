-- SCRIPT SEGURO E IDEMPOTENTE - Puede ejecutarse múltiples veces sin errores
-- Sistema estándar recomendado por Supabase: auth.users + profiles

-- 1. Crear enum básico para roles (seguro)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'supervisor', 'developer');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'El tipo user_role ya existe, continuando...';
END $$;

-- 2. Crear tabla profiles (seguro)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'developer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Row Level Security (seguro)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Eliminar políticas existentes y crear nuevas (seguro)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles  
  FOR UPDATE USING (auth.uid() = id);

-- 5. Función para crear perfil automáticamente (seguro)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para nuevos usuarios (seguro)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Función para actualizar updated_at automáticamente (seguro)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para actualizar updated_at (seguro)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Verificar que todo se creó correctamente
SELECT 
    'Configuración completada - Tabla profiles lista para usar' as status,
    count(*) as perfiles_existentes
FROM profiles;

-- ✅ CONFIGURACIÓN COMPLETADA
-- 
-- PRÓXIMOS PASOS:
-- 1. Crea usuarios en Authentication > Users de Supabase Dashboard
-- 2. Ejecuta el script configure_test_data.sql
--
-- USUARIOS RECOMENDADOS:
-- • manager@taskapp.com (password: test123)
-- • supervisor@taskapp.com (password: test123)  
-- • senior@taskapp.com (password: test123)
-- • junior@taskapp.com (password: test123)
--
-- ⚠️ IMPORTANTE: Marca "Email confirmed" para cada usuario 