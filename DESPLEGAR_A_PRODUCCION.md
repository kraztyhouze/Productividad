# 🚀 DESPLEGAR CAMBIOS A PRODUCCIÓN

## ⚠️ IMPORTANTE: Variables de Entorno

**NO** hagas commit del archivo `.env` con la contraseña de Supabase.

En su lugar, debes:

1. ✅ Hacer commit del código
2. ✅ Actualizar las variables de entorno en tu plataforma de deployment
3. ✅ Hacer push al repositorio

---

## 📋 PASOS PARA DESPLEGAR

### 1️⃣ Preparar el Commit (SIN .env)

```bash
# Asegúrate de que .env está en .gitignore
echo ".env" >> .gitignore

# Añadir cambios (excepto .env)
git add .
git status  # Verifica que .env NO aparece

# Hacer commit
git commit -m "Migración a Supabase - Actualizar configuración de base de datos"
```

### 2️⃣ Actualizar Variables de Entorno en Railway

**ANTES de hacer push**, actualiza las variables en Railway:

1. Ve a: https://railway.app
2. Abre tu proyecto de TikTak
3. Click en tu servicio (backend)
4. Ve a **Variables** (pestaña)
5. Busca `DATABASE_URL`
6. **Actualiza** con la nueva URL de Supabase:

```
DATABASE_URL=postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

7. Click en **Save** o **Deploy**

### 3️⃣ Hacer Push

```bash
# Push a tu repositorio
git push origin main
# o
git push origin master
```

### 4️⃣ Verificar Deployment

Railway automáticamente:
- ✅ Detectará el push
- ✅ Iniciará un nuevo deployment
- ✅ Usará la nueva `DATABASE_URL` de Supabase
- ✅ Migrará las tablas automáticamente (gracias a `initDb()`)

---

## 🔐 Seguridad: NO Subir Credenciales

### ✅ Verificar .gitignore

Asegúrate de que tu `.gitignore` incluye:

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Backups
.env.railway.backup
backup-railway/

# Supabase
.supabase-url.txt
```

### ❌ NUNCA hagas commit de:

- `.env`
- Contraseñas
- API keys
- Tokens de acceso

---

## 📊 Migración de Datos en Producción

### Opción A: Dejar que se cree limpio (RECOMENDADO)

Railway creará automáticamente:
- ✅ Todas las tablas
- ✅ Usuarios admin por defecto
- ✅ Roles predefinidos
- ✅ Configuración inicial

**Ventaja**: Base de datos limpia y optimizada

### Opción B: Migrar datos manualmente

Si necesitas los datos de producción:

1. Exporta datos de Railway producción (si es accesible)
2. Importa a Supabase usando el script `migrate-data.js`

---

## 🎯 Comandos Completos

```bash
# 1. Verificar que .env está ignorado
cat .gitignore | grep .env

# 2. Añadir .env a .gitignore si no está
echo ".env" >> .gitignore
echo ".env.railway.backup" >> .gitignore
echo "backup-railway/" >> .gitignore

# 3. Verificar estado
git status

# 4. Añadir cambios
git add .

# 5. Commit
git commit -m "Migración a Supabase

- Actualizar configuración de base de datos
- Cambiar de Railway a Supabase (Transaction Pooler)
- Soporte IPv4 via pooler
- Scripts de migración y diagnóstico añadidos"

# 6. Push
git push origin main
```

---

## 🔄 Después del Push

### En Railway:

1. Ve al dashboard de Railway
2. Verás un nuevo deployment iniciándose
3. Espera 2-3 minutos
4. Verifica los logs:
   - ✅ "Database initialized successfully"
   - ✅ "Server running on port 3000"

### Verificar la App Online:

1. Abre tu URL de Railway (ejemplo: `tiktak-production.up.railway.app`)
2. Inicia sesión con `admin` / `admin`
3. Verifica que todo funciona

---

## ⚠️ Problemas Comunes

### ❌ "DATABASE_URL not found"

**Solución**: Verifica que actualizaste la variable en Railway

### ❌ "Cannot connect to database"

**Solución**: 
1. Verifica que la URL de Supabase es correcta
2. Asegúrate de usar el **Transaction Pooler** (puerto 6543)
3. Verifica que la contraseña es correcta

### ❌ Deployment falla

**Solución**:
1. Revisa los logs en Railway
2. Verifica que no hiciste commit de `.env`
3. Asegúrate de que `DATABASE_URL` está configurada en Railway

---

## 📝 Checklist de Deployment

- [ ] `.env` está en `.gitignore`
- [ ] Verificado con `git status` que `.env` NO se subirá
- [ ] `DATABASE_URL` actualizada en Railway
- [ ] Commit hecho
- [ ] Push ejecutado
- [ ] Deployment iniciado en Railway
- [ ] Logs verificados (sin errores)
- [ ] App online funcionando
- [ ] Login exitoso
- [ ] Datos verificados

---

## 🎉 Resultado Final

Después de estos pasos:

- ✅ **Local**: Funcionando con Supabase
- ✅ **Producción**: Funcionando con Supabase
- ✅ **Datos**: Migrados y seguros
- ✅ **Credenciales**: Protegidas (no en Git)

---

**¿Listo para hacer el deployment?** 

Ejecuta los comandos y avísame si tienes algún problema 🚀
