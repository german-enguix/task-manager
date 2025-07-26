# 🎯 Scripts para Tarea QR Scanner

Este directorio contiene scripts para crear una tarea de prueba con subtareas de **QR Scanner**.

## 📁 Archivos incluidos

- **`add_qr_task_today.sql`** - Script SQL principal
- **`quick_add_qr_task.sh`** - Script bash para ejecución rápida  
- **`README_QR_TASK.md`** - Este archivo

## 🎯 ¿Qué crea el script?

### **Tarea Principal:**
- **📅 Fecha:** Hoy
- **🎯 Título:** "Verificación de equipos con códigos QR"
- **⏱️ Duración:** 2 horas
- **🏢 Proyecto:** Control de Activos
- **📍 Ubicación:** Planta Industrial - Sección A

### **Subtareas creadas:**

1. **🔴 QR REQUERIDO** - Verificar máquina CNC
   - ✅ **Evidencia QR obligatoria**
   - 🔒 **Candado:** Solo se marca ✅ al escanear QR
   - 🎯 **Comportamiento:** Muestra visor de cámara + efectos scanner

2. **🟡 QR OPCIONAL** - Verificar herramientas auxiliares  
   - ⚪ **Evidencia QR opcional**
   - 🔓 **Sin candado:** Se puede marcar ✅ sin escanear
   - 🎯 **Comportamiento:** Visor de cámara disponible si se desea

3. **📋 Completar reporte** - Sin evidencia
   - ✅ **Subtarea normal** sin evidencia requerida

## 🚀 Cómo ejecutar

### **Opción 1: Script automático (Recomendado)**

```bash
# Configurar variables de entorno (solo la primera vez)
export SUPABASE_URL="tu_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"

# Ejecutar script
./scripts/quick_add_qr_task.sh
```

### **Opción 2: SQL Editor de Supabase**

1. Ve a tu dashboard de Supabase
2. Abre **SQL Editor** 
3. Crea una nueva consulta
4. Copia todo el contenido de `add_qr_task_today.sql`
5. Pega y ejecuta ▶️

### **Opción 3: psql directo**

```bash
# Con psql instalado
psql "postgresql://postgres.tu_proyecto:tu_service_key@tu_host/postgres" \
  -f scripts/add_qr_task_today.sql
```

## ✅ ¿Cómo saber si funcionó?

El script muestra mensajes como:

```
🎉 ¡TAREA CON QR SCANNER CREADA EXITOSAMENTE!

📋 RESUMEN:
   📅 Fecha: 2024-01-15
   🆔 Tarea ID: abc123...
   👤 Asignado a: def456...
   📍 Ubicación: Planta Industrial - Sección A

🎯 SUBTAREAS CREADAS:
   1. 🔴 QR REQUERIDO - Máquina CNC (OBLIGATORIO)
   2. 🟡 QR OPCIONAL - Herramientas auxiliares  
   3. 📋 Completar reporte final
```

## 🎮 Cómo probar en la app

1. **Abre tu app** 📱
2. **Ve a la tarea de hoy** (aparecerá en la lista)
3. **Haz clic en la tarea** QR creada
4. **Prueba las subtareas:**

### **Subtarea QR Requerida 🔴:**
- Verás **candado 🔒** (no puedes marcar ✅ sin evidencia)
- Haz clic **"Escanear QR"**
- Se abre **visor de cámara** con efectos visuales
- Haz clic **"Simular Lectura"** 
- ✅ **Se marca automáticamente** como completada
- Botón cambia a **"Evidencia completada"**

### **Subtarea QR Opcional 🟡:**
- **Sin candado** (puedes marcar ✅ libremente)
- **Opción 1:** Marcar ✅ directamente (sin QR)
- **Opción 2:** Clic "Escanear QR" → visor → simular

## 🛠️ Troubleshooting

### **Error: "No se encontró usuario"**
- Verifica que existen usuarios en tu base de datos
- El script busca: `zizi@taskmanager.com`, `german@taskmanager.com`, `albert@taskmanager.com`
- Si no existen, usa cualquier usuario con role 'user' o 'admin'

### **Error: "Variables de entorno faltantes"**
```bash
# Configurar correctamente:
export SUPABASE_URL="https://abc123.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### **Error: "psql no encontrado"**
```bash
# macOS:
brew install postgresql

# Ubuntu/Debian:
sudo apt-get install postgresql-client
```

## 🎯 ¿Para qué sirve esto?

Este script es perfecto para:
- ✅ **Probar** el nuevo QR Scanner
- ✅ **Demostrar** diferencia entre evidencia requerida vs opcional
- ✅ **Validar** que el visor de cámara funciona
- ✅ **Verificar** que la simulación marca las subtareas correctamente
- ✅ **Mostrar** la funcionalidad a clientes/usuarios

## 🔧 Personalización

Puedes editar `add_qr_task_today.sql` para cambiar:
- **Título y descripción** de la tarea
- **Fecha de vencimiento** (`due_date`)
- **Prioridad** (`priority`: low, medium, high, critical)
- **Ubicación** y **proyecto**
- **Textos de las subtareas**
- **Configuración QR** (timeouts, formatos, etc.)

¡**Disfruta probando tu QR Scanner!** 🎉 