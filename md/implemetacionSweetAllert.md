# Plan Técnico de Implementación — SweetAlert2

**Proyecto:** Sistema de Gestión de Tareas — TRANSFERENCIA_DOM  
**Autores:** Karol Nicolle Torres Fuentes | Juan Sebastián Patiño Hernández  
**SENA — Febrero 2026**

---

## 1. Análisis de la mejora

El proyecto actualmente usa `alert()` y `confirm()` nativos del navegador para notificar al usuario y pedir confirmaciones. Estos diálogos bloquean el hilo principal, no se pueden estilizar y rompen la experiencia visual porque ignoran completamente la paleta de colores y la tipografía definidas en `styles.css`. La mejora consiste en reemplazarlos por SweetAlert2, una librería liviana que genera dialogs visuales completamente personalizables mediante clases CSS y compatible con async/await.

## 2. Cambios estructurales requeridos

El único archivo que se reescribe completamente es `src/utils/notificaciones.js`, que actualmente construye toasts manuales con `document.createElement()`. Pasará a usar `Swal.mixin()` para los toasts y `Swal.fire()` para el dialog de confirmación, exportando dos funciones async: `mostrarNotificacion()` y `mostrarConfirmacion()`.

En `src/services/tareasService.js` el cambio es mínimo: se agrega `mostrarConfirmacion` al import existente de notificaciones y se reemplaza el `confirm()` nativo dentro de `manejarEliminacionTarea()` por `await mostrarConfirmacion()`. El resto del archivo no se toca.

En `styles.css` se agrega al final un bloque de clases CSS que personaliza los popups, títulos, textos y botones de SweetAlert2 usando las variables CSS ya definidas en `:root` del proyecto (`--color-primario`, `--radio-full`, `--sombra-lg`, `--color-error`, etc.).

No se crea ningún módulo nuevo ni se modifica la arquitectura de capas existente.

## 3. Dependencias a instalar

Una sola dependencia de producción:

```
npm install sweetalert2
```

Se instala como dependencia de producción porque el navegador del usuario final la necesita en tiempo de ejecución, no solo durante el build. Vite la detecta automáticamente y la incluye en el bundle al ejecutar `npm run build`.

## 4. Plan de implementación

Primero se crea la rama `feat/sweetalert2-integration` desde `main` para aislar los cambios. Luego se instala la dependencia y se registra el primer commit. Después se agrega el bloque de estilos en `styles.css` y se commitea. A continuación se reescribe `notificaciones.js` con la nueva implementación y se commitea. Finalmente se actualiza el import y el `confirm()` en `tareasService.js` y se commitea. Una vez terminados los cuatro commits se hace el push de la rama y se abre el Pull Request hacia `release`.

## 5. Impacto en la estructura del proyecto

El impacto es bajo y acotado. La arquitectura de capas no cambia: `notificaciones.js` sigue viviendo en `utils/`, sigue siendo importado únicamente desde `services/` y sigue sin conocer la API ni el estado de la aplicación. Los demás módulos (`tareasUi.js`, `filtros.js`, `ordenamiento.js`, `exportacion.js`, `validaciones.js`, `config.js`) no se modifican en absoluto.

El tamaño del bundle de producción aumenta porque SweetAlert2 se incluye en el archivo JS minificado, pero el impacto es razonable dado que elimina la necesidad de mantener lógica de construcción manual de toasts en el proyecto.