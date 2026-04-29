# Parte 1 – Análisis del Proyecto Actual - Antes de la Guía de Modularización
## Sistema de Gestión de Tareas

**Autores:** Karol Nicolle Torres Fuentes, Juan Sebastian Patiño Hernandez  
**Fecha:** 21-02-2026  
**Institución:** SENA
**Instructor:** John Freddy Becerra Castellanos
**Fase:** Modularización ES Modules

---

## 1. Contexto del Proyecto

El proyecto analizado es el Sistema de Gestión de Tareas construido en la guía anterior, que implementa un CRUD completo con cuatro requisitos funcionales:

**RF-01 READ** — Buscar un usuario en el servidor por número de documento (`GET /users`)

**RF-02 CREATE** — Registrar nuevas tareas asociadas al usuario encontrado (`POST /tasks`)

**RF-03 UPDATE** — Editar tareas existentes mediante un modal emergente (`PATCH /tasks/:id`)

**RF-04 DELETE** — Eliminar tareas con confirmación previa del usuario (`DELETE /tasks/:id`)

El código ya cuenta con una modularización inicial distribuida en 10 archivos JavaScript: `script.js` más 9 módulos en `/modulos/`. El objetivo de este análisis es identificar con precisión qué hace cada archivo, qué relaciones existen entre ellos y qué oportunidades de mejora existen antes de comenzar la reorganización.

![alt text](image.png)

---

## 2. Inventario de Archivos y Responsabilidades

### script.js (~50 líneas)

Es el único punto de entrada — el HTML solo referencia este archivo. Espera el evento `DOMContentLoaded` antes de ejecutar cualquier código, luego llama a `registerEventListeners()` para conectar el DOM con los handlers y a `showEmptyState()` para mostrar el estado inicial de la tabla. Todos sus imports provienen de `barril.js`.

### barril.js (~93 líneas)

Re-exporta absolutamente todo: config, state, dom, validation, ui, api, handlers y events. No contiene ninguna lógica propia, es solo un intermediario de imports (patrón barrel) que permite que `script.js` importe todo desde un único lugar. **Problema:** es un punto de fallo centralizado — un error en cualquier módulo rompe todos los imports.

### config.js (~9 líneas)

Exporta únicamente la constante `API_BASE_URL = "http://localhost:3000"`. No tiene dependencias de ningún otro módulo. Si el puerto del servidor cambia, solo se modifica este archivo.

### state.js (~92 líneas)

Almacena las variables globales de la sesión: `currentUser`, `registeredTasks` y `taskCounter`. Expone las funciones `setCurrentUser(user)`, `incrementTaskCounter()`, `addTask(task)`, `updateTaskInState(updatedTask)`, `removeTaskFromState(taskId)` y `resetState()`. No importa nada de otros módulos del proyecto.

### dom.js (~96 líneas)

Solo contiene selecciones `getElementById()`, sin ninguna lógica propia. Exporta referencias a todos los elementos del HTML: el formulario de búsqueda, la sección de datos del usuario, el formulario de tareas, la tabla y el estado vacío. Al centralizar estas selecciones se evita repetir `getElementById()` en cada módulo.

### validation.js (~148 líneas)

Contiene `isValidInput(value)` para verificar que un string no esté vacío, `showError()` y `clearError()` para manejar mensajes de error en los inputs, y `validateSearchForm()` y `validateTaskForm()` para validar cada formulario. **Problema:** estas dos últimas funciones importan elementos directamente de `dom.js`, lo que acopla este módulo a la estructura HTML específica del proyecto.

### api.js (~221 líneas)

Concentra toda la comunicación con el servidor: `searchUserByDocument(documentId)` para el GET, `registerTask(taskData)` para el POST, `updateTask(taskId, taskData)` para el PATCH y `deleteTask(taskId)` para el DELETE. Todas las funciones usan `try/catch` y verifican `response.ok`. Solo importa `API_BASE_URL` de `config.js` — no conoce el DOM, la UI ni el estado.

### ui.js (~403 líneas)

Es la capa de presentación. Agrupa 16 funciones que controlan lo que el usuario ve: mostrar u ocultar la sección del usuario, el formulario de tareas, la tabla y el estado vacío; construir filas del DOM dinámicamente; actualizar el badge del contador de tareas; y manejar el modal de edición. Importa de `dom.js` y también usa `clearError` de `validation.js`.

