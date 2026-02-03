# 🎯 TikTak 2.1 - Sistema de Productividad

## 🚨 MIGRACIÓN A SUPABASE EN CURSO

### ⚡ Inicio Rápido

```bash
# 1. Lee la guía (5 minutos)
cat GUIA_RAPIDA_SUPABASE.md

# 2. Crea tu proyecto en Supabase
# Ve a: https://supabase.com

# 3. Actualiza .env con tus credenciales de Supabase

# 4. Verifica la migración
node migrate-to-supabase.js

# 5. Inicia la aplicación
npm run dev:all
```

---

## 📚 Documentación de Migración

| Archivo | Descripción | Prioridad |
|---------|-------------|-----------|
| **GUIA_RAPIDA_SUPABASE.md** | Guía paso a paso en 5 min | ⭐⭐⭐ EMPIEZA AQUÍ |
| **RESUMEN_MIGRACION.md** | Resumen completo del proceso | ⭐⭐ |
| **MIGRACION_SUPABASE.md** | Documentación detallada | ⭐ |

## 🛠️ Scripts Disponibles

### Migración y Diagnóstico

```bash
# Asistente de migración (ejecutar después de configurar .env)
node migrate-to-supabase.js

# Diagnóstico completo de conexión
node diagnose-db.js

# Intentar backup de Railway (opcional)
node backup-railway.js
```

### Desarrollo

```bash
# Iniciar servidor + frontend
npm run dev:all

# Solo servidor backend
npm run dev:server

# Solo frontend
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview
```

---

## 🗂️ Estructura del Proyecto

```
TikTak 2.1/
├── 📖 GUIA_RAPIDA_SUPABASE.md    ← EMPIEZA AQUÍ
├── 📖 RESUMEN_MIGRACION.md
├── 📖 MIGRACION_SUPABASE.md
├── 🔧 migrate-to-supabase.js
├── 🔧 diagnose-db.js
├── 🔧 backup-railway.js
├── 📄 .env                        ← ACTUALIZAR CON SUPABASE
├── 📄 .env.supabase              ← Plantilla de referencia
├── server/
│   ├── index.js                   ← Servidor Express
│   ├── db.js                      ← Configuración PostgreSQL
│   ├── telegramBot.js             ← Bot de Telegram
│   └── supabase-setup.sql         ← SQL manual (opcional)
└── src/
    ├── pages/                     ← Páginas de la aplicación
    ├── components/                ← Componentes React
    └── context/                   ← Contextos (Auth, Store, Team)
```

---

## 🔐 Configuración (.env)

### Formato Actual (Railway - NO FUNCIONA)
```env
DATABASE_URL=postgresql://postgres:***@gondola.proxy.rlwy.net:33540/railway
```

### Formato Nuevo (Supabase - ACTUALIZAR)
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

**Ver `.env.supabase` para más detalles**

---

## 🚀 Estado de la Migración

- [x] Diagnóstico del problema (Railway inaccesible)
- [x] Documentación creada
- [x] Scripts de migración preparados
- [ ] **Proyecto Supabase creado** ← TÚ HACES ESTO
- [ ] **Archivo .env actualizado** ← TÚ HACES ESTO
- [ ] Verificación de conexión
- [ ] Aplicación funcionando

---

## 📊 Características de la Aplicación

- ✅ **Multi-tienda**: Gestión de 2 tiendas independientes
- ✅ **Productividad**: Seguimiento de empleados y sesiones
- ✅ **Tareas**: Sistema de tareas con comentarios
- ✅ **Market**: Búsqueda de productos y valoraciones
- ✅ **Diagnósticos**: Pruebas de móviles y portátiles
- ✅ **Reportes**: Generación de PDFs
- ✅ **Telegram Bot**: Notificaciones automáticas

---

## 🆘 Soporte

### ❌ La aplicación no tiene datos

**Esto es normal después de la migración**. Railway no estaba accesible, así que empezarás con una base de datos limpia en Supabase.

### ❌ Error de conexión

```bash
# Ejecuta el diagnóstico
node diagnose-db.js

# Verifica que .env tenga la URL correcta de Supabase
```

### ❌ No se crean las tablas

```bash
# Espera 30 segundos más
# Verifica los logs del servidor
# Las tablas se crean automáticamente al iniciar
```

---

## 📞 Ayuda

1. Lee **GUIA_RAPIDA_SUPABASE.md**
2. Ejecuta `node diagnose-db.js`
3. Revisa **RESUMEN_MIGRACION.md**

---

## 🎯 Próximos Pasos

1. **Ahora**: Crear proyecto en Supabase (5 min)
2. **Después**: Actualizar .env
3. **Finalmente**: Ejecutar `npm run dev:all`

---

**Tiempo estimado total: 7 minutos** ⏱️

¡Buena suerte! 🚀
