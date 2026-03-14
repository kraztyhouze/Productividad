#!/bin/bash

# 🚀 SCRIPT DE DEPLOYMENT TOTAL PARA RENDER

echo "🚀 PREPARANDO DEPLOYMENT A RENDER"
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
read -p "✍️  Introduce un mensaje para este parche (o deja vacío para 'Actualización'): " commitMessage
if [ -z "$commitMessage" ]; then
    commitMessage="Actualización"
fi

echo ""
echo "3️⃣ Añadiendo cambios..."
git add .
git commit -m "$commitMessage"

echo ""
echo "4️⃣ Sincronizando ramas y subiendo a la nube..."

# Push a master
echo "-> Guardando tu código en 'master'..."
git push origin master

# Sincronizar render
echo "-> Enviando el código a la web (rama 'render')..."
git checkout render
git merge master
git push origin render

# Sincronizar main
echo "-> Guardando copia de seguridad (rama 'main')..."
git checkout main
git merge master
git push origin main

# Volver a master
echo "-> Devolviéndote a tu rama de trabajo..."
git checkout master

echo ""
echo "======================================"
echo "✅ DEPLOYMENT A RENDER COMPLETADO"
echo "======================================"
echo "✅ Render y tu entorno de trabajo (master) ahora están 100% sincronizados."
echo ""
