# 🗄️ Configurar Base de Datos con Datos Reales

Esta guía te ayudará a configurar tu base de datos Supabase con datos reales en lugar de datos mock.

## 📋 Prerequisitos

- ✅ Proyecto Supabase creado en [supabase.com](https://supabase.com)
- ✅ Variables de entorno configuradas en `.env`
- ✅ Aplicación React Native funcionando

## 🚀 Paso 1: Configurar Base de Datos

### 1.1 Acceder a Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto
4. Navega a **SQL Editor** en el panel izquierdo

### 1.2 Ejecutar Script de Configuración
1. Abre el archivo `scripts/complete_database_setup.sql`
2. Copia todo el contenido del archivo
3. Pégalo en el **SQL Editor** de Supabase
4. Haz clic en **Run** (▶️)

**Resultado esperado:** ✅ Verás un mensaje de confirmación indicando que la base de datos se configuró exitosamente.

## 👥 Paso 2: Crear Usuarios de Prueba

### 2.1 Acceder a Authentication
1. En tu proyecto Supabase, navega a **Authentication > Users**
2. Haz clic en **Add user** (+ Agregar usuario)

### 2.2 Crear Usuarios Uno por Uno

Crea estos 4 usuarios exactamente como se muestra:

#### Usuario 1: Zizi
- **Email:** `zizi@taskmanager.com`
- **Password:** `test123`
- **✅ Marcar "Email confirmed"**

#### Usuario 2: German  
- **Email:** `german@taskmanager.com`
- **Password:** `test123`
- **✅ Marcar "Email confirmed"**

#### Usuario 3: Albert
- **Email:** `albert@taskmanager.com`
- **Password:** `test123`
- **✅ Marcar "Email confirmed"**

#### Usuario 4: Manager
- **Email:** `manager@taskapp.com`
- **Password:** `test123`
- **✅ Marcar "Email confirmed"**

**⚠️ IMPORTANTE:** Es crítico marcar "Email confirmed" para cada usuario, de lo contrario no podrán hacer login.

## 📊 Paso 3: Crear Datos de Tareas Reales

### 3.1 Ejecutar Script de Datos
1. Regresa al **SQL Editor** de Supabase
2. Abre el archivo `scripts/create_real_tasks_data.sql`
3. Copia todo el contenido del archivo
4. Pégalo en el **SQL Editor** 
5. Haz clic en **Run** (▶️)

**Resultado esperado:** ✅ Verás confirmación de que se crearon 6 tareas reales con subtareas, comentarios y notificaciones.

## 🧪 Paso 4: Probar la Aplicación

### 4.1 Reiniciar la App
```bash
# Detén la app si está corriendo (Ctrl+C)
npm start
```

### 4.2 Hacer Login
1. Abre la aplicación en tu dispositivo/emulador
2. Usa cualquiera de estos logins:
   - **Email:** `zizi@taskmanager.com` **Password:** `test123`
   - **Email:** `german@taskmanager.com` **Password:** `test123`
   - **Email:** `albert@taskmanager.com` **Password:** `test123`

### 4.3 Verificar Funcionalidad
✅ **Deberías ver:**
- Lista de tareas en la pantalla Home
- Al hacer clic en una tarea, se abre TaskDetailScreen 
- Detalles completos con subtareas
- Sección de comentarios funcionando
- Cronómetro operativo
- Notificaciones en el bell icon

❌ **Si no funciona:**
- Revisa la consola de desarrollador para errores
- Verifica que los usuarios están creados correctamente
- Confirma que ambos scripts SQL se ejecutaron sin errores

## 📋 Datos Creados

### Tareas de Ejemplo:
1. **Inspección de seguridad semanal** (Zizi) - Alta prioridad
2. **Mantenimiento preventivo de equipos** (German) - Media prioridad  
3. **Calibración de instrumentos** (Albert) - Media prioridad
4. **Inventario mensual de almacén** (Zizi) - Baja prioridad
5. **Capacitación de seguridad** (German) - Alta prioridad
6. **Auditoría ambiental** (Albert) - Media prioridad

### Características:
- ✅ Subtareas con diferentes tipos de evidencias requeridas
- ✅ Tags del sistema (Seguridad, Mantenimiento, Calidad, etc.)
- ✅ Comentarios de ejemplo
- ✅ Notificaciones para cada usuario
- ✅ Fechas futuras para pruebas realistas

## 🔧 Solución de Problemas

### Error: "No se encontraron usuarios"
**Causa:** Los usuarios no fueron creados correctamente en Authentication
**Solución:** 
1. Ve a Authentication > Users en Supabase
2. Verifica que los 4 usuarios existen
3. Confirma que "Email confirmed" está marcado

### Error: "Tarea no encontrada"  
**Causa:** El script de datos no se ejecutó correctamente
**Solución:**
1. Ve al SQL Editor de Supabase
2. Ejecuta esta consulta para verificar: `SELECT count(*) FROM tasks;`
3. Deberías ver 6 tareas, si no, re-ejecuta `create_real_tasks_data.sql`

### Error de conexión a base de datos
**Causa:** Variables de entorno incorrectas
**Solución:**
1. Verifica tu archivo `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica
   ```
2. Reinicia la aplicación

## ✅ Resultado Final

Una vez completados todos los pasos, tu aplicación estará funcionando completamente con datos reales de la base de datos Supabase, sin dependencia de datos mock.

**¡Tu sistema de gestión de tareas ya está listo para usar!** 🎉 