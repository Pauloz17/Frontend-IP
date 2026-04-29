// MÓDULO: ui/adminPanel.js
// CAPA: UI (manipulación visual de la interfaz)

// Responsabilidad única: montar y gestionar el panel de administración.
// El panel tiene dos secciones:
//   1. Lista de usuarios con formulario de creación y opción de eliminar
//   2. Lista de todas las tareas del sistema

// Este módulo importa de api/ y de utils/. No importa de services/.
// Todo el DOM se construye con createElement y appendChild.
// Ninguna línea de este archivo usa innerHTML ni atributos style en JS.

// Se importan las funciones de la capa API para operaciones CRUD de usuarios
import { obtenerTodosLosUsuarios, crearUsuario, eliminarUsuario } from '../api/usuariosApi.js';

// Se importa la URL base para construir las peticiones de tareas
import { obtenerTodasLasTareas } from '../api/tareasApi.js';

// Se importan las funciones centralizadas de notificaciones.
// adminPanel.js no debe importar Swal directamente; toda notificación
// visual debe pasar por notificaciones.js según la guía 3 del proyecto.
import { mostrarNotificacion, mostrarConfirmacion } from '../utils/notificaciones.js';

// Función principal que monta el panel de administración en el contenedor recibido
// Parámetro: contenedor — el elemento HTML donde se renderiza todo el panel
export async function montarAdminPanel(contenedor) {

    // Se vacía el contenedor con removeChild en lugar de innerHTML = '' para respetar la regla
    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    // Se crea el título principal del panel
    const titulo = document.createElement('h2');
    titulo.className   = 'card__title';
    titulo.textContent = 'Panel de Administración';
    contenedor.appendChild(titulo);

    // Se crean y montan las dos secciones del panel en orden
    await montarSeccionUsuarios(contenedor);
    await montarSeccionTareas(contenedor);
}

// Función que construye la sección de gestión de usuarios
// Muestra un formulario para crear usuarios y una tabla con todos los existentes
// Parámetro: contenedor — el elemento padre donde se inserta esta sección
async function montarSeccionUsuarios(contenedor) {

    // Contenedor de la sección con las clases de card del proyecto
    const seccion = document.createElement('div');
    seccion.className = 'card admin-seccion';

    // Título de la sección de usuarios
    const tituloSeccion = document.createElement('h3');
    tituloSeccion.className   = 'admin-seccion__titulo';
    tituloSeccion.textContent = 'Usuarios del Sistema';
    seccion.appendChild(tituloSeccion);

    // Se construye el formulario de creación llamando a la función dedicada
    const formulario = construirFormularioUsuario();
    seccion.appendChild(formulario);

    // Div donde se renderizará la tabla de usuarios
    const contenedorTabla = document.createElement('div');
    contenedorTabla.id = 'admin-tabla-usuarios';
    seccion.appendChild(contenedorTabla);

    // Se inserta la sección completa en el panel
    contenedor.appendChild(seccion);

    // Se registra el evento submit del formulario de creación de usuario
    formulario.addEventListener('submit', async function(event) {

        // Se previene el comportamiento nativo que recargaría la página
        event.preventDefault();

        // Se leen los valores actuales de los tres campos del formulario
        const documento = document.getElementById('admin-input-documento').value.trim();
        const name      = document.getElementById('admin-input-name').value.trim();
        const email     = document.getElementById('admin-input-email').value.trim();

        // Se valida que ningún campo esté vacío antes de enviar al servidor
        if (!documento || !name || !email) {
            // Se usa mostrarNotificacion centralizado en lugar de Swal directo.
            await mostrarNotificacion('Todos los campos son obligatorios', 'advertencia');
            return;
        }

        // Se llama a la capa API para crear el usuario en el backend
        const usuarioCreado = await crearUsuario({ documento, name, email });

        // Si la creación fue exitosa se recarga la tabla y se limpia el formulario
        if (usuarioCreado) {
            // Se notifica el éxito usando el módulo centralizado de notificaciones.
            await mostrarNotificacion(`${name} fue agregado correctamente`, 'exito');
            formulario.reset();
            await renderizarTablaUsuarios(contenedorTabla);
        } else {
            // Se notifica el error usando el módulo centralizado.
            await mostrarNotificacion('No se pudo crear el usuario', 'error');
        }
    });

    // Se carga la tabla de usuarios por primera vez al montar la sección
    await renderizarTablaUsuarios(contenedorTabla);
}

