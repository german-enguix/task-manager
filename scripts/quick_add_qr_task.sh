#!/bin/bash

# =============================================
# SCRIPT RÁPIDO PARA AÑADIR TAREA QR
# =============================================
# Ejecuta el script SQL para crear una tarea 
# con subtareas QR en Supabase
# =============================================

echo "🎯 Creando tarea con QR Scanner..."
echo ""

# Verificar que existen las variables de entorno
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Variables de entorno faltantes"
    echo ""
    echo "Necesitas configurar:"
    echo "  export SUPABASE_URL=tu_url_de_supabase"
    echo "  export SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key"
    echo ""
    exit 1
fi

# Verificar que psql está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql no está instalado"
    echo ""
    echo "Instala PostgreSQL client:"
    echo "  # macOS:"
    echo "  brew install postgresql"
    echo ""
    echo "  # Ubuntu/Debian:"
    echo "  sudo apt-get install postgresql-client"
    echo ""
    exit 1
fi

# Ejecutar scripts SQL
echo "🚀 Ejecutando scripts SQL..."
echo ""

# Construir la conexión URL para psql
DB_URL="postgresql://postgres.${SUPABASE_URL#*://}:${SUPABASE_SERVICE_ROLE_KEY}@${SUPABASE_URL#*://}/postgres"

# PASO 1: Añadir 'qr' al enum evidence_type
echo "📝 Paso 1: Actualizando enum evidence_type..."
psql "$DB_URL" -f "$(dirname "$0")/add_qr_evidence_type.sql"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error actualizando enum evidence_type"
    echo "💡 Intenta ejecutar manualmente: add_qr_evidence_type.sql"
    exit 1
fi

echo ""
echo "📝 Paso 2: Creando tarea con QR..."

# PASO 2: Crear la tarea QR
psql "$DB_URL" -f "$(dirname "$0")/add_qr_task_today.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡TAREA QR CREADA EXITOSAMENTE!"
    echo ""
    echo "🎯 Ahora puedes:"
    echo "  1. Abrir tu app"
    echo "  2. Ver la nueva tarea de hoy"
    echo "  3. Probar el QR Scanner"
    echo "  4. Observar diferencia entre REQUERIDO vs OPCIONAL"
    echo ""
else
    echo ""
    echo "❌ Error ejecutando el script"
    echo ""
    echo "💡 Alternativas:"
    echo "  1. Ejecuta manualmente: psql \$DB_URL -f add_qr_task_today.sql"
    echo "  2. Copia el contenido del archivo y pégalo en Supabase SQL Editor"
    echo ""
fi 