// MÓDULO: ui/tareasUI.js
// CAPA:   UI

// Responsabilidad única: controlar lo que el usuario ve en la vista USUARIO.
// Muestra, oculta y actualiza secciones; construye filas de tabla;
// gestiona el modal de edición.
//
// REGLAS:
//   SI puede leer y escribir en el DOM
//   SI puede importar de utils/
//   NO puede importar de api/ ni de services/

import { limpiarError } from '../utils/validaciones.js';

// ── REFERENCIAS AL DOM ────────────────────────────────────────────────────────

const seccionDatosUsuario = document.getElementById('userDataSection');
const spanIdUsuario        = document.getElementById('userId');
const spanNombreUsuario    = document.getElementById('userName');
const spanEmailUsuario     = document.getElementById('userEmail');

const seccionTareas    = document.getElementById('tasksSection');
const contadorEl       = document.getElementById('tasksCount');
const cuerpoDeLaTabla  = document.getElementById('tasksTableBody');
const mensajeVacio     = document.getElementById('tasksEmptyState');

// ── VISIBILIDAD ───────────────────────────────────────────────────────────────

export function mostrarDatosUsuario(usuario) {
    seccionDatosUsuario.classList.remove('hidden');
    spanIdUsuario.textContent     = usuario.documento || usuario.id;
    spanNombreUsuario.textContent = usuario.name;
    spanEmailUsuario.textContent  = usuario.email;
}

export function ocultarDatosUsuario() {
    seccionDatosUsuario.classList.add('hidden');
    spanIdUsuario.textContent     = '';
    spanNombreUsuario.textContent = '';
    spanEmailUsuario.textContent  = '';
}

export function mostrarSeccionTareas()  { seccionTareas.classList.remove('hidden'); }
export function ocultarSeccionTareas()  { seccionTareas.classList.add('hidden'); }
export function mostrarEstadoVacio()    { mensajeVacio.classList.remove('hidden'); }
export function ocultarEstadoVacio()    { mensajeVacio.classList.add('hidden'); }

// ── CONTADOR ──────────────────────────────────────────────────────────────────

export function actualizarContadorTareas(cantidad) {
    contadorEl.textContent = cantidad === 1 ? `${cantidad} tarea` : `${cantidad} tareas`;
}

// ── FORMATO ───────────────────────────────────────────────────────────────────

// Convierte el valor técnico del estado a texto legible en español.
// Se usa en los badges de la tabla del panel usuario y en actualizarFilaTarea.
// ACTUALIZACIÓN v3.4.0: incluye el cuarto estado pendiente_aprobacion.
export function formatearEstadoTarea(estado) {
    const mapa = {
        pendiente:            'Pendiente',
        en_progreso:          'En Progreso',
        // El usuario marca este estado cuando considera que terminó su trabajo
        pendiente_aprobacion: 'Pendiente por aprobar',
        completada:           'Completada',
    };
    // Si el estado no existe en el mapa se retorna el valor original como fallback
    return mapa[estado] || estado;
}

// ── CONSTRUCCIÓN DE FILA ──────────────────────────────────────────────────────

