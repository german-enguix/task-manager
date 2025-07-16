# 🎯 Sistema Simple y Estándar - Supabase Auth + Profiles

## ✅ **Sistema Recomendado**

**Estructura estándar de Supabase:**
- **`auth.users`** = Autenticación (emails, contraseñas) - Supabase automático
- **`profiles`** = Info adicional (nombres, roles) - Tabla personalizada
- **Login por EMAIL** = Estándar, sin complicaciones

---

## 📋 **Paso 1: Crear tabla profiles**

```sql
-- 1. Crear enums básicos
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'supervisor', 'developer');

-- 2. Crear tabla profiles (extiende auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'developer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS básico
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles  
  FOR UPDATE USING (auth.uid() = id);

-- 4. Trigger automático para nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 📋 **Paso 2: Crear usuarios de prueba**

**En Supabase Dashboard > Authentication > Users:**

### Usuario 1: Manager
- **Email**: `manager@taskapp.com`
- **Contraseña**: `test123`
- **Email confirmed**: ✅

### Usuario 2: Supervisor  
- **Email**: `supervisor@taskapp.com`
- **Contraseña**: `test123`
- **Email confirmed**: ✅

### Usuario 3: Developer Senior
- **Email**: `senior@taskapp.com`
- **Contraseña**: `test123`
- **Email confirmed**: ✅

### Usuario 4: Developer Junior
- **Email**: `junior@taskapp.com`
- **Contraseña**: `test123`
- **Email confirmed**: ✅

---

## 📋 **Paso 3: Completar perfiles**

```sql
-- Actualizar perfiles con nombres y roles
UPDATE profiles SET 
  full_name = 'María Manager', 
  role = 'manager'
WHERE id = (SELECT id FROM auth.users WHERE email = 'manager@taskapp.com');

UPDATE profiles SET 
  full_name = 'Carlos Supervisor', 
  role = 'supervisor'
WHERE id = (SELECT id FROM auth.users WHERE email = 'supervisor@taskapp.com');

UPDATE profiles SET 
  full_name = 'Pedro Senior', 
  role = 'developer'
WHERE id = (SELECT id FROM auth.users WHERE email = 'senior@taskapp.com');

UPDATE profiles SET 
  full_name = 'Ana Junior', 
  role = 'developer'  
WHERE id = (SELECT id FROM auth.users WHERE email = 'junior@taskapp.com');
```

---

## 📋 **Paso 4: Asignar tareas a usuarios**

```sql
-- Asignar tareas específicas a cada usuario
UPDATE tasks SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'manager@taskapp.com'
) WHERE title IN ('Planificar sprint', 'Coordinar con cliente');

UPDATE tasks SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'supervisor@taskapp.com'
) WHERE title IN ('Supervisar progreso del equipo');

UPDATE tasks SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'senior@taskapp.com'
) WHERE title IN ('Revisar código de seguridad', 'Optimizar consultas');

UPDATE tasks SET assigned_to = (
  SELECT id FROM auth.users WHERE email = 'junior@taskapp.com'
) WHERE title IN ('Configurar entorno de desarrollo', 'Implementar autenticación');
```

---

## 📋 **Paso 5: Verificar configuración**

```sql
-- Ver todos los usuarios configurados
SELECT 
  u.email,
  p.full_name,
  p.role,
  COUNT(t.id) as tasks_assigned
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN tasks t ON u.id = t.assigned_to
WHERE u.email LIKE '%taskapp.com'
GROUP BY u.email, p.full_name, p.role
ORDER BY u.email;
```

**Deberías ver:**
| email | full_name | role | tasks_assigned |
|-------|-----------|------|----------------|
| junior@taskapp.com | Ana Junior | developer | 2 |
| manager@taskapp.com | María Manager | manager | 2 |
| senior@taskapp.com | Pedro Senior | developer | 2 |
| supervisor@taskapp.com | Carlos Supervisor | supervisor | 1 |

---

## 🧪 **Testing del Login**

### En la app:
1. **Email**: `manager@taskapp.com`
2. **Contraseña**: `test123`
3. **Resultado**: Ve las tareas asignadas a managers

### Otros usuarios:
- `supervisor@taskapp.com` + `test123` = Tareas de supervisión
- `senior@taskapp.com` + `test123` = Tareas técnicas avanzadas  
- `junior@taskapp.com` + `test123` = Tareas de desarrollo básico

---

## ✅ **Ventajas de este Sistema**

1. **🔐 Contraseñas seguras**: Supabase las maneja (no las ves por seguridad)
2. **📧 Login estándar**: Por email, como toda app profesional
3. **🏗️ Arquitectura probada**: Usado por millones de apps
4. **🧪 Fácil testing**: Creas usuarios directamente en Auth
5. **📊 Datos filtrados**: Cada usuario ve solo sus tareas
6. **🔄 Sin dependencias raras**: Todo directo y limpio

---

## 🎯 **¿Por qué no ves las contraseñas?**

**Es por seguridad.** Supabase encripta las contraseñas y nunca las muestra. Esto es **BUENO** porque:
- Las contraseñas están seguras
- Ni tú ni nadie puede verlas
- Es el estándar de la industria
- Supabase las valida automáticamente

**Para cambiar contraseñas:** Ve a Authentication > Users > [usuario] > Reset Password

---

## 🚀 **¡Listo para usar!**

Este sistema es:
- ✅ **Estándar de Supabase**
- ✅ **Simple y directo**  
- ✅ **Sin complicaciones**
- ✅ **Fácil de mantener**
- ✅ **Escalable** 