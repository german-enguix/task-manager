# 🚀 Configuración del Sistema de Login - Paso a Paso

## ❗ **Problema Resuelto**

**El problema:** Estaba mezclando tablas `users` y `profiles`, causando confusión.

**La solución:** Ahora todo usa la tabla `profiles` que extiende `auth.users` de Supabase.

---

## 📋 **Paso 1: Crear la tabla profiles**

1. Abre tu proyecto de Supabase
2. Ve a **SQL Editor**
3. Ejecuta el script: `scripts/create_profiles_table.sql`

```sql
-- Este script crea:
-- ✅ Tabla profiles que extiende auth.users
-- ✅ Enums para roles y departamentos
-- ✅ Políticas de seguridad (RLS)
-- ✅ Triggers automáticos
-- ✅ Índices para performance
```

## 📋 **Paso 2: Crear usuarios en Supabase Auth**

1. Ve a **Authentication > Users**
2. Haz clic en **"Add user"**
3. Crea estos 4 usuarios:

### Usuario 1: María Manager
- **Email**: `maria.manager@taskmanager.com`
- **Contraseña**: `Secret_123`
- **Email confirmed**: ✅ Activar

### Usuario 2: Carlos Supervisor  
- **Email**: `carlos.supervisor@taskmanager.com`
- **Contraseña**: `Secret_123` 
- **Email confirmed**: ✅ Activar

### Usuario 3: Pedro Senior
- **Email**: `pedro.senior@taskmanager.com`
- **Contraseña**: `Secret_123`
- **Email confirmed**: ✅ Activar

### Usuario 4: Ana Junior
- **Email**: `ana.junior@taskmanager.com`
- **Contraseña**: `Secret_123`
- **Email confirmed**: ✅ Activar

## 📋 **Paso 3: Completar perfiles de usuarios**

1. Ve a **SQL Editor**
2. Ejecuta el script: `scripts/create_test_users.sql`

```sql
-- Este script:
-- ✅ Completa perfiles con nombres, roles y departamentos
-- ✅ Asigna tareas específicas a cada usuario
-- ✅ Distribuye proyectos entre usuarios  
-- ✅ Crea notificaciones de bienvenida
-- ✅ Configura work_days iniciales
```

## 📋 **Paso 4: Verificar configuración**

En **SQL Editor**, ejecuta esta consulta para verificar:

```sql
SELECT 
  u.email,
  p.full_name,
  p.role,
  p.department
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email LIKE '%taskmanager.com%'
ORDER BY u.email;
```

**Deberías ver:**

| Email | full_name | role | department |
|-------|-----------|------|------------|
| ana.junior@taskmanager.com | Ana Junior | developer | Desarrollo |
| carlos.supervisor@taskmanager.com | Carlos Supervisor | supervisor | Supervisión |
| maria.manager@taskmanager.com | María Manager | manager | Gestión |
| pedro.senior@taskmanager.com | Pedro Senior | developer | Desarrollo |

## 🧪 **Paso 5: Probar el login**

1. **Abre la app**
2. **Introduce un nombre**: `María Manager`
3. **Contraseña**: `Secret_123`
4. **¡Debería funcionar!**

### Otros usuarios para probar:
- `Carlos Supervisor` + `Secret_123`
- `Pedro Senior` + `Secret_123`  
- `Ana Junior` + `Secret_123`

---

## ✅ **Cómo Funciona Ahora**

### 🔄 **Flujo del Login:**
1. Usuario ingresa: `María Manager`
2. Sistema mapea a: `maria.manager@taskmanager.com`
3. Supabase Auth valida credenciales
4. Sistema obtiene perfil de tabla `profiles`
5. Usuario logueado con datos completos

### 🗄️ **Estructura de Datos:**
- **`auth.users`** = Usuarios de Supabase (automático)
- **`profiles`** = Información extendida (manual)
- **Relación**: `profiles.id` → `auth.users.id` (FK)

### 🔐 **Seguridad:**
- ✅ Tokens JWT reales de Supabase
- ✅ Row Level Security (RLS) activado
- ✅ Usuarios solo ven sus datos
- ✅ Administradores ven todo

---

## 🎯 **Si Tienes Problemas**

### ❌ **"Usuario no encontrado"**
- Verifica que el usuario existe en **Authentication > Users**
- Comprueba que el perfil existe en tabla `profiles`

### ❌ **"Contraseña incorrecta"**  
- La contraseña debe ser exactamente: `Secret_123`
- Verifica en Supabase Auth que la contraseña sea correcta

### ❌ **"Tabla profiles no existe"**
- Ejecuta primero: `scripts/create_profiles_table.sql`

### ❌ **"No se muestran datos del usuario"**
- Ejecuta: `scripts/create_test_users.sql`
- Verifica con la consulta del Paso 4

---

## 🚀 **¡Listo!**

Ahora tienes un sistema de login que:
- **Es fácil de usar** (login por nombre)
- **Es súper seguro** (Supabase Auth + JWT)
- **Tiene persistencia** (sesiones automáticas)
- **Controla acceso** (cada usuario ve sus datos)

**¡A disfrutar del sistema! 🎉** 