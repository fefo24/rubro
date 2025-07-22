@echo off
echo ===@echo off
echo 🚀 Iniciando deploy ultra rapido...
echo.

REM Usando la nueva clave SSH segura y usuario correcto
ssh -i nueva-clave-segura modiin@190.113.12.113 "cd /home/modiin/rubro && git pull && pm2 restart rubro-api"

echo.
echo ✅ Deploy completado!
pause===========================
echo     DEPLOY ULTRA RAPIDO - UNA CLAVE
echo ========================================
echo.

REM Verificar si hay cambios locales
echo [1/3] Verificando cambios...
for /f "tokens=*" %%i in ('git status --porcelain') do set HAS_CHANGES=1

if defined HAS_CHANGES (
    echo [2/3] Subiendo cambios a GitHub...
    git add . && git commit -m "Deploy: %date% %time%" && git push origin main
) else (
    echo [2/3] No hay cambios nuevos
)

REM Deploy completo en una sola conexion SSH
echo [3/3] Deploy completo al servidor (una sola contraseña)...
@echo off
echo � Iniciando deploy ultra rapido...
echo.

REM Usando la nueva clave SSH segura
ssh -i nueva-clave-segura modii@190.113.12.113 "cd /home/modii/rubro && git pull && pm2 restart rubro-app"

echo.
echo ✅ Deploy completado!
pause

echo.
echo 🎉 DEPLOY ULTRA RAPIDO COMPLETADO!
echo ✅ Una sola contraseña requerida
echo ✅ Tiempo: 30-60 segundos
echo ✅ Todo en una conexion
pause
