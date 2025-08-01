# 🚀 CONFIGURACIÓN DE PERSISTENCIA PARA TIMER DEL DÍA

## ❌ PROBLEMA ACTUAL
El timer del día se pierde al refrescar la app mientras que los timers de tareas sí persisten.

## ✅ SOLUCIÓN SEGURA  
Activar la tabla `work_days` existente + reutilizar `task_timer_sessions`.

---

## 🔍 **DIAGNÓSTICO PREVIO:**

**Ya tienes:**
- ✅ `work_days` tabla (EXISTE pero no se usa)
- ✅ `task_timer_sessions` tabla (FUNCIONA para task timers)
- ❌ Código dice: `"BYPASSING DB - tables not created yet"`

**Solución:**
- ✅ **Activar** tabla `work_days` existente
- ✅ **Modificar** `task_timer_sessions` para sesiones del día  
- ✅ **Script SEGURO** que no rompe nada

---

## 📋 PASOS PARA CONFIGURAR:

### **1. 🔗 Acceder a Supabase Dashboard**
```
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. En el menú izquierdo, click en "SQL Editor"
```

### **2. 📄 Ejecutar Script SEGURO**
```
1. Copia TODO el contenido del archivo: scripts/safe_day_timer_setup.sql
2. Pégalo en el Query Editor de Supabase
3. Click en "Run" (botón ▶️)
```

### **3. ✅ Verificar Ejecución**
Deberías ver mensajes como:
```sql
✅ Columna timesheet_status ya existe en work_days
✅ task_timer_sessions modificada para permitir task_id NULL
✅ Timer del día iniciado, sesión: [uuid]
status: "🎉 TIMER DEL DÍA CONFIGURADO EXITOSAMENTE (MODO SEGURO)"
```

### **4. 🔍 Verificar Estructura**
Al final del script verás la estructura actual de `work_days`:
```
column_name | data_type | is_nullable | column_default
timesheet_status | USER-DEFINED | YES | 'not_started'::timesheet_status
current_session_start | timestamp with time zone | YES | null
actual_duration | integer | YES | 0
```

---

## 🛡️ **POR QUÉ ES SEGURO:**

### **✅ Protecciones del Script:**
- `CREATE TABLE IF NOT EXISTS` → No borra tabla existente
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` → Solo añade si falta
- `CREATE OR REPLACE FUNCTION` → Actualiza funciones sin conflictos
- `DROP POLICY IF EXISTS` → Actualiza políticas seguramente

### **✅ Solo Modifica:**
1. **`task_timer_sessions`**: Permite `task_id = NULL` para sesiones del día
2. **`work_days`**: Añade columnas faltantes (si las hay)
3. **Funciones**: Crea 3 nuevas funciones RPC

### **✅ NO Afecta:**
- ❌ Datos existentes en `work_days`
- ❌ Funcionalidad actual de task timers
- ❌ Otras tablas o código

---

## 🎯 ARQUITECTURA FINAL:

### **🔄 Reutilización Inteligente:**
```
task_timer_sessions
├── task_id = [uuid] → Timer de tarea específica (SIN CAMBIOS)
└── task_id = NULL   → Timer del día (NUEVO)

work_days (EXISTENTE)
├── Campos originales → Conservados
└── Nuevos campos timer → Añadidos si faltan
```

### **⚙️ Funciones RPC Nuevas:**
- **`start_day_timer(user_id)`**: Inicia timer del día
- **`pause_day_timer(user_id)`**: Pausa timer del día  
- **`get_day_timer_stats(user_id, date)`**: Obtiene estadísticas

---

## 🧪 PRUEBAS DESPUÉS DE EJECUTAR:

### **1. Reiniciar App**
```bash
# En tu terminal, mata el proceso actual
Ctrl+C

# Inicia de nuevo
npm start
```

### **2. Probar Timer del Día**
```
1. Inicia el timer del día → "Iniciar Fichaje"
2. Observa los logs en consola (busca: "✅ Day timer started")
3. Refresca la app (Cmd+R en iOS Simulator)
4. ✅ El timer debería mantener estado y tiempo
```

---

## 📝 LOGS ESPERADOS:

### **✅ Éxito en Script:**
```sql
✅ El tipo timesheet_status ya existe, continuando...
✅ Columna timesheet_status ya existe en work_days
✅ task_timer_sessions modificada para permitir task_id NULL
🎉 TIMER DEL DÍA CONFIGURADO EXITOSAMENTE (MODO SEGURO)
```

### **✅ Éxito en App:**
```
🔄 getOrCreateWorkDay using REAL DB for user: [uuid]
✅ Day timer stats obtained: {"totalElapsed":0,"isRunning":false...}
🟢 Starting day timer...
✅ Day timer started, session: [uuid]
```

---

## 🔍 VERIFICACIÓN EN BASE DE DATOS:

### **Sesiones del día:**
```sql
SELECT * FROM task_timer_sessions 
WHERE task_id IS NULL 
ORDER BY start_time DESC;
```

### **Jornadas activadas:**
```sql
SELECT user_id, date, timesheet_status, current_session_start, actual_duration
FROM work_days 
ORDER BY date DESC;
```

---

## 🆘 TROUBLESHOOTING:

### **Error: "relation work_days does not exist"**
- ❌ **Problema grave**: La tabla no existe realmente
- ✅ **Solución**: Ejecuta `scripts/simple_day_timer_setup.sql` (crea tabla nueva)

### **Error: "column task_id cannot be null"**
- ❌ **Problema**: `task_timer_sessions` no se modificó
- ✅ **Solución**: Re-ejecuta solo la sección 3 del script

### **Script ejecuta pero timer no persiste:**
- ✅ Verifica logs de la app para errores específicos
- ✅ Revisa que las funciones RPC se crearon correctamente
- ✅ Verifica políticas RLS con `SELECT * FROM work_days;`

---

## 🎉 RESULTADO FINAL:

**Después de configurar correctamente:**
- ✅ Timer del día persiste al refrescar
- ✅ Mantiene estado (corriendo/pausado)  
- ✅ Guarda tiempo acumulado en `task_timer_sessions`
- ✅ Reutiliza infraestructura existente
- ✅ **NO AFECTA** funcionalidad actual

---

## 🏗️ MIGRACIÓN SEGURA:

```
ANTES:
work_days → EXISTE pero BYPASS
task_timer_sessions → SOLO tareas

DESPUÉS:  
work_days → ACTIVADA + timer fields
task_timer_sessions → Tareas + día (task_id NULL)
```

**¿Necesitas ayuda?** Envía los logs del script SQL si hay errores. 