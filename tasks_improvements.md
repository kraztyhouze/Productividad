# Mejoras Futuras y Tareas Pendientes

## Mejoras en Flujo de Empleados
- [ ] **Inicio/Fin de Turno y Compras**: Mejorar la experiencia de usuario (UX) para el inicio y fin de turno, así como para marcar compras a clientes.
    - *Actual*: Botones simples en tarjetas.
    - *Idea*: Quizás un modal o interfaz dedicada tipo "Kiosco" que sea más clara para evitar errores (como finalizar turno sin querer).
    - *Problema Reportado*: A veces los tiempos se guardan a 0, posiblemente por doble clic o confusión en la interfaz.

## Errores Conocidos
- [x] **Scraper Oro Lento**: Optimizado el 09/01/2026 para leer el precio visible (>100g) y calcular el precio real (<100g) restando 0.35, eliminando la necesidad de interacciones lentas con Puppeteer.
- [x] **Tiempos a 0**: Añadida validación y valor mínimo de 1s en `ProductivityContext` para evitar registros nulos.

## Notas
- El scraper de QuickGold ahora usa `https://quickgold.es/vender-oro/compro-oro-sevilla/` y busca el selector `p[class*="conversor_precio18k"]`. Si la web cambia sus clases (CSS Modules), podría romperse y requerir reajuste.

## Limpieza y Refactorización (Pendiente 2026)
- [x] **Fase 1: Limpieza Básica y Segura**: Mover a `_archive/` (o eliminar) basura de la raíz como `.txt`, `.diff`, `.log` y scripts sin uso (`debug_*.js`, `patch*.js`, etc.).
- [ ] **Fase 2: Seguridad Básica**: Restringir el dominio de `cors()` en `server/index.js` en producción y añadir un *Rate Limiting* al inicio de sesión para impedir fuerza bruta sobre la Base de Datos.
- [ ] **Fase 3: Separación Backend**: Dividir `server/index.js` (~1700+ líneas) en distintos archivos de rutas y controladores (`controllers/`, `routes/`) para mejorar facilidad de lectura.
- [ ] **Fase 4: Optimización Front**: Limpiar `imports` zombies en los `.jsx` (según reporte Linter) y descomponer archivos inmensos (como `Market.jsx` / `LaptopDiagnostics.jsx`) en múltiples mini-componentes más fáciles de arreglar.
