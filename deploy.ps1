# 🚀 SCRIPT DE DEPLOYMENT PARA WINDOWS
# Ejecutar con: .\deploy.ps1

Write-Host "🚀 PREPARANDO DEPLOYMENT A PRODUCCIÓN" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que .env no se va a subir
Write-Host "1️⃣ Verificando que .env está protegido..." -ForegroundColor Yellow
$gitignoreContent = Get-Content .gitignore -Raw
if ($gitignoreContent -match "\.env") {
    Write-Host "✅ .env está en .gitignore" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: .env NO está en .gitignore" -ForegroundColor Red
    Write-Host "   Añadiendo .env a .gitignore..." -ForegroundColor Yellow
    Add-Content .gitignore "`n.env"
}

Write-Host ""
Write-Host "2️⃣ Verificando archivos a subir..." -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "3️⃣ Archivos que NO se subirán (protegidos):" -ForegroundColor Yellow
Write-Host "   - .env (credenciales)" -ForegroundColor Gray
Write-Host "   - backup-railway/ (datos locales)" -ForegroundColor Gray
Write-Host "   - .env.railway.backup (backup)" -ForegroundColor Gray
Write-Host ""

$confirmation = Read-Host "¿Continuar con el commit? (s/n)"
if ($confirmation -ne 's' -and $confirmation -ne 'S') {
    Write-Host "❌ Deployment cancelado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "4️⃣ Añadiendo cambios..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "5️⃣ Creando commit..." -ForegroundColor Yellow
git commit -m "Migración a Supabase

- Actualizar configuración de base de datos
- Cambiar de Railway a Supabase (Transaction Pooler IPv4)
- Scripts de migración y diagnóstico añadidos
- Documentación de migración actualizada"

Write-Host ""
Write-Host "6️⃣ Haciendo push..." -ForegroundColor Yellow
try {
    git push origin main
} catch {
    git push origin master
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETADO" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Actualiza las variables de entorno en Railway:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ve a: https://railway.app" -ForegroundColor White
Write-Host "2. Abre tu proyecto TikTak" -ForegroundColor White
Write-Host "3. Ve a Variables" -ForegroundColor White
Write-Host "4. Actualiza DATABASE_URL con:" -ForegroundColor White
Write-Host ""
Write-Host "   postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-1-eu-west-1.pooler.supabase.com:6543/postgres" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Guarda y espera el redeploy automático" -ForegroundColor White
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
