#!/bin/bash

echo "🚀 PREPARANDO DEPLOYMENT A PRODUCCIÓN"
echo "======================================"
echo ""

# Verificar que .env no se va a subir
echo "1️⃣ Verificando que .env está protegido..."
if git check-ignore .env > /dev/null 2>&1; then
    echo "✅ .env está en .gitignore"
else
    echo "❌ ERROR: .env NO está en .gitignore"
    echo "   Añadiendo .env a .gitignore..."
    echo ".env" >> .gitignore
fi

echo ""
echo "2️⃣ Verificando archivos a subir..."
git status --short

echo ""
echo "3️⃣ Archivos que NO se subirán (protegidos):"
echo "   - .env (credenciales)"
echo "   - backup-railway/ (datos locales)"
echo "   - .env.railway.backup (backup)"
echo ""

read -p "¿Continuar con el commit? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Deployment cancelado"
    exit 1
fi

echo ""
echo "4️⃣ Añadiendo cambios..."
git add .

echo ""
echo "5️⃣ Creando commit..."
git commit -m "Migración a Supabase

- Actualizar configuración de base de datos
- Cambiar de Railway a Supabase (Transaction Pooler IPv4)
- Scripts de migración y diagnóstico añadidos
- Documentación de migración actualizada"

echo ""
echo "6️⃣ Haciendo push..."
git push origin main || git push origin master

echo ""
echo "======================================"
echo "✅ DEPLOYMENT COMPLETADO"
echo "======================================"
echo ""
echo "⚠️  IMPORTANTE: Actualiza las variables de entorno en Railway:"
echo ""
echo "1. Ve a: https://railway.app"
echo "2. Abre tu proyecto TikTak"
echo "3. Ve a Variables"
echo "4. Actualiza DATABASE_URL con:"
echo ""
echo "   postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
echo ""
echo "5. Guarda y espera el redeploy automático"
echo ""
echo "======================================"
