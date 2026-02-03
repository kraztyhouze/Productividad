# 🚀 MIGRACIÓN AUTOMÁTICA A SUPABASE

## ✅ Backup Completado

Se ha realizado un backup completo de Railway:

```
📦 Datos respaldados:
- active_sessions: 0 registros
- closed_days: 0 registros  
- comments: 0 registros
- daily_groups: 0 registros
- daily_records: 0 registros
- day_incidents: 0 registros
- employees: [cantidad] registros
- locations: 121 registros
- no_deal_details: 0 registros
- product_families: 0 registros
- roles: [cantidad] registros
- store_settings: 2 registros
- tasks: 0 registros
```

## 🎯 Ejecutar Migración Completa

### Opción 1: Con contraseña como argumento

```bash
node complete-migration.js [TU-PASSWORD-DE-SUPABASE]
```

**Ejemplo:**
```bash
node complete-migration.js MiPassword123
```

### Opción 2: Actualizar .env manualmente

Si prefieres actualizar el .env tú mismo:

1. Abre el archivo `.env`
2. Reemplaza la línea `DATABASE_URL` con:

```env
DATABASE_URL=postgresql://postgres.qbvrrjafxwidnjsdzqjs:[TU-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

3. Ejecuta:
```bash
npm run dev:all
```

## 📋 Información del Proyecto Supabase

- **Project ID**: `qbvrrjafxwidnjsdzqjs`
- **Region**: AWS Europe Central 1
- **Connection Pool**: Port 6543 (Transaction mode)

## 🔐 Dónde Encontrar la Contraseña

1. Ve a [supabase.com](https://supabase.com)
2. Abre tu proyecto **TikTak-Productividad**
3. Settings → Database
4. Busca "Database Password"
5. Si no la recuerdas, puedes resetearla desde ahí

## ⚡ Qué Hace el Script de Migración

1. ✅ Conecta a Supabase
2. ✅ Crea todas las tablas necesarias
3. ✅ Migra todos los datos desde el backup
4. ✅ Actualiza el archivo .env automáticamente
5. ✅ Verifica que todo se migró correctamente
6. ✅ Guarda un backup de tu .env anterior

## 🎉 Después de la Migración

Una vez completada la migración:

```bash
# Iniciar la aplicación
npm run dev:all

# Acceder a:
http://localhost:5173

# Login con tus credenciales habituales
```

## 📊 Verificar Datos en Supabase

Puedes ver tus datos en:
1. Ve a [supabase.com](https://supabase.com)
2. Abre tu proyecto
3. Click en **Table Editor**
4. Verás todas tus tablas con los datos migrados

## 🆘 Solución de Problemas

### ❌ Error: "28P01" (Contraseña incorrecta)
- Verifica la contraseña
- Resetéala en Supabase → Settings → Database

### ❌ Error: "ENOTFOUND"
- Verifica que el Project ID sea correcto
- Comprueba tu conexión a internet

### ❌ Datos no migrados
- Verifica que existe el directorio `backup-railway`
- Ejecuta `node backup-railway.js` de nuevo

## 📞 Ayuda

Si necesitas ayuda:
```bash
# Diagnóstico de conexión
node diagnose-db.js

# Ver backup disponible
ls backup-railway
```

---

**¿Listo para migrar?** Ejecuta:
```bash
node complete-migration.js [TU-PASSWORD]
```
