# Documentación Técnica — Sistema de Gestión de Tareas

**Autores:** Karol Nicolle Torres Fuentes, Juan Sebastian Patiño Hernandez  
**Fecha:** 19-02-2026 | **Institución:** SENA

---

## Descripción

Aplicación web para buscar usuarios y gestionar tareas (crear, editar y eliminar) 
mediante manipulación del DOM y consumo de una API RESTful.

---

## Archivos del Proyecto

**index.html** — Estructura HTML con 6 secciones: header, formulario de búsqueda, datos del usuario, formulario de tareas, tabla de tareas y modal de edición.

**config.js** — Contiene la constante `API_BASE_URL`. Centraliza la URL del servidor para que cualquier cambio de puerto solo se haga aquí.

**state.js** — Variables de estado globales (`currentUser`, `registeredTasks`, `taskCounter`) y sus funciones de modificación: `setCurrentUser()`, `addTask()`, `updateTaskInState()`, `removeTaskFromState()`, `resetState()`.

**dom.js** — Selección centralizada de todos los elementos HTML con `getElementById()`. Evita repetir la selección en cada módulo.

**validation.js** — Validación de formularios y manejo visual de errores. Funciones: `isValidInput()`, `showError()`, `clearError()`, `validateSearchForm()`, `validateTaskForm()`.

**ui.js** — Manipulación visual: mostrar/ocultar secciones, crear filas, controlar el modal. Funciones clave: `createTaskRow()`, `addTaskToTable()`, `updateTaskRow()`, `removeTaskRow()`, `showEditModal()`, `hideEditModal()`.

**api.js** — Peticiones HTTP al servidor: `searchUserByDocument()` (GET), `registerTask()` (POST), `updateTask()` (PATCH), `deleteTask()` (DELETE).

**handlers.js** — Manejadores de eventos: `handleSearchFormSubmit()`, `handleTaskFormSubmit()`, `handleTableClick()`, `handleEditTask()`, `handleDeleteTask()`.

**events.js** — Registro centralizado de todos los event listeners. Se llama una sola vez al inicializar la app desde `script.js`.

**barril.js** — Re-exporta todo desde un único punto de entrada, permitiendo que `script.js` importe desde un solo lugar.

**script.js** — Punto de entrada principal. Espera `DOMContentLoaded` y llama a `registerEventListeners()` y `showEmptyState()`.

---

## Flujo de la Aplicación

1. El usuario ingresa su documento -> se valida el campo.
2. Se hace una petición `GET /users` al servidor.
3. Si el usuario existe, se muestran sus datos y se habilita el formulario de tareas.
4. El usuario completa el formulario (título, descripción, estado) -> se valida.
5. Se envía `POST /tasks`. Si es exitoso, se crea un `<tr>` con `createElement()` y se inserta en el tbody con `appendChild()`.
6. **Editar:** clic en "Editar" → se abre el modal con datos precargados -> al guardar se envía `PATCH /tasks/:id` y se actualiza la fila en el DOM sin recargar.
7. **Eliminar:** clic en "Eliminar" -> `confirm()` pide confirmación -> se envía `DELETE /tasks/:id` y se elimina la fila del DOM.

---

## Manipulación del DOM

**Elementos creados dinámicamente:** un `<tr>` por cada tarea, con seis `<td>` (número, título, descripción, estado, usuario, acciones) y dos `<button>` (Editar y Eliminar).

**Métodos utilizados:** `getElementById()`, `querySelector()`, `createElement()`, `appendChild()`, `remove()`, `textContent`, `classList.add()`, `classList.remove()`, `dataset`, `closest()`.

**Delegación de eventos:** se registra un único listener en `tasksTableBody` en lugar de uno por botón. Los clics burbujean desde el botón hasta el tbody, donde el handler identifica la acción con `data-action` y el ID con `data-id`. Esto resuelve que los botones se crean dinámicamente después de registrar el listener, y mejora el rendimiento al usar un solo listener para toda la tabla.

---

## Requisitos e Instalación

```bash
npm init -y
npm install
npx json-server server.json
```

**server.json:**
```json
{
  "users": [{ "id": 1097497124, "name": "Karol Torres", "email": "karol@email.com" }],
  "tasks": []
}
```

**Endpoints:** `GET /users`, `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`.

---

## Estilos CSS

Variables CSS en `:root` centralizan colores, fuentes y espaciados. Reset universal con `box-sizing: border-box`. Componentes principales: header con sombra, cards blancas para formularios, inputs con estados de foco y error, botones `.btn--primary` (morado), `.btn--secondary` (gris), `.btn-action--edit` (azul) y `.btn-action--delete` (rojo), modal con overlay oscuro, badges de estado con color según valor, clase `.hidden` para ocultar elementos, animación `slideIn`, y responsive para pantallas menores a 768px.

---

## Preguntas de Reflexión

**1. ¿Qué elemento del DOM estás seleccionando?**  
Se seleccionan múltiples elementos: los formularios `searchUserForm` y `taskForm`, los inputs `userDocumentInput`, `taskTitleInput` y `taskDescriptionInput`, el select `taskStatusSelect` y el tbody `tasksTableBody`. Todos se seleccionan con `document.getElementById()` en `dom.js`.

**2. ¿Qué evento provoca el cambio en la página?**  
Varios eventos: `submit` en los formularios al hacer clic en los botones de envío, `input` en los campos de texto con cada pulsación de tecla, `change` en el select de estado al elegir una opción, y `click` delegado en el tbody para los botones de Editar y Eliminar.

**3. ¿Qué nuevo elemento se crea?**  
Se crea un `<tr>` (fila de tabla) mediante `document.createElement()` en la función `createTaskRow()` de `ui.js`. Contiene seis `<td>` con los datos de la tarea y los botones de acción.

**4. ¿Dónde se inserta ese elemento dentro del DOM?**  
Dentro del `<tbody>` de la tabla (`tasksTableBody`) usando `appendChild()` en la función `addTaskToTable()` de `ui.js`.

**5. ¿Qué ocurre en la página cada vez que repites la acción?**  
Se crea y agrega una nueva fila `<tr>` al tbody, se actualiza el contador de tareas, se oculta el mensaje de estado vacío si estaba visible, se muestra la sección de la tabla si estaba oculta, y el formulario se limpia para recibir una nueva entrada.

---