### handlers.js (~451 líneas)

Orquesta el flujo completo de cada operación. `handleSearchFormSubmit` atiende el RF-01, `handleTaskFormSubmit` el RF-02, `handleEditTask` el RF-03 y `handleDeleteTask` el RF-04. También maneja la delegación de clics en la tabla y la limpieza de errores en tiempo real. **Problema:** importa de 5 módulos distintos (dom, validation, ui, api, state), lo que lo convierte en el módulo más acoplado del proyecto.

### events.js (~95 líneas)

Expone una sola función, `registerEventListeners()`, que registra todos los eventos de la aplicación y conecta cada elemento del DOM con su handler correspondiente. Importa de `dom.js`, `handlers.js` y `state.js`, cruzando tres capas distintas.

---

## 3. Clasificación de Funciones por Responsabilidad

**Interfaz (UI):** todas las funciones de `ui.js` — `displayUserData`, `hideUserData`, `showTaskForm`, `hideTaskForm`, `showTasksSection`, `showEmptyState`, `hideEmptyState`, `updateTaskCounter`, `formatTaskStatus`, `createTaskRow`, `addTaskToTable`, `clearTaskForm`, `updateTaskRow`, `removeTaskRow`, `showEditModal` y `hideEditModal`.

**Comunicación con la API:** las cuatro funciones de `api.js` — `searchUserByDocument`, `registerTask`, `updateTask` y `deleteTask`.

**Coordinación del flujo:** las funciones de `handlers.js` para cada RF más `registerEventListeners()` de `events.js`.

**Validación:** `isValidInput`, `showError`, `clearError`, `validateSearchForm` y `validateTaskForm`, todas en `validation.js`.

**Estado global:** las variables y funciones de `state.js`.

**Selecciones del DOM:** todas las referencias exportadas por `dom.js`.

---

## 4. Esquema del Flujo de Datos

El usuario dispara un evento en el DOM. `events.js` lo captura mediante los listeners registrados y delega la ejecución al handler correspondiente en `handlers.js`. Desde allí se coordinan tres acciones en paralelo: se consulta o actualiza el estado en `state.js`, se llama a la función correspondiente en `api.js` para comunicarse con el servidor (`json-server` en el puerto 3000) y se instruye a `ui.js` para que refleje el resultado en la interfaz. Tanto `dom.js` como `config.js` actúan como módulos de soporte transversal disponibles para cualquier capa.

**Observación:** `handlers.js` actúa como hub central que conoce directamente 5 capas distintas. La ausencia de una capa "service" intermedia lo convierte en el punto más acoplado del proyecto.

Usuario (evento DOM) -> events.js (registerEventListeners()) / dom.js (referencias HTML) -> handlers.js (orquestador) / state.js / ui.js -> api.js (fetch HTTP) -> servidor json-server: 3000 / config.js (API_BASE_URL)

---

## 5. Mapa de Dependencias entre Módulos

`config.js`, `state.js` y `dom.js` son módulos de nivel 0: no importan nada de otros archivos del proyecto y son completamente independientes.

`api.js` solo depende de `config.js`, lo que lo mantiene bien aislado de la UI y el estado.

`validation.js` importa de `dom.js`, lo que acopla sus funciones de validación a la estructura HTML de este proyecto específico.

`ui.js` importa de `dom.js` y de `validation.js`. Que la capa visual conozca la capa de validación es un problema de diseño: `clearError()` debería ser independiente.

`handlers.js` importa de 5 módulos: dom, validation, ui, api y state. Es el módulo con mayor acoplamiento.

`events.js` importa de `dom.js`, `handlers.js` y `state.js`, cruzando tres capas distintas para poder pasar `registeredTasks` al handler de clics en la tabla.

`barril.js` conoce todos los módulos del proyecto, convirtiéndose en el punto de fallo total.

`script.js` importa todo desde `barril.js`, lo que significa que depende de la cadena completa aunque su propio código sea correcto.

---

## 6. Análisis de Funciones Reutilizables

**Completamente reutilizables:**

