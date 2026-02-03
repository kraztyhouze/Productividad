# 🔄 Guía de Migración a Supabase

## Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Click en "New Project"
4. Configura:
   - **Name**: TikTak-Productividad
   - **Database Password**: (Guarda esta contraseña - la necesitarás)
   - **Region**: Europe West (Frankfurt) - más cercano a España
   - **Pricing Plan**: Free

5. Espera 2-3 minutos mientras se crea el proyecto

## Paso 2: Obtener Credenciales de Conexión

1. En tu proyecto de Supabase, ve a **Settings** (⚙️) → **Database**
2. Busca la sección **Connection string**
3. Selecciona el modo **URI** (no Session mode)
4. Copia la cadena de conexión que se ve así:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Reemplaza `[YOUR-PASSWORD]` con la contraseña que creaste en el Paso 1

## Paso 3: Actualizar Variables de Entorno

Abre el archivo `.env` en la raíz del proyecto y actualiza la línea `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres:[TU-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Ejemplo real:**
```env
DATABASE_URL=postgresql://postgres:MiPassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

## Paso 4: Ejecutar Migración

Una vez hayas actualizado el `.env`, ejecuta:

```bash
npm run dev:all
```

El sistema automáticamente:
- ✅ Creará todas las tablas necesarias
- ✅ Configurará los índices y constraints
- ✅ Creará usuarios admin por defecto para ambas tiendas

## Paso 5: Verificar Conexión

Ejecuta el script de diagnóstico:

```bash
node diagnose-db.js
```

Deberías ver:
```
✅ CONEXIÓN EXITOSA
📊 INFORMACIÓN DEL SERVIDOR
📋 TABLAS ENCONTRADAS: [lista de tablas]
```

## 🎯 Ventajas de Supabase vs Railway

- ✅ **Siempre activo** - No hay modo "sleep"
- ✅ **500MB de base de datos gratis** (vs 100MB en Railway)
- ✅ **Sin límite de horas** en el plan gratuito
- ✅ **Backups automáticos** cada 24h
- ✅ **Panel de administración** visual para ver datos
- ✅ **APIs REST automáticas** (opcional, no las usaremos)

## 📊 Explorar Datos (Opcional)

Puedes ver y editar tus datos directamente desde Supabase:

1. Ve a **Table Editor** en el panel de Supabase
2. Verás todas tus tablas: `employees`, `tasks`, `daily_records`, etc.
3. Puedes editar datos directamente desde la interfaz

## 🔒 Seguridad

- La conexión usa SSL automáticamente
- Las contraseñas de empleados están hasheadas con bcrypt
- Supabase incluye protección DDoS y backups automáticos

## ⚠️ Notas Importantes

- **NO compartas** tu `DATABASE_URL` públicamente
- **Guarda** la contraseña de Supabase en un lugar seguro
- Si pierdes la contraseña, puedes resetearla desde Settings → Database
- El plan gratuito es suficiente para producción pequeña/mediana

---

**¿Necesitas ayuda?** Si tienes problemas, ejecuta `node diagnose-db.js` y comparte el output.
