# 🔌 CÓMO OBTENER LA URL DEL POOLER (IPv4) EN SUPABASE

## ⚠️ Problema Identificado

Supabase en el plan gratuito:
- ❌ **Conexión directa**: Solo IPv6 (no funciona en tu red)
- ✅ **Connection Pooler**: Soporta IPv4 (ESTO ES LO QUE NECESITAMOS)

---

## 📋 PASOS PARA OBTENER LA URL DEL POOLER

### 1️⃣ Accede a Database Settings

1. Ve a: **https://supabase.com**
2. Abre tu proyecto: **TikTak-Productividad**
3. Click en **⚙️ Settings** (menú lateral)
4. Click en **Database**

### 2️⃣ Busca "Connection Pooling"

Scroll hacia abajo hasta encontrar la sección:

```
┌─────────────────────────────────────────────────────┐
│ Connection Pooling                                  │
│                                                     │
│ Use connection pooling for serverless environments │
│                                                     │
│ Mode: [Transaction] [Session]  ← Pestañas          │
│                                                     │
│ Connection string:                                  │
│ postgresql://postgres.[ref]:[YOUR-PASSWORD]@...    │
│                                                     │
│ [Copy] button                                       │
└─────────────────────────────────────────────────────┘
```

**IMPORTANTE**: Esta sección es DIFERENTE a "Connection string" (que vimos antes)

### 3️⃣ Selecciona el Modo

Hay 2 modos disponibles:

- **Transaction** ← **SELECCIONA ESTE** (Puerto 6543)
- Session (Puerto 5432)

Asegúrate de estar en la pestaña **Transaction**

### 4️⃣ Copia la URL del Pooler

La URL del Pooler se verá algo así:

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Ejemplo:**
```
postgresql://postgres.qbvrrjafxwidnjsdzqjs:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

### 5️⃣ Reemplaza la Contraseña

Reemplaza `[YOUR-PASSWORD]` con tu contraseña:

```
0qSKEQY2beYeNYdL
```

**Resultado final:**
```
postgresql://postgres.qbvrrjafxwidnjsdzqjs:0qSKEQY2beYeNYdL@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

### 6️⃣ Pégala Aquí

Copia la URL completa y pégala en el chat.

---

## 🔍 Diferencias Clave

| Tipo | Host | Puerto | IPv4 | Plan Gratuito |
|------|------|--------|------|---------------|
| **Direct** | db.[ref].supabase.co | 5432 | ❌ No | ❌ Solo IPv6 |
| **Pooler** | aws-0-[region].pooler.supabase.com | 6543 | ✅ Sí | ✅ Funciona |

---

## ✅ Checklist

La URL del Pooler debe:

- [ ] Contener `pooler.supabase.com` (NO `db.qbvrrjafxwidnjsdzqjs.supabase.co`)
- [ ] Usar puerto `6543` (Transaction mode)
- [ ] Empezar con `postgresql://postgres.qbvrrjafxwidnjsdzqjs:`
- [ ] Contener tu contraseña: `0qSKEQY2beYeNYdL`

---

## 📸 Referencia Visual

En la página de Database Settings verás DOS secciones:

```
Settings → Database

├── Connection string  ← ❌ NO USAR (IPv6 only)
│   └── postgresql://...@db.qbvrrjafxwidnjsdzqjs.supabase.co:5432/...
│
└── Connection Pooling  ← ✅ USAR ESTA (IPv4 compatible)
    ├── Transaction mode (6543)
    └── Session mode (5432)
```

---

## 🆘 Si No Encuentras "Connection Pooling"

1. Asegúrate de estar en **Settings → Database**
2. Scroll TODO hacia abajo (está casi al final)
3. Puede estar etiquetado como:
   - "Connection Pooling"
   - "Pooler"
   - "Connection Pool"

---

## 💡 ¿Por Qué Necesitamos el Pooler?

- **Direct connection**: Usa IPv6 (tu red no lo soporta)
- **Pooler**: Usa IPv4 (compatible con todas las redes)
- **Bonus**: El Pooler es más eficiente para aplicaciones web

---

**Una vez que tengas la URL del Pooler, pégala aquí y completaré la migración** 🚀
