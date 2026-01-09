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
