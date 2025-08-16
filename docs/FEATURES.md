# ✨ Funcionalidades Clave (Notificaciones, Timers, Asignación Múltiple, Proyectos)

Documento unificado de funcionalidades y su uso desde la app y la base de datos.

---

## 🔔 Notificaciones

Características:
- Persistencia en Supabase (`work_notifications`)
- Campanita con badge de no leídas
- Modal de lista con lectura al click y navegación a tarea (si `taskId`)
- Simulación desde `ProfileScreen`

Endpoints del servicio (`src/services/supabaseService.ts`):

```ts
// Obtener notificaciones del usuario
async getWorkNotifications(userId: string, unreadOnly: boolean = false)

// Marcar notificación como leída
async markNotificationAsRead(notificationId: string)

// Crear notificación
async createWorkNotification(userId: string, title: string, message: string, options)
```

Poblar datos de ejemplo: `scripts/create_zizi_notifications_simple.sql`.

---

## ⏱️ Timers conectados

- Timer del día independiente (en `work_days` + `task_timer_sessions` con `task_id = NULL`)
- Timers por tarea suman al display del día
- Cálculo combinado en `DayTimeCard` (`getDayOnlyDuration()` + `getTasksCurrentTime()`)

Experiencia esperada:
- Solo día, solo tareas, ambos activos y acumulado sin timers, con desglose visual.

---

## 👥 Asignación múltiple de usuarios a tareas

- `tasks.assigned_to` como `UUID[]`
- Índices GIN y consultas con operadores de arrays

APIs (resumen):

```ts
await supabaseService.addUserToTask(taskId, userId);
await supabaseService.removeUserFromTask(taskId, userId);
await supabaseService.replaceTaskAssignment(taskId, ['user1-id', 'user2-id']);
```

SQL útil:

```sql
-- Tareas de un usuario
SELECT * FROM tasks WHERE 'user-uuid' = ANY(assigned_to);

-- Intersección con múltiples
SELECT * FROM tasks WHERE assigned_to && ARRAY['user1-uuid','user2-uuid'];
```

---

## 📦 Proyectos simples

- Tabla `projects` y relación con tareas
- Asignaciones de usuarios a proyectos derivadas de tareas (opcional)

Resultado: pantalla de proyectos con agrupación y usuarios asignados si corresponde.

---

## 🗄️ Storage de audio

- Bucket `task-evidences` público (50MB)
- Políticas para subir, ver y borrar
- Reproducción persistente tras refrescar (URLs públicas)

Si no está configurado: la app hace fallback temporal con URI local y advierte que se perderá al refrescar.

---

## 🧾 Reportes de Problemas

- Diálogo de reporte integrado en `TaskDetailScreen`
- 8 tipos predefinidos y 4 niveles de severidad
- Persistencia en tabla `problem_reports`

Activación: crea la tabla `problem_reports` si aún no existe.

Resultado: podrás registrar reportes desde la app y verlos persistidos.

---

## 📱 UI relevante

- `NotificationsBell.tsx` (badge, lista y navegación)
- `NotificationDialog.tsx` (modal de última notificación)
- `DayTimeCard.tsx` (display combinado)
- `HomeScreen.tsx` (pasa `tasks` a `DayTimeCard` y callbacks)
- `TaskDetailScreen.tsx` (timers por tarea y evidencias)
  - Incluye el diálogo de reportes de problemas

