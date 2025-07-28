# 🚀 Configuración Simple de Proyectos

## 📋 Problema solucionado

La página "Mis Proyectos" mostraba error porque la tabla `projects` no existía en la base de datos.

## ✅ Solución simple

He creado un script súper simple que:

1. **Crea la tabla `projects`** (sin complicaciones)
2. **Crea 4 proyectos básicos** para agrupar tareas  
3. **Asigna las tareas existentes** a esos proyectos automáticamente

## 🔄 Actualización importante

**Estructura simplificada:** He eliminado la confusión entre `assigned_team` y `assigned_to`. Ahora solo hay:
- ✅ **`assigned_to: UUID[]`** - Array de IDs de usuarios asignados al proyecto
- ❌ **`assigned_team: string[]`** - Eliminado (era redundante)

## 🎯 Asignación automática de usuarios

**Nuevo script:** `auto_assign_users_to_projects.sql` que asigna automáticamente usuarios a proyectos basándose en las tareas:

- 🔍 **Analiza** qué usuarios tienen tareas asignadas en cada proyecto
- ⚡ **Asigna automáticamente** esos usuarios al proyecto
- 📊 **Muestra estadísticas** detalladas del proceso
- ✅ **Lógica:** Si tienes ≥1 tarea en un proyecto → estás asignado al proyecto

## 🎯 Instrucciones

### 1. Ejecutar los scripts

1. Ve a tu **dashboard de Supabase** (supabase.com)
2. Navega a **SQL Editor**
3. **Si es primera vez:** Ejecuta `scripts/simple_projects_setup.sql`
4. **Si ya tienes proyectos:** Ejecuta `scripts/migrate_assigned_team_to_assigned_to.sql` para actualizar la estructura
5. **Para asignar usuarios automáticamente:** Ejecuta `scripts/auto_assign_users_to_projects.sql`

### 2. Resultado

Verás **4 proyectos** creados automáticamente:

- **🔧 Mantenimiento y Verificaciones** - Tareas de mantenimiento, verificaciones QR, inspecciones
- **🧹 Gestión de Oficinas** - Tareas de limpieza, reorganización, almacén
- **📅 Eventos Corporativos** - Preparación de eventos y reuniones
- **📦 Logística y Servicios** - Gestión de residuos, reciclaje, paquetería

### 3. Asignación automática de usuarios

El script `auto_assign_users_to_projects.sql` te mostrará:

- 📋 **Estado actual** - Proyectos y tareas con sus asignaciones
- 🧮 **Análisis** - Qué usuarios deberían estar en cada proyecto  
- ⚡ **Actualización** - Asignación automática en tiempo real
- 👥 **Detalle** - Lista de usuarios por proyecto con nombres
- 📊 **Estadísticas** - Resumen del proceso

### 4. Verificar

Después de los scripts:
- Ve a la app
- Entra en "Mis Proyectos" 
- ✅ Deberías ver los 4 proyectos con las tareas agrupadas
- ✅ Los usuarios estarán asignados automáticamente basándose en sus tareas

## 🔧 ¿Qué hace el script?

1. **Crea tabla `projects`** simple (sin relaciones complejas)
2. **Inserta 4 proyectos** básicos
3. **Agrupa tareas existentes** por palabras clave:
   - Si la tarea tiene "mantenimiento", "verificación", "QR" → Mantenimiento y Verificaciones
   - Si tiene "limpieza", "oficinas", "almacén" → Gestión de Oficinas
   - Si tiene "evento", "corporativo", "reuniones" → Eventos Corporativos
   - Si tiene "residuos", "reciclaje", "paquetería" → Logística y Servicios
4. **Calcula estadísticas** automáticamente
5. **Asigna usuarios automáticamente** basándose en las tareas que tienen

## ✨ Características

- ✅ **Simple**: Sin usuarios complejos ni supervisores reales
- ✅ **Automático**: Agrupa las tareas automáticamente
- ✅ **Funcional**: Lista para usar inmediatamente
- ✅ **Permisivo**: Políticas RLS abiertas para testing

## 🚨 Nota importante

Este es un setup **básico para desarrollo/testing**. Los datos de supervisores son genéricos y las políticas son muy permisivas.

¡Ejecuta el script y ya tendrás proyectos funcionando! 🎉 