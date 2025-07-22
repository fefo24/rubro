# Script de Deploy Automático
# Archivo: deploy-automatico.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     DEPLOY AUTOMATICO AL SERVIDOR" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si hay cambios
$changes = git status --porcelain
if ($changes) {
    Write-Host "[1/5] Detectados cambios locales..." -ForegroundColor Yellow
    
    # Subir cambios a GitHub
    Write-Host "[2/5] Subiendo cambios a GitHub..." -ForegroundColor Green
    git add .
    $commitMessage = "Auto-deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git commit -m $commitMessage
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Cambios subidos exitosamente a GitHub" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al subir cambios a GitHub" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[1/5] No hay cambios locales detectados" -ForegroundColor Yellow
    Write-Host "[2/5] Verificando actualizaciones en GitHub..." -ForegroundColor Green
}

# Actualizar servidor
Write-Host "[3/5] Conectando al servidor..." -ForegroundColor Green
Write-Host "[4/5] Actualizando código en servidor..." -ForegroundColor Green
Write-Host "[5/5] Reiniciando aplicación..." -ForegroundColor Green

$sshCommand = @"
cd /opt/rubro-api && 
echo '📥 Descargando cambios...' && 
git pull origin main && 
echo '🔄 Reiniciando aplicación...' && 
pm2 restart rubro-api && 
echo '📊 Estado actual:' && 
pm2 status rubro-api && 
echo '📝 Últimos logs:' && 
pm2 logs rubro-api --lines 3
"@

ssh modiin@190.113.12.113 $sshCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 DEPLOY COMPLETADO EXITOSAMENTE!" -ForegroundColor Green
    Write-Host "La aplicación se ha actualizado y está funcionando." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Error durante el deploy" -ForegroundColor Red
}

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