// Crea un TR completo con columnas: #, Título, Descripción, Estado, Comentario, Acciones
// Los botones llevan data-id y data-action para la delegación en tareasService.js.
//
// CAMBIO: el botón "Eliminar" fue reemplazado por dos botones:
//   - "✏️ Editar tarea"  (data-action="edit")   — abre el modal de edición
//   - "⬇️ Exportar JSON" (data-action="export") — descarga la tarea como .json
// Esto mejora la experiencia del usuario en el panel de usuario, donde la
// eliminación de tareas es responsabilidad exclusiva del administrador.
export function crearFilaTarea(tarea, indice) {
    const fila = document.createElement('tr');
    fila.dataset.id = tarea.id;

    // # correlativo
    const celdaNum = document.createElement('td');
    celdaNum.textContent = indice + 1;

    // Título
    const celdaTitulo = document.createElement('td');
    celdaTitulo.textContent = tarea.title;

    // Descripción
    const celdaDesc = document.createElement('td');
    celdaDesc.textContent = tarea.description || '—';

    // Estado (badge visual)
    const celdaEstado = document.createElement('td');
    const badge = document.createElement('span');
    badge.classList.add('status-badge', `status-${tarea.status}`);
    badge.textContent = formatearEstadoTarea(tarea.status);
    celdaEstado.appendChild(badge);

    // Comentario
    const celdaComentario = document.createElement('td');
    celdaComentario.textContent = tarea.comment || '—';

    // Acciones: Editar tarea y Exportar JSON
    // Se eliminó el botón Eliminar — el usuario no debe poder borrar sus propias tareas
    const celdaAcciones = document.createElement('td');
    const contenedor = document.createElement('div');
    contenedor.classList.add('task-actions');

    // Botón Editar tarea — abre el modal de edición con los datos de esta tarea
    const btnEditar = document.createElement('button');
    btnEditar.textContent    = '✏️ Editar';
    btnEditar.classList.add('btn-action', 'btn-action--edit');
    btnEditar.type           = 'button';
    btnEditar.dataset.id     = tarea.id;
    btnEditar.dataset.action = 'edit';

    // Botón Exportar JSON — descarga esta tarea como archivo .json individual
    const btnExportar = document.createElement('button');
    btnExportar.textContent    = '⬇️ Exportar';
    btnExportar.classList.add('btn-action', 'btn-action--export');
    btnExportar.type           = 'button';
    btnExportar.dataset.id     = tarea.id;
    btnExportar.dataset.action = 'export';

    contenedor.appendChild(btnEditar);
    contenedor.appendChild(btnExportar);
    celdaAcciones.appendChild(contenedor);

    fila.appendChild(celdaNum);
    fila.appendChild(celdaTitulo);
    fila.appendChild(celdaDesc);
    fila.appendChild(celdaEstado);
    fila.appendChild(celdaComentario);
    fila.appendChild(celdaAcciones);

    return fila;
}

export function agregarTareaATabla(tarea, contador) {
    cuerpoDeLaTabla.appendChild(crearFilaTarea(tarea, contador));
    actualizarContadorTareas(contador + 1);
    ocultarEstadoVacio();
    mostrarSeccionTareas();
}

// ── ACTUALIZAR FILA EXISTENTE ─────────────────────────────────────────────────

export function actualizarFilaTarea(tareaActualizada) {
    const fila = cuerpoDeLaTabla.querySelector(`tr[data-id="${tareaActualizada.id}"]`);
    if (!fila) { console.warn(`Fila ${tareaActualizada.id} no encontrada`); return; }

    fila.cells[1].textContent = tareaActualizada.title;
    fila.cells[2].textContent = tareaActualizada.description || '—';

    const badge = fila.cells[3].querySelector('.status-badge');
    // Se eliminan las cuatro clases de estado posibles antes de agregar la nueva
    badge.classList.remove('status-pendiente', 'status-en_progreso', 'status-pendiente_aprobacion', 'status-completada');
    badge.classList.add(`status-${tareaActualizada.status}`);
    badge.textContent = formatearEstadoTarea(tareaActualizada.status);

    fila.cells[4].textContent = tareaActualizada.comment || '—';
}

// ── ELIMINAR FILA ─────────────────────────────────────────────────────────────

export function eliminarFilaTarea(tareaId) {
    const fila = cuerpoDeLaTabla.querySelector(`tr[data-id="${tareaId}"]`);
    if (!fila) { console.warn(`Fila ${tareaId} no encontrada para eliminar`); return; }
    fila.remove();

    const restantes = cuerpoDeLaTabla.querySelectorAll('tr').length;
    actualizarContadorTareas(restantes);
    if (restantes === 0) mostrarEstadoVacio();
}

// ── MODAL DE EDICIÓN ──────────────────────────────────────────────────────────

