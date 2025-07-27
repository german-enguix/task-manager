# 🔧 Fix: Permission Denied for Table Users

## ❌ **Problema**
Al intentar acceder a tareas específicas, aparece:
```
Error 403 (Forbidden)
permission denied for table users
```

## 🔍 **Causa**
Las políticas RLS incluían verificaciones de roles de admin:
```sql
auth.uid() IN (SELECT id FROM auth.users WHERE auth.jwt() ->> 'role' = 'admin')
```

Los usuarios normales **no tienen permisos** para leer `auth.users`.

## ✅ **Solución**

### **⚡ Ejecución Automática:**
```bash
./scripts/fix_rls_policies.sh
```

### **📝 Ejecución Manual:**
1. Copia `scripts/fix_rls_policies_simple.sql`
2. Ejecútalo en **Supabase > SQL Editor**

## 🎯 **Lo que hace el fix**

### **❌ ELIMINA:**
- Verificaciones problemáticas de `auth.users`
- Consultas a roles de admin
- Complejidad innecesaria

### **✅ MANTIENE:**
- Solo usuarios asignados ven tareas: `auth.uid() = ANY(assigned_to)`
- Acceso completo una vez asignado
- Autor puede eliminar sus reportes

## 🔒 **Lógica de Acceso Final**

- **Tasks**: Solo usuarios en `assigned_to[]`
- **Comments**: Solo usuarios asignados a la tarea
- **Reports**: Usuarios asignados + autor del reporte
- **Delete**: Solo autor puede eliminar sus comentarios/reportes

## 🎉 **Resultado**
- ✅ German puede acceder a sus tareas asignadas
- ✅ No más errores 403 Forbidden
- ✅ Funcionalidad completa restaurada
- ✅ Seguridad mantenida (solo usuarios asignados) 