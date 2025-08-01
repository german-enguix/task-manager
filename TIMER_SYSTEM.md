# 🕐 Sistema de Timers Conectados

## 📋 Descripción General

El sistema de timers ha sido mejorado para conectar el **timer del día** con los **timers de las tareas individuales**, proporcionando una vista unificada del tiempo trabajado.

## 🏗️ Arquitectura

### **Timer del Día (Independiente)**
- Puede iniciarse sin necesidad de tener tareas activas
- Se mantiene en `workDay.timesheet`
- Funciona de manera independiente

### **Timers de Tareas**
- Cada tarea tiene su propio timer (`task.timer`)
- Su tiempo se suma automáticamente al display del día
- Pueden ejecutarse simultáneamente

### **Display Combinado**
- **Tiempo Total = Timer del día + Suma de timers de tareas**
- Se actualiza en tiempo real
- Muestra desglose visual

## 🎯 Funcionalidades

### **Timer del Día**
```typescript
// Puede iniciarse independientemente
onStartTimesheet() // Inicia solo el timer del día
onPauseTimesheet() // Pausa solo el timer del día
onFinishTimesheet() // Finaliza solo el timer del día
```

### **Timers de Tareas**
```typescript
// Cada tarea puede tener su timer activo
task.timer.isRunning = true // Timer de tarea activo
task.timer.totalElapsed = 3600 // Tiempo acumulado en segundos
```

### **Cálculo Combinado**
```typescript
// En DayTimeCard.tsx
const getTotalDisplayDuration = (): number => {
  const dayTime = getDayOnlyDuration(); // Timer del día
  const tasksTime = getTasksCurrentTime(); // Suma de tareas
  return dayTime + tasksTime; // Total combinado
};
```

## 📱 Experiencia de Usuario

### **Estados Visuales**

#### **Solo Timer del Día Activo**
```
⏰ 02:30:15
🟢 Timer del día activo

📊 Desglose:
📅 Día: 02:30:15 ▶️
```

#### **Solo Timers de Tareas Activos**
```
⏰ 01:45:30
🟢 2 tareas activas

📊 Desglose:
📋 Tareas: 01:45:30 ▶️
```

#### **Ambos Activos**
```
⏰ 04:15:45
🟢 Día + 3 tareas activas

📊 Desglose:
📅 Día: 02:30:15 ▶️
📋 Tareas: 01:45:30 ▶️
```

#### **Tiempo Acumulado (Sin Timers Activos)**
```
⏰ 08:30:00

📊 Desglose:
📅 Día: 06:00:00
📋 Tareas: 02:30:00
```

## 🔧 Implementación Técnica

### **Archivos Modificados**

#### **1. `DayTimeCard.tsx`**
- ✅ Recibe `tasks[]` como prop
- ✅ Función `getTasksCurrentTime()` - calcula tiempo de tareas
- ✅ Función `getActiveTasksCount()` - cuenta tareas activas
- ✅ Función `getDayOnlyDuration()` - tiempo solo del día
- ✅ UI de desglose visual mejorada

#### **2. `HomeScreen.tsx`**
- ✅ Pasa `tasks` a `DayTimeCard`
- ✅ Sistema de actualización automática
- ✅ Callback `handleTaskTimerChange()`

### **Flujo de Datos**
```
TaskDetailScreen → timer change → HomeScreen.handleTaskTimerChange()
                                       ↓
HomeScreen → tasks[] → DayTimeCard → cálculo combinado
```

## 🚀 Beneficios

### **Para el Usuario**
- ✅ **Flexibilidad**: Timer del día independiente
- ✅ **Precisión**: Tiempo de tareas se suma automáticamente  
- ✅ **Visibilidad**: Desglose claro del tiempo
- ✅ **Tiempo real**: Actualización automática

### **Para el Sistema**
- ✅ **Modularidad**: Timers independientes pero conectados
- ✅ **Escalabilidad**: Múltiples tareas simultáneas
- ✅ **Mantenibilidad**: Lógica separada por responsabilidades

## 📈 Casos de Uso

### **Caso 1: Trabajo General + Tareas Específicas**
```
1. Usuario inicia timer del día (trabajo general)
2. Inicia timer de "Tarea A" (trabajo específico)  
3. Para timer de "Tarea A", sigue timer del día
4. Inicia timer de "Tarea B"
5. Total = Tiempo día + Tiempo Tarea B
```

### **Caso 2: Solo Tareas Específicas**
```
1. Usuario NO inicia timer del día
2. Inicia timer de "Tarea A"
3. Inicia timer de "Tarea B" (simultáneo)
4. Total = Tiempo Tarea A + Tiempo Tarea B
```

### **Caso 3: Solo Trabajo General**
```
1. Usuario inicia timer del día
2. NO inicia timers de tareas
3. Total = Solo tiempo del día
```

## 🔮 Posibles Mejoras Futuras

- 📊 **Reportes**: Desglose detallado por tarea
- 🎯 **Metas**: Objetivos de tiempo por día/tarea
- 📈 **Analytics**: Patrones de trabajo y productividad
- 🔔 **Notificaciones**: Recordatorios de tiempo
- 💾 **Persistencia**: Guardar estados en base de datos 