// Muestra el modal de edición con los datos de la tarea recibida.
// Parámetro soloLecturaTituloDesc (boolean, default false):
//   true  → panel usuario: Título y Descripción quedan como solo lectura
//   false → panel admin:   todos los campos son editables
// Muestra el modal de edición con los datos de la tarea recibida.
// Parámetro soloLecturaTituloDesc (boolean, default false):
//   true  → panel usuario: Título y Descripción quedan como solo lectura,
//            y el select de estado solo muestra las opciones del usuario
//   false → panel admin: todos los campos son editables y el select
//            muestra las tres opciones incluyendo "Completada"
export function mostrarModalEdicion(tarea, soloLecturaTituloDesc = false) {
    // Se cargan los valores actuales de la tarea en los campos del formulario
    document.getElementById('editTaskId').value          = tarea.id;
    document.getElementById('editTaskTitle').value       = tarea.title;
    document.getElementById('editTaskDescription').value = tarea.description || '';
    document.getElementById('editTaskStatus').value      = tarea.status;

    const comentEl = document.getElementById('editTaskComment');
    if (comentEl) comentEl.value = tarea.comment || '';

    const inputTitulo = document.getElementById('editTaskTitle');
    const inputDesc   = document.getElementById('editTaskDescription');
    const selectEstado = document.getElementById('editTaskStatus');

    // Se buscan las opciones que son exclusivas de cada modo
    // opcion-usuario: "Pendiente por aprobar" — visible solo en modo usuario
    // opcion-admin:   "Completada"            — visible solo en modo admin
    const opcionesUsuario = selectEstado.querySelectorAll('.opcion-usuario');
    const opcionesAdmin   = selectEstado.querySelectorAll('.opcion-admin');

    if (soloLecturaTituloDesc) {
        // MODO USUARIO: Título y Descripción son de solo lectura
        // porque editarlos es responsabilidad exclusiva del administrador
        inputTitulo.setAttribute('readonly', true);
        inputDesc.setAttribute('readonly', true);
        inputTitulo.style.opacity = '0.55';
        inputTitulo.style.cursor  = 'not-allowed';
        inputDesc.style.opacity   = '0.55';
        inputDesc.style.cursor    = 'not-allowed';

        // MODO USUARIO: se muestran solo las opciones del usuario (En Progreso y Pendiente por aprobar)
        // Se ocultan las opciones exclusivas del admin (Pendiente y Completada)
        opcionesUsuario.forEach(function(opt) { opt.style.display = ''; });
        opcionesAdmin.forEach(function(opt) { opt.style.display = 'none'; });

        // Si la tarea tiene un estado que no está en el select del usuario,
        // se fuerza a "en_progreso" para que el select no quede en un valor oculto.
        // Los estados "pendiente" y "completada" son exclusivos del admin.
        if (tarea.status === 'pendiente' || tarea.status === 'completada') {
            selectEstado.value = 'en_progreso';
        } else {
            // "en_progreso" y "pendiente_aprobacion" sí están en el select del usuario
            selectEstado.value = tarea.status;
        }
    } else {
        // MODO ADMIN: todos los campos son editables
        inputTitulo.removeAttribute('readonly');
        inputDesc.removeAttribute('readonly');
        inputTitulo.style.opacity = '';
        inputTitulo.style.cursor  = '';
        inputDesc.style.opacity   = '';
        inputDesc.style.cursor    = '';

        // MODO ADMIN: se muestran los cuatro estados completos
        opcionesUsuario.forEach(function(opt) { opt.style.display = ''; });
        opcionesAdmin.forEach(function(opt) { opt.style.display = ''; });

        // Se asigna el estado actual — todos los valores son válidos en modo admin
        selectEstado.value = tarea.status;
    }

    // Se abre el modal eliminando la clase hidden
    document.getElementById('editModal').classList.remove('hidden');
}

export function ocultarModalEdicion() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editTaskTitle').value       = '';
    document.getElementById('editTaskDescription').value = '';
    document.getElementById('editTaskStatus').value      = '';
    document.getElementById('editTaskId').value          = '';

    const comentEl = document.getElementById('editTaskComment');
    if (comentEl) comentEl.value = '';

    // Se limpian los atributos readonly y los estilos al cerrar el modal,
    // para que cuando el admin lo use desde su panel funcione con normalidad
    const inputTitulo = document.getElementById('editTaskTitle');
    const inputDesc   = document.getElementById('editTaskDescription');

    inputTitulo.removeAttribute('readonly');
    inputDesc.removeAttribute('readonly');
    inputTitulo.style.opacity = '';
    inputTitulo.style.cursor  = '';
    inputDesc.style.opacity   = '';
    inputDesc.style.cursor    = '';
}