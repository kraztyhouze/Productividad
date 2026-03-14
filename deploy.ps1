# 🚀 SCRIPT DE DEPLOYMENT TOTAL PARA RENDER
# Ejecutar con: .\deploy.ps1

Write-Host "🚀 PREPARANDO DEPLOYMENT A RENDER" -ForegroundColor Cyan
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
$commitMessage = Read-Host "✍️  Introduce un mensaje para este parche (o deja vacío para usar 'Actualización')"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Actualización"
}

Write-Host ""
Write-Host "3️⃣ Añadiendo cambios..." -ForegroundColor Yellow
git add .
git commit -m "$commitMessage"

Write-Host ""
Write-Host "4️⃣ Sincronizando ramas y subiendo a la nube..." -ForegroundColor Yellow

# Push a master
Write-Host "-> Guardando tu código en 'master'..." -ForegroundColor Gray
git push origin master

# Sincronizar render
Write-Host "-> Enviando el código a la web (rama 'render')..." -ForegroundColor Gray
git checkout render
git merge master
git push origin render

# Sincronizar main
Write-Host "-> Guardando copia de seguridad (rama 'main')..." -ForegroundColor Gray
git checkout main
git merge master
git push origin main

# Volver a master
Write-Host "-> Devolviéndote a tu rama de trabajo..." -ForegroundColor Gray
git checkout master

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT A RENDER COMPLETADO" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "✅ Render y tu entorno de trabajo (master) ahora están 100% sincronizados." -ForegroundColor White
Write-Host ""
