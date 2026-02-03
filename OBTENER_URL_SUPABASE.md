# 🔍 CÓMO OBTENER LA URL DE CONEXIÓN DE SUPABASE

## ⚠️ Problema Actual

Los formatos estándar de URL no están funcionando. Necesitamos la **URL exacta** que Supabase proporciona.

---

## 📋 PASOS PARA OBTENER LA URL CORRECTA

### 1️⃣ Accede a tu Proyecto

1. Ve a: **https://supabase.com**
2. Inicia sesión
3. Abre tu proyecto: **TikTak-Productividad** (ID: qbvrrjafxwidnjsdzqjs)

### 2️⃣ Ve a Database Settings

1. En el menú lateral izquierdo, click en **⚙️ Settings**
2. En el submenú, click en **Database**

### 3️⃣ Encuentra Connection String

Scroll hacia abajo hasta encontrar la sección **"Connection string"**

Verás algo como esto:

```
┌─────────────────────────────────────────────────────┐
│ Connection string                                   │
│                                                     │
│ [URI] [Session] [Transaction]  ← Pestañas          │
│                                                     │
│ postgresql://postgres.[ref]:[YOUR-PASSWORD]@...    │
│                                                     │
│ [Copy] button                                       │
└─────────────────────────────────────────────────────┘
```

### 4️⃣ Selecciona el Modo Correcto

**IMPORTANTE**: Hay 3 pestañas/modos:

- **URI** ← **SELECCIONA ESTE**
- Session
- Transaction

Asegúrate de estar en la pestaña **URI**

### 5️⃣ Copia la Cadena Completa

1. Click en el botón **Copy** o selecciona todo el texto
2. La URL se verá algo así:

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

O puede ser:

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 6️⃣ Reemplaza la Contraseña

En la URL que copiaste, busca `[YOUR-PASSWORD]` y reemplázalo con:

```
0qSKEQY2beYeNYdL
```

**Ejemplo:**

Si la URL es:
```
postgresql://postgres:[YOUR-PASSWORD]@db.qbvrrjafxwidnjsdzqjs.supabase.co:5432/postgres
```

Debe quedar:
```
postgresql://postgres:0qSKEQY2beYeNYdL@db.qbvrrjafxwidnjsdzqjs.supabase.co:5432/postgres
```

### 7️⃣ Pégala Aquí

Una vez que tengas la URL completa con la contraseña, pégala en el chat y yo completaré la migración automáticamente.

---

## 🎯 Formato Esperado

La URL debe verse similar a una de estas:

### Opción A (Direct Connection):
```
postgresql://postgres:0qSKEQY2beYeNYdL@db.qbvrrjafxwidnjsdzqjs.supabase.co:5432/postgres
```

### Opción B (Pooler):
```
postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@db.qbvrrjafxwidnjsdzqjs.supabase.co:6543/postgres
```

### Opción C (AWS Pooler):
```
postgresql://postgres:0qSKEQY2beYeNYdL@aws-0-[region].pooler.supabase.com:6543/postgres
```

---

## ✅ Checklist

Antes de pegar la URL, verifica:

- [ ] Estás en la pestaña **URI** (no Session ni Transaction)
- [ ] La URL empieza con `postgresql://`
- [ ] Contiene tu contraseña: `0qSKEQY2beYeNYdL`
- [ ] Contiene el project ID: `qbvrrjafxwidnjsdzqjs`
- [ ] Termina con `/postgres`

---

## 🆘 Si No Encuentras la Connection String

1. Verifica que estás en **Settings → Database**
2. Scroll hacia abajo (puede estar más abajo de lo esperado)
3. Busca la sección "Connection string" o "Connection pooling"
4. Si no la ves, puede estar en una pestaña llamada "Connection info"

---

## 📸 Referencia Visual

La sección se ve así:

```
Settings
├── General
├── Database  ← AQUÍ
├── API
└── ...

En Database:
├── Database password
├── Connection string  ← AQUÍ
│   ├── URI (seleccionar)
│   ├── Session
│   └── Transaction
└── Connection pooling
```

---

**Una vez que tengas la URL completa, pégala aquí y continuaré con la migración** 🚀
