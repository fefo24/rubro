#!/bin/bash
# =========================================
# SCRIPT DE DEPLOY AUTOMÁTICO 
# Servidor: 190.113.12.113
# =========================================

echo "🚀 Iniciando deploy al servidor remoto..."

# Variables del servidor
SERVER_IP="190.113.12.113"
SERVER_USER="modiin" 
SSH_PASS="Hormiga3467@#"
DB_USER="davrubro"
DB_PASS="POkuy3447jl"
DB_NAME="rubro_db"

# Directorio del proyecto en el servidor
REMOTE_PATH="/home/modiin/rubro-backend"

echo "📁 1. Sincronizando archivos del backend..."

# Subir archivos usando scp
scp -r ./controllers/ $SERVER_USER@$SERVER_IP:$REMOTE_PATH/
scp -r ./middleware/ $SERVER_USER@$SERVER_IP:$REMOTE_PATH/
scp -r ./utils/ $SERVER_USER@$SERVER_IP:$REMOTE_PATH/
scp ./app.js $SERVER_USER@$SERVER_IP:$REMOTE_PATH/
scp ./db.js $SERVER_USER@$SERVER_IP:$REMOTE_PATH/
scp ./package.json $SERVER_USER@$SERVER_IP:$REMOTE_PATH/

echo "🔄 2. Reiniciando servicio en el servidor..."

# Conectar por SSH y reiniciar el servicio
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd /home/modiin/rubro-backend
npm install
pm2 restart rubro-backend || pm2 start app.js --name rubro-backend
pm2 save
echo "✅ Backend actualizado y reiniciado"
EOF

echo "💾 3. Ejecutando script SQL en la base de datos..."

# Ejecutar el script SQL en la base de datos remota
mysql -h $SERVER_IP -u $DB_USER -p$DB_PASS $DB_NAME < ../actualizar-chats-eliminados.sql

echo "🎯 Deploy completado exitosamente!"
echo "Backend actualizado en: http://$SERVER_IP:3000"
