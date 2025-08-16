# 🚀 Guía de Setup (Supabase, Auth, Storage, Timers, Datos Reales)

Esta guía unifica y simplifica la configuración completa del proyecto: Supabase, autenticación, Storage, timers y datos reales. Sigue el orden sugerido para tener todo funcionando de punta a punta.

---

## 📋 Requisitos

- Node.js 18+
- npm
- Expo CLI (`npm i -g @expo/cli`)
- Proyecto Supabase creado

### Variables de entorno

Crear `.env` en la raíz:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica
NODE_ENV=development
```

---

## 🗄️ Base de Datos (setup recomendado)

Configura tu esquema en Supabase (SQL Editor) con las tablas y RLS que tu caso requiera. Recomendado:
- Tablas: `tasks`, `subtasks`, `tags`, `task_tags`
- Relaciones: `subtasks.task_id` → `tasks.id`, `task_tags` (N:N)
- Índices: por `assigned_to`, `status`, `due_date`, FKs
- RLS: acceso por `auth.uid()` y arrays `assigned_to`

2) Crea usuarios de prueba en Auth (Authentication → Users → Add user):

- `zizi@taskmanager.com` / `test123` (Email confirmed ✅)
- `german@taskmanager.com` / `test123` (Email confirmed ✅)
- `albert@taskmanager.com` / `test123` (Email confirmed ✅)
- `manager@taskapp.com` / `test123` (Email confirmed ✅)

3) (Opcional) Carga datos de ejemplo manualmente para desarrollo.

---

## 🔐 Autenticación (recomendada)

- Uso estándar de Supabase Auth (email + password)
- Tabla `profiles` extendiendo `auth.users` con trigger de auto-creación

Puedes extender `auth.users` con una tabla `profiles` y un trigger de auto-creación.

Verificación rápida:

```sql
SELECT u.email, p.full_name, p.role
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email LIKE '%taskmanager.com%'
ORDER BY u.email;
```

Opcional (sistema híbrido por nombre): si prefieres login por nombre mapeado a emails, sigue la guía de UI del login existente. La seguridad siempre la aplica Supabase Auth (JWT) igualmente.

---

## 🗄️ Storage (evidencias de audio)

1) Crea el bucket público `task-evidences` en Storage

2) Políticas mínimas (ejecutar en SQL Editor):

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('task-evidences','task-evidences', true, 52428800, ARRAY['audio/m4a','audio/mp4','audio/wav','audio/mpeg'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'task-evidences' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view files" ON storage.objects
FOR SELECT USING (bucket_id = 'task-evidences');

CREATE POLICY "Authenticated users can delete files" ON storage.objects
FOR DELETE USING (bucket_id = 'task-evidences' AND auth.role() = 'authenticated');
```

Comprobación:

```sql
SELECT * FROM storage.buckets WHERE id = 'task-evidences';
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

---

## ⏱️ Timers (persistencia segura)

Para activar persistencia del timer del día reutilizando `task_timer_sessions`:

1) Ejecuta `scripts/safe_day_timer_setup.sql`

Incluye:
- Permitir `task_id = NULL` para sesiones del día
- Añadir/asegurar campos mínimos en `work_days`
- Funciones RPC: `start_day_timer`, `pause_day_timer`, `get_day_timer_stats`

Verificación rápida:

```sql
SELECT * FROM task_timer_sessions WHERE task_id IS NULL ORDER BY start_time DESC;
SELECT user_id, date, timesheet_status FROM work_days ORDER BY date DESC;
```

---

## 📦 Proyectos (opcional y simple)

Si necesitas la pantalla de proyectos con datos reales, crea una tabla `projects` simple y relaciona tareas. 
(Opcional) Si vienes de un esquema antiguo: ejecuta `scripts/migrate_assigned_team_to_assigned_to.sql` para unificar en `assigned_to UUID[]`.

---

## 🧾 Reportes de Problemas (opcional)

Para habilitar la funcionalidad de reportes desde la app, crea una tabla `problem_reports` acorde a tus necesidades. El diálogo en `TaskDetailScreen` persistirá los registros.

---

## 🔔 Notificaciones de ejemplo

Para poblar notificaciones realistas y navegables (tarea vinculada), inserta registros en `work_notifications` incluyendo `action_data` con `taskId`.

Flujo esperado en la app:
1) Badge rojo en campanita con conteo
2) Click → modal con lista
3) Click en ítem → se marca como leída y navega a la tarea (si tiene `taskId`)

---

## ✅ Verificación final

1) Arranca la app: `npm start`
2) Login con cualquier usuario de prueba
3) Comprueba: tareas, subtareas, comentarios, timers, notificaciones y reproducción de audios

Consultas útiles:

```sql
-- Tareas creadas
SELECT count(*) FROM tasks;

-- Usuarios de prueba
SELECT email FROM auth.users ORDER BY email;
```

---

## 🆘 Troubleshooting rápido

- 403 RLS en tasks/users → aplica el fix consolidado (ver `docs/TROUBLESHOOTING.md`)
- Storage sin reproducir audios tras refrescar → revisa bucket/políticas y logs de subida
- Timer del día no persiste → re-ejecuta `safe_day_timer_setup.sql` y valida funciones RPC

---

Con esto, tienes un entorno completo y consistente listo para desarrollo y demos reales. 💪

