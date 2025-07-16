# 🚀 Configuración de Supabase

Esta guía te ayudará a configurar Supabase paso a paso para tu aplicación de gestión de tareas.

## 📋 **Paso 1: Crear cuenta y proyecto en Supabase**

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratuita
2. Crea un nuevo proyecto:
   - **Nombre**: `tasks-concept` (o el que prefieras)
   - **Región**: Elige la más cercana a tu ubicación
   - **Base de datos**: PostgreSQL (ya incluido)
3. Espera a que se complete la configuración (~2 minutos)

## 🔑 **Paso 2: Obtener credenciales**

En tu dashboard de Supabase:

1. Ve a **Settings** → **API**
2. Copia estos valores:
   - **Project URL**: `https://tu-proyecto.supabase.co`
   - **anon public key**: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...`

## ⚙️ **Paso 3: Configurar variables de entorno**

Crea un archivo `.env` en la raíz de tu proyecto:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Variables adicionales
NODE_ENV=development
```

> ⚠️ **Importante**: Nunca subas este archivo a git. Ya está en `.gitignore`.

## 🗄️ **Paso 4: Crear esquema de base de datos**

En tu dashboard de Supabase, ve a **SQL Editor** y ejecuta estos scripts:

### 1. Crear extensiones y enums
```sql
-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear enums
CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'paused', 'completed');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE user_role AS ENUM ('admin', 'user');
```

### 2. Crear tabla de usuarios
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Crear tabla de tags
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Crear tabla de tareas
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status task_status DEFAULT 'not_started',
  priority priority_level NOT NULL,
  due_date TIMESTAMPTZ,
  estimated_duration INTEGER, -- en minutos
  project_name TEXT NOT NULL,
  location TEXT NOT NULL,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Crear tabla de subtareas
```sql
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### 6. Crear tabla de relación tareas-tags
```sql
CREATE TABLE task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, tag_id)
);
```

### 7. Crear índices para performance
```sql
-- Índices para mejor performance
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);
```

## 🔒 **Paso 5: Configurar Row Level Security (RLS)**

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios (pueden ver/editar sus propios datos)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para tareas (usuarios ven sus asignadas, admins ven todas)
CREATE POLICY "Users can view assigned tasks" ON tasks
  FOR SELECT USING (
    assigned_to = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert tasks" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update tasks" ON tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para subtareas (heredan permisos de la tarea)
CREATE POLICY "Users can view subtasks of assigned tasks" ON subtasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = subtasks.task_id 
      AND (assigned_to = auth.uid() OR 
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Users can update subtasks of assigned tasks" ON subtasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = subtasks.task_id 
      AND assigned_to = auth.uid()
    )
  );

-- Políticas para tags (todos pueden ver, solo admins crear/modificar)
CREATE POLICY "Everyone can view tags" ON tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage tags" ON tags FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para task_tags (heredan de tareas y tags)
CREATE POLICY "Users can view task tags" ON task_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = task_tags.task_id 
      AND (assigned_to = auth.uid() OR 
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );
```

## 📊 **Paso 6: Insertar datos de prueba**

```sql
-- Insertar tags de ejemplo
INSERT INTO tags (name, color, category) VALUES
('Seguridad', '#ff5722', 'Operaciones'),
('Urgente', '#f44336', 'Prioridad'),
('Mantenimiento', '#2196f3', 'Operaciones'),
('Inspección', '#9c27b0', 'Calidad'),
('Control de Calidad', '#4caf50', 'Calidad'),
('Capacitación', '#ff9800', 'RRHH'),
('Equipamiento', '#607d8b', 'Operaciones'),
('Cumplimiento', '#795548', 'Legal'),
('Documentación', '#3f51b5', 'Administración'),
('Ambiental', '#8bc34a', 'Sostenibilidad'),
('Seguridad Industrial', '#e91e63', 'Operaciones'),
('Rutina', '#9e9e9e', 'Frecuencia');
```

## ✅ **Paso 7: Probar la conexión**

Tu código ya está configurado para usar Supabase. Para probar:

1. Asegúrate de que tu `.env` esté configurado correctamente
2. Ejecuta `npm start`
3. En la consola del navegador deberías ver: `✅ Supabase connection successful`

## 🔧 **Próximos pasos**

1. **Autenticación**: Configurar login/registro
2. **Migración de datos**: Importar datos del mock actual
3. **Real-time**: Configurar subscripciones para updates en vivo
4. **Storage**: Para evidencias multimedia

## 🆘 **Troubleshooting**

### Error de conexión
- Verifica que las URLs y keys sean correctas
- Asegúrate de que el proyecto esté activo en Supabase

### Error de RLS
- Verifica que las políticas estén configuradas
- Para desarrollo, puedes temporalmente deshabilitar RLS: `ALTER TABLE tabla_name DISABLE ROW LEVEL SECURITY;`

### Error de CORS
- Supabase permite todas las URLs por defecto
- Si hay problemas, verifica en Settings → API → CORS

---

💡 **Tip**: Guarda este archivo para referencia futura y compártelo con tu equipo. 