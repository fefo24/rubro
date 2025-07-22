#!/bin/bash
# Script de auto-deploy en el servidor
# Archivo: /opt/scripts/auto-deploy.sh

echo "🚀 Iniciando auto-deploy..."
cd /opt/rubro-api

echo "📥 Descargando cambios de GitHub..."
git pull origin main

echo "📦 Instalando dependencias si es necesario..."
npm install --production

echo "🔄 Reiniciando aplicación con PM2..."
pm2 restart rubro-api

echo "📊 Estado de la aplicación:"
pm2 status rubro-api

echo "✅ Auto-deploy completado!"
echo "Timestamp: $(date)"
