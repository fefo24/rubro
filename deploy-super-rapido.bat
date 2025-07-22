@echo off
echo ========================================
echo     DEPLOY SUPER RAPIDO (1-2 minutos)
echo ========================================
echo.

REM Subir cambios a GitHub
echo [1/3] Subiendo a GitHub...
git add .
git commit -m "Deploy rapido: %date% %time%"
git push origin main

REM Deploy optimizado en servidor
echo [2/3] Deploy optimizado en servidor...
ssh -i nueva-clave-segura modiin@190.113.12.113 "cd /home/modiin/rubro && git reset --hard origin/main && pm2 restart rubro-api --update-env"

REM Verificar estado
echo [3/3] Verificando estado...
ssh -i nueva-clave-segura modiin@190.113.12.113 "pm2 status rubro-api"

echo.
echo ✅ DEPLOY RAPIDO COMPLETADO!
echo Tiempo total esperado: 1-2 minutos
pause
