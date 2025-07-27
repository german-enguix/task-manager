# 🔐 Fix: Migración con Dependencias RLS

## ❌ **Problema Encontrado**

Al ejecutar la migración inicial, aparecía este error:

```
ERROR: 2BP01: cannot drop column assigned_to of table tasks because other objects depend on it
DETAIL: 
  policy task_comments_all_own_tasks on table task_comments depends on column assigned_to of table tasks
  policy task_comments_policy on table task_comments depends on column assigned_to of table tasks
  policy task_problem_reports_select_own_tasks on table task_problem_reports depends on column assigned_to of table tasks
  policy task_problem_reports_insert_own_tasks on table task_problem_reports depends on column assigned_to of table tasks
HINT: Use DROP ... CASCADE to drop the dependent objects too.
```

## 🔍 **Causa del Problema**

El error ocurre porque **existen políticas RLS** (Row Level Security) que **dependen de la columna `assigned_to`**:

- **`task_comments`**: Políticas que permiten ver comentarios solo a usuarios asignados
- **`task_problem_reports`**: Políticas que permiten ver reportes solo a usuarios asignados

Estas políticas usan `assigned_to` para **determinar qué usuarios tienen acceso** a comentarios y reportes.

## ✅ **Solución Implementada**

### **📝 Script Mejorado: `migrate_assigned_to_array_fixed.sql`**

El nuevo script maneja las dependencias correctamente:

### **🔧 PASO A PASO:**

1. **💾 Backup** de datos existentes
2. **🗑️ Eliminar políticas dependientes** antes de cambiar la columna
3. **🔄 Migrar** `assigned_to` de `UUID` a `UUID[]`
4. **📦 Convertir** datos existentes a formato array
5. **🔐 Recrear políticas RLS** con soporte para arrays
6. **📊 Crear índices** optimizados para arrays

### **🔐 Políticas Mejoradas**

Las nuevas políticas RLS soportan **arrays de usuarios**:

```sql
-- ANTES: Solo un usuario
WHERE assigned_to = auth.uid()

-- DESPUÉS: Array de usuarios
WHERE auth.uid() = ANY(assigned_to)
```

### **📋 Políticas Recreadas:**

- **`tasks_select_policy`**: Ver tareas donde estoy asignado
- **`tasks_update_policy`**: Actualizar tareas donde estoy asignado
- **`task_comments_select_policy`**: Ver comentarios de mis tareas
- **`task_comments_insert_policy`**: Crear comentarios en mis tareas
- **`task_problem_reports_select_policy`**: Ver reportes de mis tareas + mis reportes
- **`task_problem_reports_insert_policy`**: Crear reportes en mis tareas
- **`task_problem_reports_update_policy`**: Solo autor puede actualizar
- **`task_problem_reports_delete_policy`**: Solo autor puede eliminar

## 🎯 **Funcionalidades Mejoradas**

### **👥 Múltiples Usuarios:**
```sql
-- Un usuario puede ver la tarea si está en el array
WHERE auth.uid() = ANY(assigned_to)

-- Expandir array para usar en subconsultas
SELECT unnest(assigned_to) FROM tasks WHERE tasks.id = task_comments.task_id
```

### **🔒 Seguridad Mantenida:**
- **Usuarios** solo ven **sus tareas asignadas**
- **Comentarios** solo visibles a **usuarios asignados**
- **Reportes** visibles a **usuarios asignados + autor**
- **Admins** tienen acceso completo

### **⚡ Performance:**
- **Índices GIN** para búsquedas rápidas en arrays
- **Consultas optimizadas** con operadores PostgreSQL

## 🚀 **Cómo Ejecutar**

### **⚡ Automático:**
```bash
./scripts/migrate_assigned_to.sh
```

### **📝 Manual:**
1. Copia `scripts/migrate_assigned_to_array_fixed.sql`
2. Ejecútalo en **Supabase > SQL Editor**

## ✅ **Verificación Post-Migración**

El script incluye verificaciones automáticas:

- **📊 Conteo** de tareas migradas
- **🔐 Lista** de políticas recreadas
- **💾 Confirmación** de backup

## 🔄 **Rollback (Si Necesario)**

Si algo sale mal, puedes revertir:

```sql
-- Eliminar columna nueva
ALTER TABLE tasks DROP COLUMN assigned_to;

-- Restaurar desde backup
ALTER TABLE tasks RENAME COLUMN assigned_to_backup TO assigned_to;

-- Recrear políticas originales (manual)
```

## 🎉 **Resultado Final**

- ✅ **Migración exitosa** UUID → UUID[]
- ✅ **Políticas RLS** actualizadas para arrays
- ✅ **Múltiples usuarios** por tarea soportado
- ✅ **Seguridad** mantenida
- ✅ **Performance** optimizada
- ✅ **Datos** preservados 