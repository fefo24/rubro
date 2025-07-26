@echo off
echo 🚀 Iniciando deploy ultra rapido...
echo.

ssh modiin@190.113.12.113 "cd /opt/rubro-api && git pull && pm2 restart rubro-api"

echo.
echo ✅ Deploy completado!
pause