// Función que construye y devuelve el formulario de creación de usuario
// Tiene tres campos: documento, nombre y correo electrónico
// No recibe parámetros y retorna el elemento form completo listo para insertar
function construirFormularioUsuario() {

    // Elemento form contenedor del formulario
    const form = document.createElement('form');
    form.className = 'admin-form';

    // GRUPO DOCUMENTO
    const grupoDoc = document.createElement('div');
    grupoDoc.className = 'form__group admin-form__grupo';

    // Etiqueta del campo documento
    const labelDoc = document.createElement('label');
    labelDoc.setAttribute('for', 'admin-input-documento');
    labelDoc.className   = 'form__label';
    labelDoc.textContent = 'Número de documento';

    // Input de texto para el número de documento
    const inputDoc = document.createElement('input');
    inputDoc.type        = 'text';
    inputDoc.id          = 'admin-input-documento';
    inputDoc.className   = 'form__input';
    inputDoc.placeholder = 'Ej: 1097497124';

    grupoDoc.appendChild(labelDoc);
    grupoDoc.appendChild(inputDoc);

    // GRUPO NOMBRE
    const grupoNombre = document.createElement('div');
    grupoNombre.className = 'form__group admin-form__grupo';

    // Etiqueta del campo nombre
    const labelNombre = document.createElement('label');
    labelNombre.setAttribute('for', 'admin-input-name');
    labelNombre.className   = 'form__label';
    labelNombre.textContent = 'Nombre completo';

    // Input de texto para el nombre del usuario
    const inputNombre = document.createElement('input');
    inputNombre.type        = 'text';
    inputNombre.id          = 'admin-input-name';
    inputNombre.className   = 'form__input';
    inputNombre.placeholder = 'Ej: María López';

    grupoNombre.appendChild(labelNombre);
    grupoNombre.appendChild(inputNombre);

    // GRUPO EMAIL
    const grupoEmail = document.createElement('div');
    grupoEmail.className = 'form__group admin-form__grupo';

    // Etiqueta del campo correo
    const labelEmail = document.createElement('label');
    labelEmail.setAttribute('for', 'admin-input-email');
    labelEmail.className   = 'form__label';
    labelEmail.textContent = 'Correo electrónico';

    // Input de tipo email — activa la validación nativa del navegador para el formato
    const inputEmail = document.createElement('input');
    inputEmail.type        = 'email';
    inputEmail.id          = 'admin-input-email';
    inputEmail.className   = 'form__input';
    inputEmail.placeholder = 'Ej: maria@correo.com';

    grupoEmail.appendChild(labelEmail);
    grupoEmail.appendChild(inputEmail);

    // BOTÓN SUBMIT
    const boton = document.createElement('button');
    boton.type      = 'submit';
    boton.className = 'btn btn--primary';

    // El span interior es requerido por la clase btn del proyecto (ver styles.css)
    const spanBoton = document.createElement('span');
    spanBoton.className   = 'btn__text';
    spanBoton.textContent = 'Crear Usuario';
    boton.appendChild(spanBoton);

    // Se ensamblan todos los grupos y el botón dentro del form
    form.appendChild(grupoDoc);
    form.appendChild(grupoNombre);
    form.appendChild(grupoEmail);
    form.appendChild(boton);

    return form;
}

