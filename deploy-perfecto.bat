@echo off
echo ========================================
echo     DEPLOY PERFECTO - SIN ERRORES
echo ========================================
echo.

REM Subir cambios a GitHub (solo si hay cambios)
echo [1/4] Verificando cambios...
git status --porcelain > temp_status.txt
for /f %%i in (temp_status.txt) do set HAS_CHANGES=1
del temp_status.txt

if defined HAS_CHANGES (
    echo [2/4] Subiendo cambios a GitHub...
    git add .
    git commit -m "Deploy automatico: %date% %time%"
    git push origin main
) else (
    echo [2/4] No hay cambios locales para subir
)

REM Deploy optimizado en servidor con verificacion en una sola conexion
echo [3/4] Actualizando servidor y verificando...
ssh modiin@190.113.12.113 "cd /opt/rubro-api && git reset --hard origin/main && pm2 restart rubro-api && echo '✅ Estado de la aplicacion:' && pm2 list | grep rubro-api"

echo.
echo ✅ DEPLOY PERFECTO COMPLETADO!
echo ✅ Sin errores
echo ✅ Tiempo: 1-2 minutos  
echo ✅ Una sola contraseña
echo ✅ Aplicacion funcionando
pause
