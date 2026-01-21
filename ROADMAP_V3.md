# Hoja de Ruta: Expansión a Suite de Gestión Integral (TikTak v3.0)

## Visión General
Transformar la aplicación actual (enfocada en Productividad de Compras) en una plataforma modular que integre una nueva y potente herramienta de "Gerencia" para la gestión de personal y horarios.

La estructura final tendrá dos grandes áreas:
1.  **GERENCIA** (Nuevo Core): Gestión de RRHH, Horarios, Personal y Administración.
2.  **COMPRAS** (Legacy/Actual): Módulo operativo de productividad diaria y kiosco.

## Fases de Implementación

### Fase 1: Encapsulamiento de "Compras"
*   [ ] Reestructurar la navegación principal para alojar los módulos.
*   [ ] Mover las funcionalidades actuales (`Productivity`, `Market`, `Team` actual) bajo el paraguas conceptual de "COMPRAS".
*   [ ] Mantener la funcionalidad intacta mientras se prepara el `Shell` (contenedor) de la aplicación para recibir nuevos módulos.

### Fase 2: Desarrollo de "Gerencia"
*   [ ] Implementar el nuevo sistema de **Gestión de Horarios y Personal**.
*   [ ] Crear la "Super Ficha" de empleado en Gerencia (más completa que la actual).
*   [ ] Desarrollar herramientas de planificación de turnos y control de asistencia avanzado.

### Fase 3: Unificación y Migración de Datos (El Gran Cambio)
*   [ ] **Single Source of Truth**: Establecer la base de datos de "Gerencia" como la única fuente de verdad para los datos de empleados (`employees`, `roles`).
*   [ ] **Refactorización de Compras**:
    *   Modificar `TeamContext` en el módulo de Compras para que deje de escribir/gestionar empleados.
    *   Hacer que Compras *lea* los empleados y sus horarios directamente de las tablas de Gerencia.
    *   Eliminar la pestaña "Equipo" del módulo de Compras (ya que será redundante con Gerencia).

### Fase 4: Limpieza y Optimización
*   [ ] Eliminar código duplicado de gestión de usuarios en el módulo Compras.
*   [ ] Asegurar que el Login y los permisos fluyan desde Gerencia hacia Compras.
*   [ ] Consolidar estilos y componentes UI (Design System compartido).

## Estado Actual (v2.1 Multi-Store)
- [x] Aislamiento de datos por tienda (`store_id`) implementado.
- [x] Diseño unificado (Login/Selector).
- [ ] Listo para comenzar la Fase 1.
