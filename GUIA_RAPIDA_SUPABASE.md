# 🚀 GUÍA RÁPIDA: Migración a Supabase en 5 Minutos

## ✅ Paso 1: Crear Cuenta en Supabase (2 min)

1. Abre tu navegador y ve a: **https://supabase.com**
2. Click en **"Start your project"** o **"Sign in"**
3. Inicia sesión con **GitHub** (recomendado) o email

---

## ✅ Paso 2: Crear Nuevo Proyecto (1 min)

Una vez dentro del dashboard de Supabase:

1. Click en **"New Project"** (botón verde)
2. Rellena el formulario:

```
┌─────────────────────────────────────────┐
│ Organization: [Tu organización]         │
│ Name: TikTak-Productividad              │
│ Database Password: [Crea una segura]    │ ⚠️ ¡GUÁRDALA!
│ Region: Europe West (Frankfurt)         │
│ Pricing Plan: Free                      │
└─────────────────────────────────────────┘
```

3. Click en **"Create new project"**
4. **ESPERA 2-3 MINUTOS** mientras se crea (verás una barra de progreso)

---

## ✅ Paso 3: Obtener Credenciales (1 min)

Una vez creado el proyecto:

1. En el menú lateral, click en **⚙️ Settings**
2. Click en **Database** (en el submenu)
3. Scroll hasta encontrar **"Connection string"**
4. Selecciona el modo **URI** (no "Session mode")
5. Verás algo como:

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

6. **COPIA** esta URL completa
7. **REEMPLAZA** `[YOUR-PASSWORD]` con la contraseña que creaste en el Paso 2

**Ejemplo final:**
```
postgresql://postgres.abcdefgh:MiPassword123@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

---

## ✅ Paso 4: Actualizar .env (30 seg)

1. Abre el archivo `.env` en la raíz del proyecto
2. Busca la línea que dice `DATABASE_URL=`
3. **REEMPLAZA** toda la línea con tu nueva URL de Supabase:

**ANTES:**
```env
DATABASE_URL=postgresql://postgres:ZCSDHEECDFqRRExkbdWYgWmlCVLoeqVW@gondola.proxy.rlwy.net:33540/railway
```

**DESPUÉS:**
```env
DATABASE_URL=postgresql://postgres.abcdefgh:MiPassword123@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

4. **GUARDA** el archivo (Ctrl+S)

---

## ✅ Paso 5: Iniciar Aplicación (30 seg)

Abre la terminal en el proyecto y ejecuta:

```bash
npm run dev:all
```

Deberías ver:

```
✅ Database initialized successfully
✅ Telegram Bot Started!
✅ Server running on port 3000
✅ VITE ready in XXX ms
```

---

## ✅ Paso 6: Verificar Conexión

Abre otra terminal y ejecuta:

```bash
node migrate-to-supabase.js
```

Deberías ver:

```
✅ CONEXIÓN EXITOSA
📊 TABLAS EN LA BASE DE DATOS: 14
✅ MIGRACIÓN COMPLETADA EXITOSAMENTE
```

---

## 🎉 ¡LISTO!

Tu aplicación ahora está usando Supabase. Puedes:

1. **Acceder a la app**: http://localhost:5173
2. **Login**: usuario `admin`, contraseña `admin`
3. **Ver datos en Supabase**: 
   - Ve a tu proyecto en Supabase
   - Click en **Table Editor**
   - Verás todas tus tablas: employees, tasks, etc.

---

## 🆘 ¿Problemas?

### ❌ Error: "ECONNREFUSED"
- Verifica que copiaste la URL completa
- Asegúrate de reemplazar `[YOUR-PASSWORD]`

### ❌ Error: "28P01" (Autenticación fallida)
- La contraseña es incorrecta
- Ve a Supabase → Settings → Database → Reset password

### ❌ No se crean las tablas
- Espera 30 segundos más
- Verifica los logs del servidor
- Ejecuta: `node diagnose-db.js`

### 💬 Necesitas ayuda
Ejecuta: `node diagnose-db.js` y comparte el output

---

## 📊 Ventajas de Supabase

✅ **Siempre activo** - Sin modo "sleep"  
✅ **500MB gratis** - 5x más que Railway  
✅ **Backups automáticos** - Cada 24h  
✅ **Panel visual** - Edita datos fácilmente  
✅ **Sin límite de horas** - Plan gratuito generoso  

---

**Tiempo total estimado: 5 minutos** ⏱️
