#!/bin/bash

# Script para migrar assigned_to de UUID a UUID[]
# Permite asignación múltiple de usuarios a tareas

echo "🚀 MIGRACIÓN: assigned_to UUID → UUID[]"
echo "==============================================="
echo "✨ Permite asignar múltiples usuarios a una tarea"
echo ""

# Verificar variables de entorno
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ ERROR: Variables de entorno faltantes"
    echo "💡 CONFIGURAR:"
    echo "   export SUPABASE_URL='https://tu-proyecto.supabase.co'"
    echo "   export SUPABASE_SERVICE_ROLE_KEY='tu-service-role-key'"
    echo ""
    echo "📍 Encuentra estas variables en:"
    echo "   👉 Supabase Dashboard > Settings > API"
    exit 1
fi

# Verificar psql
if ! command -v psql &> /dev/null; then
    echo "❌ ERROR: psql no está instalado"
    echo "💡 INSTALAR:"
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

echo "🔍 VERIFICANDO CONFIGURACIÓN..."
echo "   📡 Supabase URL: ${SUPABASE_URL}"
echo "   🔑 Service Key: ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."
echo ""

# Construir URL de conexión
DB_URL="postgresql://postgres.${SUPABASE_URL#*://}:${SUPABASE_SERVICE_ROLE_KEY}@${SUPABASE_URL#*://}/postgres"

echo "🔄 EJECUTANDO MIGRACIÓN..."
echo ""

# Ejecutar migración
psql "$DB_URL" -f "$(dirname "$0")/migrate_assigned_to_array.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ MIGRACIÓN COMPLETADA EXITOSAMENTE"
    echo ""
    echo "🎯 CAMBIOS REALIZADOS:"
    echo "   • assigned_to ahora es UUID[] (array de usuarios)"
    echo "   • Datos existentes migrados automáticamente"
    echo "   • Índices GIN creados para performance"
    echo "   • Backup en assigned_to_backup (eliminar después)"
    echo ""
    echo "📱 NUEVAS FUNCIONALIDADES:"
    echo "   • ➕ supabaseService.addUserToTask(taskId, userId)"
    echo "   • ➖ supabaseService.removeUserFromTask(taskId, userId)"
    echo "   • 🔄 supabaseService.replaceTaskAssignment(taskId, userIds[])"
    echo "   • 📋 supabaseService.getTaskAssignees(taskId)"
    echo ""
    echo "💻 EJEMPLOS DE USO:"
    echo "   // Asignar usuario adicional"
    echo "   await supabaseService.addUserToTask('task-id', 'user-id')"
    echo ""
    echo "   // Asignar múltiples usuarios"
    echo "   await supabaseService.replaceTaskAssignment('task-id', ['user1', 'user2'])"
    echo ""
    echo "   // Remover usuario"
    echo "   await supabaseService.removeUserFromTask('task-id', 'user-id')"
    echo ""
    echo "✅ CÓDIGO TYPESCRIPT YA ACTUALIZADO"
    echo "🎉 ¡LA FUNCIONALIDAD ESTÁ LISTA!"
else
    echo ""
    echo "❌ ERROR EN MIGRACIÓN"
    echo ""
    echo "💡 SOLUCIÓN MANUAL:"
    echo "   1. Copia el contenido de migrate_assigned_to_array.sql"
    echo "   2. Pégalo en Supabase > SQL Editor"
    echo "   3. Ejecuta el script manualmente"
    echo ""
    echo "🔄 REVERSAR MIGRACIÓN (si es necesario):"
    echo "   ALTER TABLE tasks DROP COLUMN assigned_to;"
    echo "   ALTER TABLE tasks RENAME COLUMN assigned_to_backup TO assigned_to;"
    exit 1
fi 