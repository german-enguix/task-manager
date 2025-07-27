#!/bin/bash

# Script para FIX de políticas RLS problemáticas
# Elimina verificaciones de admin que causan "permission denied for table users"

echo "🔧 FIX: Políticas RLS Problemáticas"
echo "=================================="
echo "❌ Solucionando: permission denied for table users"
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

echo "🔧 EJECUTANDO FIX DE POLÍTICAS RLS..."
echo ""

# Ejecutar fix
psql "$DB_URL" -f "$(dirname "$0")/fix_rls_policies_simple.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ FIX COMPLETADO EXITOSAMENTE"
    echo ""
    echo "🎯 PROBLEMA SOLUCIONADO:"
    echo "   ❌ Eliminadas verificaciones problemáticas de auth.users"
    echo "   ✅ Políticas simplificadas solo verifican assigned_to"
    echo "   ✅ Sin consultas a roles de admin"
    echo "   ✅ No más 'permission denied for table users'"
    echo ""
    echo "🔒 LÓGICA DE ACCESO:"
    echo "   • Solo usuarios en assigned_to[] ven las tareas"
    echo "   • Una vez asignado: acceso completo (ver, editar, comentar)"
    echo "   • Reportes: visibles para asignados + autor"
    echo "   • Solo autor puede eliminar sus comentarios/reportes"
    echo ""
    echo "💻 PRÓXIMOS PASOS:"
    echo "   1. German ya puede acceder a las tareas asignadas"
    echo "   2. No más errores 403 Forbidden"
    echo "   3. Funcionalidad completa restaurada"
    echo ""
    echo "🎉 ¡EL PROBLEMA ESTÁ SOLUCIONADO!"
else
    echo ""
    echo "❌ ERROR EN FIX"
    echo ""
    echo "💡 SOLUCIÓN MANUAL:"
    echo "   1. Copia el contenido de fix_rls_policies_simple.sql"
    echo "   2. Pégalo en Supabase > SQL Editor"
    echo "   3. Ejecuta el script manualmente"
    echo ""
    echo "🔄 SI PERSISTE EL PROBLEMA:"
    echo "   • Verifica que la migración de assigned_to se completó"
    echo "   • Revisa los logs de Supabase para más detalles"
    echo "   • Contacta con el equipo de desarrollo"
    exit 1
fi 