# 👥 Guía de Asignación Múltiple de Usuarios

## 🎯 **Funcionalidad**
Ahora puedes **asignar múltiples usuarios a la misma tarea**, permitiendo **colaboración en equipo** y **trabajo conjunto** en las tareas.

## 🔄 **Migración de Base de Datos**

### **⚡ Ejecución Automática:**
```bash
# Ejecutar migración completa
./scripts/migrate_assigned_to.sh
```

### **📝 Ejecución Manual (SQL Editor):**
Si prefieres ejecutar manualmente en Supabase:
1. Copia el contenido de `scripts/migrate_assigned_to_array.sql`
2. Pégalo en **Supabase > SQL Editor**
3. Ejecuta el script

## 🛠️ **Cambios Técnicos Realizados**

### **📊 Base de Datos:**
- **ANTES:** `assigned_to UUID` (un solo usuario)
- **DESPUÉS:** `assigned_to UUID[]` (array de usuarios)
- **✅ Migración automática** de datos existentes
- **📊 Índices GIN** creados para performance
- **💾 Backup** en `assigned_to_backup` (por seguridad)

### **📱 TypeScript:**
- **Tipos actualizados:** `assignedTo?: string[]`
- **Consultas optimizadas:** Uso de operadores de array PostgreSQL
- **🔍 Filtros mejorados:** `contains()` en lugar de `eq()`

## 🚀 **Nuevas Funciones Disponibles**

### **➕ Agregar Usuario a Tarea:**
```typescript
await supabaseService.addUserToTask(taskId, userId);
```

### **➖ Remover Usuario de Tarea:**
```typescript
await supabaseService.removeUserFromTask(taskId, userId);
```

### **🔄 Reemplazar Asignación Completa:**
```typescript
// Asignar múltiples usuarios
await supabaseService.replaceTaskAssignment(taskId, ['user1-id', 'user2-id', 'user3-id']);

// Asignar un solo usuario
await supabaseService.replaceTaskAssignment(taskId, ['user1-id']);

// Desasignar tarea (nadie)
await supabaseService.replaceTaskAssignment(taskId, []);
```

### **📋 Obtener Usuarios Asignados:**
```typescript
const assignedUsers = await supabaseService.getTaskAssignees(taskId);
console.log('Usuarios asignados:', assignedUsers); // ['user1-id', 'user2-id']
```

## 💻 **Ejemplos de Uso**

### **📝 Crear Tarea con Múltiples Usuarios:**
```typescript
const newTask: Task = {
  // ... otros campos ...
  assignedTo: ['user1-id', 'user2-id', 'user3-id'] // Múltiples usuarios
};

await supabaseService.createTask(newTask);
```

### **🔄 Gestión Dinámica:**
```typescript
// Agregar colaborador adicional
await supabaseService.addUserToTask('task-123', 'new-user-id');

// Remover colaborador
await supabaseService.removeUserFromTask('task-123', 'old-user-id');

// Cambiar equipo completo
await supabaseService.replaceTaskAssignment('task-123', ['lead-id', 'dev1-id', 'dev2-id']);
```

### **🔍 Filtrar Tareas por Usuario:**
```typescript
// El filtro automáticamente funciona con arrays
const userTasks = await supabaseService.getTasks(userId);
// Devuelve tareas donde userId está en el array assigned_to
```

## 📊 **Consultas SQL Avanzadas**

### **Buscar Tareas de Usuario Específico:**
```sql
SELECT * FROM tasks 
WHERE 'user-uuid-here' = ANY(assigned_to);
```

### **Buscar Tareas Asignadas a Múltiples Usuarios:**
```sql
SELECT * FROM tasks 
WHERE assigned_to && ARRAY['user1-uuid', 'user2-uuid'];
```

### **Contar Usuarios por Tarea:**
```sql
SELECT id, title, array_length(assigned_to, 1) as num_assignees 
FROM tasks 
WHERE assigned_to IS NOT NULL;
```

### **Agregar Usuario a Tarea Existente:**
```sql
UPDATE tasks 
SET assigned_to = array_append(assigned_to, 'new-user-uuid') 
WHERE id = 'task-uuid';
```

### **Remover Usuario de Tarea:**
```sql
UPDATE tasks 
SET assigned_to = array_remove(assigned_to, 'user-uuid-to-remove') 
WHERE id = 'task-uuid';
```

## 🎨 **Consideraciones de UI**

### **📋 Mostrar Usuarios Asignados:**
```typescript
// En componente React
const renderAssignees = (task: Task) => {
  if (!task.assignedTo || task.assignedTo.length === 0) {
    return <Text>Sin asignar</Text>;
  }
  
  if (task.assignedTo.length === 1) {
    return <Text>Asignado a: {getUserName(task.assignedTo[0])}</Text>;
  }
  
  return (
    <View>
      <Text>Equipo ({task.assignedTo.length}):</Text>
      {task.assignedTo.map(userId => (
        <Chip key={userId}>{getUserName(userId)}</Chip>
      ))}
    </View>
  );
};
```

### **➕ Selector Múltiple:**
```typescript
const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

const handleAssignTask = async () => {
  await supabaseService.replaceTaskAssignment(taskId, selectedUsers);
};
```

## 🔒 **Migración Segura**

### **✅ Datos Preservados:**
- Todas las asignaciones existentes se mantienen
- Cada `assigned_to` se convierte en `[assigned_to]`
- No se pierde información

### **💾 Backup Disponible:**
- Columna `assigned_to_backup` con datos originales
- Eliminar después de verificar que todo funciona:
```sql
ALTER TABLE tasks DROP COLUMN assigned_to_backup;
```

### **🔄 Reversión (Si Necesaria):**
```sql
-- Solo si algo sale mal
ALTER TABLE tasks DROP COLUMN assigned_to;
ALTER TABLE tasks RENAME COLUMN assigned_to_backup TO assigned_to;
```

## 🎉 **Beneficios**

### **👥 Colaboración:**
- **Múltiples usuarios** pueden trabajar en la misma tarea
- **Equipos coordinados** para tareas complejas
- **Flexibilidad** en asignaciones

### **📊 Gestión Mejorada:**
- **Visibilidad** de quién está involucrado
- **Distribución** de carga de trabajo
- **Seguimiento** de equipos por proyecto

### **⚡ Performance:**
- **Índices GIN** optimizados para arrays
- **Consultas eficientes** con operadores PostgreSQL
- **Escalabilidad** para equipos grandes

## 🚀 **Próximos Pasos**

1. **🔄 Ejecutar migración** con `./scripts/migrate_assigned_to.sh`
2. **🧪 Probar funcionalidad** con tareas existentes
3. **🎨 Actualizar UI** para mostrar múltiples usuarios
4. **📱 Implementar selector** de múltiples usuarios
5. **✅ Verificar** que todo funciona correctamente

¡**La funcionalidad de asignación múltiple está lista para usar**! 🎯✨ 