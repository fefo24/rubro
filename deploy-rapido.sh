#!/bin/bash
# Script optimizado de deploy rápido
# Tiempo esperado: 30-60 segundos

echo "🚀 [$(date)] Iniciando deploy rápido..."

# Cambiar al directorio
cd /opt/rubro-api || exit 1

# Git pull solo si hay cambios
echo "📥 Verificando cambios en GitHub..."
git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "✅ No hay cambios nuevos"
else
    echo "📥 Descargando cambios..."
    git reset --hard origin/main
fi

# Reiniciar solo si es necesario
echo "🔄 Reiniciando aplicación..."
pm2 restart rubro-api --update-env

echo "✅ [$(date)] Deploy completado"
echo "📊 Estado:"
pm2 status rubro-api --no-colors