`isValidInput(value)` es una función pura — recibe un string y retorna un booleano, sin efectos secundarios ni dependencias. Se podría usar en cualquier proyecto JavaScript sin modificación.

`formatTaskStatus(status)` también es una función pura — recibe un string y retorna otro. Sin DOM ni estado. Es candidata ideal para una capa `utils/` independiente.

Las cuatro funciones de `api.js` son reutilizables porque solo dependen de `API_BASE_URL` y no conocen nada de la UI ni del estado local.

**Parcialmente reutilizables:**

`showError(errorEl, inputEl, msg)` y `clearError(errorEl, inputEl)` tienen un diseño correcto — reciben los elementos como parámetros en lugar de acceder a ellos directamente. El problema es que conviven en `validation.js` junto a las funciones que sí están acopladas al DOM.

**No reutilizables:**

`validateSearchForm()` y `validateTaskForm()` acceden directamente a los elementos importados de `dom.js`. No pueden usarse en otro proyecto sin modificarlas y sin llevar consigo toda la estructura de archivos de este HTML.

---

## 7. Respuestas a las Preguntas

**¿Qué responsabilidades existen actualmente dentro del archivo principal (`script.js`)?**

`script.js` tiene tres responsabilidades bien delimitadas: esperar el `DOMContentLoaded`, llamar a `registerEventListeners()` y llamar a `showEmptyState()`. El problema no está en su lógica sino en que sus tres imports dependen de `barril.js`. Si ese archivo falla por cualquier razón, `script.js` no puede inicializar aunque su propio código esté correcto.

**¿Qué funciones pertenecen a la interfaz (UI)?**

Las 16 funciones de `ui.js`. Controlan exclusivamente qué se muestra y cómo se muestra, sin tomar decisiones de negocio ni comunicarse directamente con el servidor.

**¿Qué funciones realizan comunicación con la API?**

Las cuatro funciones de `api.js`: `searchUserByDocument`, `registerTask`, `updateTask` y `deleteTask`. Este módulo está correctamente aislado — solo importa `API_BASE_URL` de `config.js` y no conoce nada del DOM ni del estado. Es la mejor capa diseñada del proyecto.

**¿Qué funciones coordinan el flujo general?**

Los cuatro handlers de `handlers.js` (uno por cada RF) reciben el evento, validan, llaman a la API, actualizan el estado y ordenan a la UI que se actualice. La función `registerEventListeners()` de `events.js` actúa como pegamento que conecta cada elemento con su handler. El problema es que `handlers.js` importa de 5 módulos al mismo tiempo sin una capa "service" intermedia que separe responsabilidades.

**¿Existen funciones reutilizables que podrían aislarse?**

Sí. `isValidInput()`, `formatTaskStatus()` y las cuatro funciones de `api.js` son completamente reutilizables tal como están. `showError()` y `clearError()` son reutilizables en su lógica pero no en su módulo actual. `validateSearchForm()` y `validateTaskForm()` no son reutilizables sin refactorización. Aislar las funciones puras en una carpeta `utils/` es una de las mejoras prioritarias de la reorganización.

---

## 8. Hallazgos y Conclusión del Equipo

El proyecto funciona y cumple todos los requisitos funcionales. Sin embargo, el análisis identifica cuatro problemas de arquitectura que justifican la reorganización.

El primero es que `barril.js` crea un punto de fallo centralizado: un error en cualquier módulo re-exportado rompe toda la aplicación, incluso si el código de `script.js` es correcto.

El segundo es que `validation.js` importa `dom.js` directamente, lo que impide reutilizar sus funciones de validación en otro proyecto sin llevar consigo toda la estructura de archivos.

El tercero es que `handlers.js` tiene acoplamiento excesivo: conoce simultáneamente las capas DOM, validación, UI, API y estado. Cualquier cambio en cualquiera de esas capas puede requerir modificar este archivo.

El cuarto es que no existe una capa "service" intermedia. Los handlers mezclan la coordinación del flujo con los detalles de implementación de cada capa.

El problema no es que el código no funcione — funciona correctamente. El problema es que su arquitectura actual dificulta el crecimiento, el mantenimiento y la reutilización de código. Estos hallazgos son la base para la reorganización planteada en las Partes 2 y 3 de esta actividad.

---