// Función que obtiene los usuarios del backend y renderiza la tabla de usuarios
// Se llama al montar el panel y después de crear o eliminar un usuario
// Parámetro: contenedor — el div donde se inserta la tabla renderizada
async function renderizarTablaUsuarios(contenedor) {

    // Se vacía el contenedor con removeChild para no usar innerHTML
    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    // Se pide la lista de usuarios al servidor usando la capa API
    const usuarios = await obtenerTodosLosUsuarios();

    // Si no hay usuarios o hubo error se muestra un párrafo indicativo
    if (!usuarios || usuarios.length === 0) {
        const parrafoVacio = document.createElement('p');
        parrafoVacio.className   = 'admin-vacio';
        parrafoVacio.textContent = 'No hay usuarios registrados.';
        contenedor.appendChild(parrafoVacio);
        return;
    }

    // Se crea la tabla reutilizando la clase tasks-table definida en styles.css
    const tabla = document.createElement('table');
    tabla.className = 'tasks-table admin-tabla';

    // THEAD de la tabla de usuarios
    const thead    = document.createElement('thead');
    const filaHead = document.createElement('tr');

    // Se crea cada th del encabezado — scope="col" mejora la accesibilidad de la tabla
    ['ID', 'Documento', 'Nombre', 'Correo', 'Acciones'].forEach(function(texto) {
        const th = document.createElement('th');
        th.setAttribute('scope', 'col');
        th.textContent = texto;
        filaHead.appendChild(th);
    });

    thead.appendChild(filaHead);
    tabla.appendChild(thead);

    // TBODY de la tabla de usuarios
    const tbody = document.createElement('tbody');

    // Se recorre el arreglo de usuarios y se construye una fila por cada uno
    usuarios.forEach(function(usuario) {

        const fila = document.createElement('tr');

        // Celda con el ID interno del usuario
        const celdaId = document.createElement('td');
        celdaId.textContent = usuario.id;

        // Celda con el número de documento
        const celdaDoc = document.createElement('td');
        celdaDoc.textContent = usuario.documento;

        // Celda con el nombre completo
        const celdaNombre = document.createElement('td');
        celdaNombre.textContent = usuario.name;

        // Celda con el correo electrónico
        const celdaEmail = document.createElement('td');
        celdaEmail.textContent = usuario.email;

        // Celda de acciones con el botón eliminar
        const celdaAcciones = document.createElement('td');
        const divAcciones   = document.createElement('div');
        divAcciones.className = 'task-actions';

        // Botón eliminar — data-id y data-nombre permiten leerlos desde el listener delegado
        const btnEliminar = document.createElement('button');
        btnEliminar.type        = 'button';
        btnEliminar.className   = 'btn-action btn-action--delete';
        btnEliminar.textContent = '🗑 Eliminar';
        btnEliminar.dataset.id     = usuario.id;
        btnEliminar.dataset.nombre = usuario.name;

        divAcciones.appendChild(btnEliminar);
        celdaAcciones.appendChild(divAcciones);

        fila.appendChild(celdaId);
        fila.appendChild(celdaDoc);
        fila.appendChild(celdaNombre);
        fila.appendChild(celdaEmail);
        fila.appendChild(celdaAcciones);
        tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);
    contenedor.appendChild(tabla);

    // Listener delegado en el tbody: maneja todos los botones eliminar de una vez
    // Se evita registrar un listener individual por cada botón
    tbody.addEventListener('click', async function(event) {

        // closest('[data-id]') sube desde el elemento clicado hasta el botón con data-id
        const boton = event.target.closest('[data-id]');
        if (!boton) return;

        const userId        = boton.dataset.id;
        const nombreUsuario = boton.dataset.nombre;

        // Se pide confirmación con SweetAlert2 antes de eliminar
        // buttonsStyling: false es necesario para que customClass funcione en los botones
        // Se usa mostrarConfirmacion centralizado en lugar de Swal directo.
        const confirmado = await mostrarConfirmacion(
            '¿Eliminar usuario?',
            `"${nombreUsuario}" será eliminado permanentemente.`,
            'Sí, eliminar'
        );

        if (!confirmado) return;

        // Se llama a la capa API para eliminar el usuario del servidor
        const exitoso = await eliminarUsuario(userId);

        if (exitoso) {
            // Se notifica el éxito de la eliminación con el módulo centralizado.
            await mostrarNotificacion('Usuario eliminado correctamente', 'exito');
            await renderizarTablaUsuarios(contenedor);
        } else {
            await mostrarNotificacion('Error al eliminar el usuario', 'error');
        }
    });
}

// Función que construye la sección de lista de todas las tareas del sistema
// Muestra una tabla con título, estado y usuario asignado de cada tarea
// Parámetro: contenedor — el elemento padre donde se inserta esta sección
async function montarSeccionTareas(contenedor) {

    // Contenedor de la sección de tareas con las clases de card del proyecto
    const seccion = document.createElement('div');
    seccion.className = 'card admin-seccion';

    // Título de la sección de tareas
    const tituloSeccion = document.createElement('h3');
    tituloSeccion.className   = 'admin-seccion__titulo';
    tituloSeccion.textContent = 'Todas las Tareas del Sistema';
    seccion.appendChild(tituloSeccion);

    // Se obtienen todas las tareas desde el backend
    let tareas = [];
    try {
        tareas = await obtenerTodasLasTareas();
    } catch (error) {
        console.error('Error al obtener tareas para el panel admin:', error);
    }

    // Si no hay tareas se muestra un párrafo indicativo y se termina la función
    if (tareas.length === 0) {
        const mensaje = document.createElement('p');
        mensaje.className   = 'admin-vacio';
        mensaje.textContent = 'No hay tareas registradas en el sistema.';
        seccion.appendChild(mensaje);
        contenedor.appendChild(seccion);
        return;
    }

    // Se crea la tabla reutilizando la clase tasks-table del proyecto
    const tabla = document.createElement('table');
    tabla.className = 'tasks-table admin-tabla';

    // THEAD de la tabla de tareas
    const thead    = document.createElement('thead');
    const filaHead = document.createElement('tr');

    // Se crean los tres th del encabezado
    ['Título', 'Estado', 'Usuarios asignados'].forEach(function(texto) {
        const th = document.createElement('th');
        th.setAttribute('scope', 'col');
        th.textContent = texto;
        filaHead.appendChild(th);
    });

    thead.appendChild(filaHead);
    tabla.appendChild(thead);

    // TBODY de la tabla de tareas
    const tbody = document.createElement('tbody');

    // Se recorre el arreglo de tareas y se construye una fila por cada una
    tareas.forEach(function(tarea) {

        const fila = document.createElement('tr');

        // Celda con el título de la tarea
        const celdaTitulo = document.createElement('td');
        celdaTitulo.textContent = tarea.title;

        // Celda con el badge de estado coloreado
        const celdaEstado = document.createElement('td');
        const badge = document.createElement('span');
        badge.classList.add('status-badge', `status-${tarea.status}`);
        badge.textContent = formatearEstado(tarea.status);
        celdaEstado.appendChild(badge);

        // Celda con los usuarios asignados
        // Si assignedUsers existe y tiene elementos se unen con coma
        const celdaUsuarios = document.createElement('td');
        celdaUsuarios.textContent = tarea.assignedUsers && tarea.assignedUsers.length > 0
            ? tarea.assignedUsers.join(', ')
            : 'Sin asignar';

        fila.appendChild(celdaTitulo);
        fila.appendChild(celdaEstado);
        fila.appendChild(celdaUsuarios);
        tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);
    seccion.appendChild(tabla);
    contenedor.appendChild(seccion);
}

// Convierte el valor técnico del estado a texto legible en español
// Se usa en la tabla de tareas del panel admin
// Parámetro: estado — valor del campo status (pendiente, en_progreso, completada)
function formatearEstado(estado) {
    if (estado === 'pendiente')   return 'Pendiente';
    if (estado === 'en_progreso') return 'En Progreso';
    if (estado === 'completada')  return 'Completada';
    return estado;
}