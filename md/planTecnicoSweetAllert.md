# Informe de Implementación — SweetAlert2

**Proyecto:** Sistema de Gestión de Tareas — TRANSFERENCIA_DOM  
**Autores:** Karol Nicolle Torres Fuentes | Juan Sebastián Patiño Hernández  
**SENA — Febrero 2026**

---

## Qué problema resolvió la mejora implementada

El proyecto usaba `alert()` y `confirm()` nativos del navegador para dos propósitos distintos: informar al usuario sobre el resultado de sus acciones (registro exitoso, error, exportación) y pedir confirmación antes de eliminar una tarea. Estos diálogos presentaban tres problemas concretos.

El primero es visual: los diálogos nativos ignoran completamente cualquier estilo CSS definido en el proyecto. Sin importar la paleta de colores, la tipografía o el diseño construido en `styles.css`, el navegador renderiza sus propias ventanas con el estilo del sistema operativo, rompiendo la coherencia visual de la interfaz.

El segundo es de experiencia de usuario: `confirm()` es bloqueante a nivel del hilo principal del navegador. Mientras el diálogo está abierto, nada en la página puede ejecutarse, lo que genera una sensación de congelamiento en la interfaz.

El tercero es de mantenibilidad: `notificaciones.js` construía los toasts manualmente con `document.createElement()`, acumulando lógica de presentación dentro de un módulo de utilidades que debería ser simple y reutilizable.

SweetAlert2 resolvió los tres problemas: los dialogs ahora respetan la paleta morada del proyecto, no bloquean el hilo principal y la lógica de presentación quedó delegada completamente a la librería.

---

## Cómo se gestionaron las dependencias

SweetAlert2 se instaló como dependencia de producción con `npm install sweetalert2`, lo que la registró en la sección `dependencies` de `package.json` en lugar de `devDependencies`. Esta distinción es importante: una dependencia de desarrollo solo se necesita durante el proceso de build, mientras que una de producción es necesaria en el navegador del usuario final en tiempo de ejecución.

Vite detecta automáticamente las dependencias declaradas en `package.json` y las incluye en el bundle al ejecutar `npm run build`. No fue necesario ninguna configuración adicional en `vite.config.js` ni agregar ningún script en `index.html`. La importación se hizo directamente en el módulo que la necesita con `import Swal from 'sweetalert2'`, siguiendo el mismo patrón de importación ES modules que ya usaba el resto del proyecto.

El archivo `package-lock.json` se actualizó automáticamente al instalar la dependencia y se commiteó junto con `package.json` para garantizar que cualquier integrante del equipo que ejecute `npm install` obtenga exactamente la misma versión de la librería.

---

## Qué cambios estructurales se realizaron

La arquitectura de capas del proyecto no se modificó. Los cambios fueron acotados a tres archivos existentes y no se creó ningún módulo nuevo.

`src/utils/notificaciones.js` fue el archivo con mayor modificación: se reescribió completamente. La implementación anterior construía elementos del DOM manualmente con `document.createElement()` y los insertaba en un contenedor `#notificaciones-contenedor`. La nueva implementación usa `Swal.mixin()` para crear una instancia preconfigurada de toast reutilizable y `Swal.fire()` para el dialog de confirmación. Se exportan dos funciones async: `mostrarNotificacion()`, que reemplaza los toasts manuales, y `mostrarConfirmacion()`, que reemplaza al `confirm()` nativo. Ambas usan async/await en lugar de `.then()` para mantener consistencia con el resto del proyecto.

`src/services/tareasService.js` tuvo el cambio más pequeño. Se agregó `mostrarConfirmacion` al import existente de notificaciones y dentro de `manejarEliminacionTarea()` se reemplazó el bloque del `confirm()` nativo por `await mostrarConfirmacion()`. El resto de la función y el resto del archivo quedaron intactos.

`styles.css` recibió un bloque de clases al final del archivo: `.swal-popup`, `.swal-title`, `.swal-text`, `.swal-btn-confirmar`, `.swal-btn-cancelar` y `.swal-eliminar`. Todas estas clases usan las variables CSS ya definidas en `:root` del proyecto, como `--color-primario`, `--radio-full`, `--sombra-lg` y `--color-error`, lo que garantiza que cualquier cambio en la paleta del proyecto se propague automáticamente a los dialogs.

---

## Qué diferencia existe entre la ejecución en desarrollo y producción

En desarrollo, con `npm run dev`, Vite sirve los módulos directamente sin procesarlos. SweetAlert2 se importa como módulo ES desde `node_modules` en tiempo real. Esto significa que si hay un error en la configuración de la librería, el mensaje de error en consola es legible y apunta exactamente al archivo y línea donde ocurrió el problema.

En producción, con `npm run build` seguido de `npm run preview`, Vite analiza el grafo completo de módulos, resuelve todas las importaciones incluyendo SweetAlert2 y las combina en un único archivo JavaScript minificado en la carpeta `dist/assets/`. El nombre del archivo incluye un hash único para forzar al navegador a cargar siempre la versión más reciente. El bundle resultante pasó de 12 módulos transformados a 18 al incluir SweetAlert2, y el tamaño del archivo JS aumentó aproximadamente 34 KB en su versión comprimida con gzip, lo cual es el costo razonable de eliminar la lógica manual de construcción de toasts.

Una diferencia importante es que en producción no existe HMR ni herramientas de depuración, y el código de SweetAlert2 queda minificado junto con el resto. Si algo funciona en desarrollo pero falla en preview, el problema está en el proceso de build y no en la lógica de la librería.

---

## Qué dificultades surgieron y cómo fueron solucionadas

La primera dificultad fue que los botones del dialog de confirmación no tomaban el color morado del proyecto aunque las clases CSS estaban correctamente definidas. Después de revisar la documentación de SweetAlert2 se identificó la causa: la librería inyecta estilos inline en los botones que tienen mayor especificidad que cualquier clase CSS externa. La solución fue agregar `buttonsStyling: false` en la configuración de `Swal.fire()`, lo que desactiva completamente los estilos inline de la librería y deja los botones sin estilo propio, permitiendo que nuestras clases `.swal-btn-confirmar` y `.swal-btn-cancelar` tomen efecto sin necesidad de usar `!important` en exceso.

La segunda dificultad fue de flujo Git. Al trabajar con el esquema de fork, el integrante del fork no tenía configurado el remoto `upstream` apuntando al repositorio principal, lo que generaba el error `fatal: 'upstream' does not appear to be a git repository` al intentar hacer `git fetch upstream`. La solución fue ejecutar `git remote add upstream https://github.com/Karolatf/transferencia_dom.git` una sola vez para registrar el remoto, después de lo cual todos los comandos de sincronización funcionaron correctamente.

La tercera dificultad fue un `permission denied` al intentar hacer `git push origin developer` desde el fork. La causa era que `origin` estaba apuntando al repositorio de la compañera en lugar del fork propio. Se corrigió con `git remote remove origin` seguido de `git remote add origin` apuntando a la URL correcta del fork, y el push funcionó sin problemas.