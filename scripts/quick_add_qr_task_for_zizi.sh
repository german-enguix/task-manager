#!/bin/bash

# =============================================
# SCRIPT RÁPIDO PARA AÑADIR TAREA QR A ZIZI
# =============================================
# Ejecuta el script SQL para crear una tarea 
# QR específicamente para ZIZI en Supabase
# =============================================

echo "🎯 Creando tarea QR para ZIZI..."
echo ""

# Verificar que existen las variables de entorno
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Variables de entorno faltantes"
    echo ""
    echo "Necesitas configurar:"
    echo "  export SUPABASE_URL=tu_url_de_supabase"
    echo "  export SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key"
    echo ""
    echo "💡 Alternativamente, ejecuta manualmente en Supabase SQL Editor:"
    echo "  1. Copia el contenido de add_qr_task_for_zizi_today.sql"
    echo "  2. Pégalo en SQL Editor y ejecuta"
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
    echo "💡 Alternativamente, ejecuta manualmente en Supabase SQL Editor:"
    echo "  1. Copia el contenido de add_qr_task_for_zizi_today.sql"
    echo "  2. Pégalo en SQL Editor y ejecuta"
    echo ""
    exit 1
fi

# Ejecutar scripts SQL
echo "🚀 Ejecutando scripts SQL..."
echo ""

# Construir la conexión URL para psql
DB_URL="postgresql://postgres.${SUPABASE_URL#*://}:${SUPABASE_SERVICE_ROLE_KEY}@${SUPABASE_URL#*://}/postgres"

# PASO 1: Verificar/añadir 'qr' al enum evidence_type
echo "📝 Paso 1: Verificando enum evidence_type..."
psql "$DB_URL" -f "$(dirname "$0")/add_qr_evidence_type.sql"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error actualizando enum evidence_type"
    echo "💡 Ejecuta manualmente en Supabase SQL Editor:"
    echo "  1. Copia add_qr_evidence_type.sql"
    echo "  2. Ejecuta primero para añadir tipo 'qr'"
    exit 1
fi

echo ""
echo "📝 Paso 2: Creando tarea QR para ZIZI..."

# PASO 2: Crear la tarea QR específica para ZIZI
psql "$DB_URL" -f "$(dirname "$0")/add_qr_task_for_zizi_today.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡TAREA QR PARA ZIZI CREADA EXITOSAMENTE!"
    echo ""
    echo "🎯 Próximos pasos:"
    echo "  📱 1. Abre la app como usuario ZIZI"
    echo "  📅 2. Ve a tareas de hoy"
    echo "  🎮 3. Busca 'Verificación QR - Equipos Industriales'"
    echo "  🔴 4. Prueba subtarea REQUERIDA (con candado 🔒)"
    echo "  🟡 5. Prueba subtarea OPCIONAL (sin candado 🔓)"
    echo ""
    echo "🎭 Comportamientos esperados:"
    echo "  • QR Requerida: Solo ✅ al escanear QR"
    echo "  • QR Opcional: ✅ directo o con QR"
    echo "  • Scanner: Visor cámara + efectos + 'Simular Lectura'"
    echo ""
else
    echo ""
    echo "❌ Error creando tarea QR para ZIZI"
    echo ""
    echo "💡 Alternativas:"
    echo "  1. Revisa que ZIZI existe en auth.users y profiles"
    echo "  2. Ejecuta manualmente en Supabase SQL Editor:"
    echo "     - Copia add_qr_task_for_zizi_today.sql"
    echo "     - Pega y ejecuta en SQL Editor"
    echo "  3. Verifica conexión a Supabase"
    echo ""
fi 