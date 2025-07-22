@echo off
echo ========================================
echo     DEPLOY AUTOMATICO AL SERVIDOR
echo ========================================
echo.

echo [1/4] Subiendo cambios a GitHub...
git add .
git commit -m "Auto-deploy: %date% %time%"
git push origin main

echo.
echo [2/4] Conectando al servidor...
echo [3/4] Actualizando codigo en servidor...
echo [4/4] Reiniciando aplicacion...

ssh modiin@190.113.12.113 "cd /opt/rubro-api && git pull origin main && pm2 restart rubro-api && pm2 logs rubro-api --lines 5"

echo.
echo ✅ DEPLOY COMPLETADO!
echo La aplicacion se ha actualizado y reiniciado exitosamente.
pause
