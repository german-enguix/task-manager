# 🆘 Troubleshooting (RLS, Storage, Timers, Login)

Guía rápida para resolver incidencias comunes.

---

## 1) 403 Forbidden / permission denied (RLS)

Síntoma:
```
Error 403 (Forbidden): permission denied for table users/tasks
```

Solución recomendada:

1. Ejecuta el fix simple de políticas:
   - `scripts/fix_rls_policies_simple.sql`

2. O vía shell:
   - `./scripts/fix_rls_policies.sh`

Principios finales:
- Acceso a `tasks` solo si `auth.uid()` ∈ `assigned_to[]`
- Evitar consultar `auth.users` desde políticas

---

## 2) Storage: audios no persisten tras refrescar

Causa: bucket/políticas no configuradas.

Checklist:
- Bucket `task-evidences` público creado
- Políticas de insert/select/delete aplicadas
- Logs de subida en consola sin errores

Verificación SQL:
```sql
SELECT * FROM storage.buckets WHERE id = 'task-evidences';
SELECT * FROM pg_policies WHERE tablename='objects' AND schemaname='storage';
```

---

## 3) Timer del día no persiste

Acción:
1. Ejecuta `scripts/safe_day_timer_setup.sql`
2. Reinicia la app
3. Valida funciones RPC creadas

Consultas útiles:
```sql
SELECT * FROM task_timer_sessions WHERE task_id IS NULL ORDER BY start_time DESC;
SELECT user_id, date, timesheet_status FROM work_days ORDER BY date DESC;
```

---

## 4) Login falla / usuarios no encontrados

Checklist:
- Usuarios creados en Authentication con Email confirmed ✅
- `profiles` creada (trigger de auto-creación activo)

Consulta de validación:
```sql
SELECT u.email, p.full_name, p.role
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
ORDER BY u.email;
```

---

## 5) Notificaciones sin navegación a tarea

Asegura que al insertar notificaciones incluyas `action_data` con `taskId` válido. Verifica que `NotificationsBell` use `Pressable` y marque como leída al click.

---

Si persisten problemas, abre un issue con:
- Error exacto y captura
- Logs de la consola
- Resultado de las consultas SQL de verificación

