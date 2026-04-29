# Documentación Técnica
## Sistema de Gestión de Tareas

**Autores:** Karol Nicolle Torres Fuentes, Juan Sebastian Patiño Hernandez  
**Institución:** SENA – Técnico en Programación de Software  
**Fecha:** 21-02-2026

---

## Descripción general

El Sistema de Gestión de Tareas es una aplicación web de una sola página que permite buscar usuarios registrados y asociarles tareas con título, descripción y estado. Implementa las cuatro operaciones CRUD completas: lectura de usuarios (RF-01), creación de tareas (RF-02), actualización (RF-03) y eliminación (RF-04). Funciona sobre un servidor local `json-server` que expone los endpoints `/users` y `/tasks` en `http://localhost:3000`.

---

## Estructura de archivos

El proyecto sigue una arquitectura en capas organizada en carpetas con responsabilidades exclusivas.

`index.html` es la única página del sistema y define toda la estructura visual estática. `script.js` en la raíz es el punto de entrada que inicializa la aplicación. La carpeta `api/` contiene `tareasApi.js`, que centraliza todas las peticiones HTTP. La carpeta `services/` contiene `tareasService.js`, que actúa como capa intermedia entre la API y la interfaz. La carpeta `ui/` contiene `tareasUI.js`, que gestiona exclusivamente la manipulación del DOM. La carpeta `utils/` contiene `config.js` con la URL base del servidor y `validaciones.js` con las funciones de validación de formularios. El archivo `styles.css` aplica todos los estilos visuales mediante clases BEM.

---

## Estructura HTML

El `index.html` está organizado en secciones semánticas bien delimitadas.

El `header` contiene el título principal y el subtítulo descriptivo de la aplicación. La primera `section` aloja el formulario `searchUserForm` con un campo de texto `userDocument` para ingresar el número de documento y un span `userDocumentError` donde JavaScript inyecta mensajes de error. El atributo `novalidate` desactiva la validación nativa del navegador para ceder el control a JavaScript.

La segunda sección, `userDataSection`, está oculta por defecto mediante la clase `hidden`. Se hace visible cuando se encuentra un usuario y muestra dinámicamente su ID en `userId`, su nombre en `userName` y su correo en `userEmail`.

La tercera sección, `taskFormSection`, también oculta por defecto, contiene el formulario `taskForm` con los campos `taskTitle`, `taskDescription` y el select `taskStatus` con las opciones pendiente, en progreso y completada. Cada campo tiene su span de error correspondiente.

La cuarta sección es la tabla de tareas con el `thead` estático y el `tbody` con id `tasksTableBody`, donde JavaScript inserta las filas dinámicamente. Debajo de la tabla existe un div `tasksEmptyState` que se muestra cuando no hay tareas registradas.

Al final del `body`, fuera del contenedor principal, se encuentra el modal de edición `editModal`. Es un overlay con clase `hidden` que contiene el formulario `editTaskForm`. Incluye un campo oculto `editTaskId` que almacena el ID de la tarea en edición, los mismos campos de título, descripción y estado del formulario de creación, y dos botones: uno de cancelar (`editCancelBtn`) y uno de submit para guardar cambios. El modal se controla completamente desde `tareasService.js`, que registra y remueve sus listeners dinámicamente para evitar acumulaciones.

El script se carga al final del `body` con `type="module"`, lo que permite usar la sintaxis `import/export` entre archivos y garantiza que el DOM esté disponible al ejecutarse.

---

## Capas de la aplicación

**utils/config.js** es el módulo de nivel más bajo y no tiene dependencias. Exporta únicamente la constante `API_BASE_URL` con la dirección base del servidor. Cualquier cambio de puerto o dominio se aplica aquí y se propaga automáticamente al resto del sistema.

**utils/validaciones.js** tampoco tiene dependencias externas. Exporta las funciones `entradaEsValida`, `mostrarError`, `limpiarError`, `validarFormularioBusqueda` y `validarFormularioTareas`. Recibe los elementos del DOM como parámetros en lugar de seleccionarlos directamente, lo que la hace reutilizable e independiente de la estructura HTML.

**api/tareasApi.js** importa únicamente `API_BASE_URL` y centraliza las cuatro peticiones HTTP. `buscarUsuarioPorDocumento` realiza un GET a `/users` y filtra por ID en el cliente. `registrarTarea` realiza un POST a `/tasks` con el objeto de la tarea serializado como JSON. `actualizarTarea` realiza un PATCH a `/tasks/:id` enviando solo los campos modificados. `eliminarTarea` realiza un DELETE a `/tasks/:id` sin cuerpo. Todas las funciones son asíncronas, usan `try/catch` y retornan `null` o `false` en caso de error para no romper el flujo de la aplicación.

**ui/tareasUI.js** importa únicamente funciones de `validaciones.js` si las necesita y nunca conoce la existencia de la API. Se encarga de mostrar y ocultar secciones manipulando la clase `hidden`, de inyectar los datos del usuario en los spans correspondientes, de insertar y actualizar filas en el `tbody`, de mostrar y ocultar el modal de edición, y de gestionar el estado vacío de la tabla.

**services/tareasService.js** es el único módulo que importa tanto de la capa `api` como de la capa `ui`. Mantiene el estado local de la aplicación en tres variables: `usuarioActual`, `tareasRegistradas` y `contadorTareas`. Exporta los manejadores de eventos `manejarBusquedaUsuario`, `manejarRegistroTarea`, `manejarEdicionTarea`, `manejarGuardadoEdicion` y `manejarEliminacionTarea`, además de `registrarEventListeners`, que es la única función llamada desde `script.js`. Usa delegación de eventos en el `tbody` para gestionar los botones de editar y eliminar de filas creadas dinámicamente.

**script.js** es el punto de arranque. Escucha el evento `DOMContentLoaded` y dentro de él llama a `registrarEventListeners()` y a `mostrarEstadoVacio()`. No contiene lógica propia y su propósito es exclusivamente inicializar los demás módulos.

---

## Flujo de una operación completa

Cuando el usuario llena el formulario de búsqueda y hace clic en "Buscar Usuario", el evento `submit` del formulario llama a `manejarBusquedaUsuario` en el service. El service valida el campo con `validarFormularioBusqueda`, luego delega la petición HTTP a `buscarUsuarioPorDocumento` en la capa API. La API realiza el GET, filtra el arreglo devuelto por el servidor y retorna el objeto del usuario o null. El service recibe la respuesta, actualiza su variable de estado `usuarioActual` y ordena a la UI que muestre los datos del usuario y revele el formulario de tareas. En ningún momento la UI conoce que existió una petición HTTP, ni la API sabe que hay una interfaz esperando su respuesta.

---

## Requisitos de ejecución

El servidor `json-server` debe estar activo en el puerto 3000 con un archivo `db.json` que contenga al menos los arreglos `users` y `tasks`. El navegador debe soportar ES Modules de forma nativa, ya que el proyecto usa `import/export` sin ningún bundler o transpilador. El archivo `script.js` debe cargarse con `type="module"` tal como está definido en el `index.html`.