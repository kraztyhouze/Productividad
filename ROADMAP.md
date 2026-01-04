# Mejoras Pendientes

## 1. Asistente de Tasación Inteligente (Market)
- **Estado**: Pendiente
- **Descripción**: Implementar lógica real en el botón "Consultar" del formulario de tasación.
- **Detalles**:
    - Calcular precio de compra recomendado basado en margen deseado (ej. 40%).
    - Considerar estado del producto y competencia.
    - Mostrar resultados visuales claros (Semáforo de precio).

## 2. Exportación de Datos (Reports)
- **Estado**: Pendiente
- **Descripción**: Hacer funcional el botón "Exportar CSV" en la página de Informes.
- **Detalles**:
    - Generar archivo .csv descargable.
    - Incluir desglose por empleado, horas, grupos y medias.

## 3. Escaneo de Precios Real (Market)
- **Estado**: En investigación
- **Descripción**: Obtener y mostrar precios reales dentro de la app en lugar de solo enlaces.
- **Técnica**: Uso de Puppeteer (Navegador Headless) para superar barreras anti-bot y renderizado JS.
