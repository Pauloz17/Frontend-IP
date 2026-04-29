# DOCUMENTACIÓN TÉCNICA
## Sistema de Gestión de Tareas

**Autores:** Karol Nicolle Torres Fuentes, Juan Sebastian Patiño Hernandez  
**Fecha:** 11-02-2026  
**Institución:** SENA

---

## DESCRIPCIÓN
Aplicación web para buscar usuarios y registrar tareas mediante manipulación del DOM.

---

## ARCHIVOS

### index.html
Estructura HTML con 5 secciones principales:
1. **Header** - Título de la aplicación
2. **Formulario de búsqueda** - Input para documento de usuario
3. **Datos del usuario** - Muestra ID, nombre y email
4. **Formulario de tareas** - Título, descripción y estado
5. **Tabla de tareas** - Lista de tareas registradas

### script.js
Funcionalidad JavaScript organizada en:

**Variables principales:**
- `currentUser` - Usuario actual
- `registeredTasks` - Array de tareas
- `taskCounter` - Contador de tareas

**Funciones clave:**
- `validateSearchForm()` / `validateTaskForm()` - Validación de formularios
- `searchUserByDocument()` - Busca usuario en servidor (GET)
- `registerTask()` - Registra tarea en servidor (POST)
- `createTaskRow()` - Crea elemento `<tr>` con datos de tarea
- `addTaskToTable()` - Inserta fila en tabla con `appendChild()`

---

## FLUJO DE LA APLICACIÓN

```
1. Usuario ingresa documento -> Validación
2. Búsqueda en servidor (GET /users)
3. Si existe: Muestra datos y habilita formulario de tareas
4. Usuario completa formulario -> Validación
5. Registro en servidor (POST /tasks)
6. Creación de fila en tabla (createElement + appendChild)
7. Actualización de contador
```

---

## MANIPULACIÓN DEL DOM

**Elementos creados dinámicamente:**
- `<tr>` - Fila de tabla por cada tarea
- `<td>` - 5 celdas: número, título, descripción, estado, usuario

**Métodos utilizados:**
- `getElementById()` - Selección de elementos
- `createElement()` - Creación de elementos
- `appendChild()` - Inserción en el DOM
- `textContent` - Modificación de contenido
- `classList.add()` / `classList.remove()` - Manejo de clases

---

## REQUISITOS

**JSON Server:**
```bash
npm init -y
npm install
server.json
npx json-server server.json
```

**server.json:**
```json
{
  "users": [
    {"id": 1097497124, "name": "Karol Torres", "email": "karoln.oficiall@gmail.com"}
  ],
  "tasks": []
}
```

**Endpoints:**
- `GET /users` - Obtener usuarios
- `POST /tasks` - Crear tarea

---

## USO

1. Iniciar servidor: `npx json-server server.json`
2. Abrir `index.html` en navegador
3. Buscar usuario por ID
4. Registrar tareas completando el formulario
5. Ver tareas en la tabla

---

## CONCEPTOS DOM

- **Selección**: `document.getElementById()`
- **Creación**: `document.createElement()`
- **Inserción**: `element.appendChild()`
- **Eventos**: `addEventListener()`
- **Validación**: JavaScript personalizada

---

**Documentación básica de estilos**

**Variables**
- Definen colores, tipografía, tamaños y espaciados reutilizables.
- Se declaran en :root y se usan con var(--nombre).

**Reset**
- Elimina márgenes y paddings por defecto.
- Usa box-sizing: border-box.

**Estructura principal**
- body: tipografía, color de texto, fondo rosado suave.
- .container: centra y limita el ancho, organiza en columna.

**Componentes**
- Header (.header): título y subtítulo centrados, fondo blanco con sombra.
- Card (.card): contenedor blanco con sombra, usado en formularios y datos.
- Formularios (.form__group, .form__input): inputs con estados de foco y error.
- Botón (.btn, .btn--primary): estilo morado, hover y active con sombra.
- User info (.user-info): muestra datos del usuario en bloques grises.
- Tasks (.tasks-section): tabla de tareas con encabezado, badges de estado y estado vacío.
- Footer (.footer): texto centrado, fondo blanco.

**Utilidades**
- .hidden: oculta elementos.
- Animación slideIn: entrada suave con opacidad y desplazamiento.

**Responsive**
- Ajustes para pantallas menores a 768px: menos padding, títulos más pequeños, botones al 100%.

---

**Fin de la Documentación**

---

**PREGUNTAS DE REFLEXIÓN (RESPUESTAS)**

**PREGUNTAS DE REFLEXIÓN:**

```
1. ¿Qué elemento del DOM estás seleccionando?
    R: Estoy seleccionando múltiples elementos del DOM usando getElementById():
       - Formularios: searchUserForm, taskForm
       - Inputs: userDocumentInput, taskTitleInput, taskDescriptionInput
       - Selects: taskStatusSelect
       - Secciones: userDataSection, taskFormSection, tasksSection
       - Spans para errores y datos de usuario
       - Elementos de tabla: tasksTableBody
 
2. ¿Qué evento provoca el cambio en la página?
    R: Los principales eventos son:
       - 'submit' en los formularios: cuando el usuario envía datos
       - 'input' en los campos: cuando el usuario escribe
       - 'change' en el select: cuando el usuario selecciona una opción
 
3. ¿Qué nuevo elemento se crea?
    R: Se crean dinámicamente:
       - Elementos TR (filas de tabla) para cada tarea
       - Elementos TD (celdas) dentro de cada fila
       Estos elementos se crean con createElement() y se insertan con appendChild()
 
4. ¿Dónde se inserta ese elemento dentro del DOM?
    R: Los elementos TR se insertan dentro del elemento TBODY de la tabla,
       que tiene el ID 'tasksTableBody'. Se insertan al final usando appendChild(),
       de manera que cada nueva tarea aparece debajo de la anterior.
 
5. ¿Qué ocurre en la página cada vez que repites la acción?
    R: Cada vez que se registra una nueva tarea:
       - Se crea una nueva fila en la tabla
       - Se incrementa el contador de tareas
       - Se actualiza el texto del contador
       - La tabla se expande para mostrar la nueva tarea
       - El estado vacío permanece oculto
       - El formulario se limpia para permitir registrar otra tarea
       Todo esto ocurre sin recargar la página gracias al DOM
```
---
**Fin de las peguntas**
---