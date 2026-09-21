// MÓDULO: services/tareasService.js
// CAPA:   Services

// Coordina las operaciones del MODO USUARIO:
// búsqueda de usuario, carga de sus tareas, edición y exportación individual.
// Es el intermediario entre la capa API y la capa UI para este flujo.
//
// CAMBIO: se eliminó la acción 'delete' del panel de usuario.
// Los usuarios no deben poder eliminar sus propias tareas asignadas.
// Se agregó la acción 'export' para exportar una tarea individual como JSON.

import {
    buscarUsuarioPorDocumento,
    obtenerTareasDeUsuario,
    actualizarTarea,
} from '../api/tareasApi.js';

import {
    ocultarDatosUsuario,
    agregarTareaATabla,
    actualizarFilaTarea,
    eliminarFilaTarea,
    mostrarModalEdicion,
    ocultarModalEdicion,
    mostrarEstadoVacio,
    mostrarSeccionTareas,
    ocultarEstadoVacio,
} from '../ui/tareasUI.js';

import {
    validarFormularioBusqueda,
    mostrarError,
    limpiarError,
} from '../utils/validaciones.js';

import {
    mostrarNotificacion,
    mostrarConfirmacion,
} from '../utils/notificaciones.js';

// Se importa exportarTareasJSON para reutilizarlo con una sola tarea
// El mismo utilitario acepta un arreglo, así que se le pasa [tarea]
import { exportarTareasJSON } from '../utils/exportacion.js';

import { filtrarTareas } from '../utils/filtros.js';
import { ordenarTareas } from '../utils/ordenamiento.js';
import { registrarEventosNavegacion, activarModoInicio } from '../ui/modoUI.js';

// ── ESTADO LOCAL (modo usuario) ───────────────────────────────────────────────

let usuarioActual = null;
let tareasRegistradas = [];

// Filtros activos en el modo usuario
let filtroEstadoActivo = '';
let filtroUsuarioActivo = '';
let criterioOrdenActivo = '';

export function establecerTareasRegistradas(tareas) {
    tareasRegistradas = tareas || [];
}

// ── FUNCIONES PRIVADAS ────────────────────────────────────────────────────────

// Reinicia completamente el estado del modo usuario y limpia el DOM.
function reiniciarVistaModoUsuario() {
    usuarioActual = null;
    tareasRegistradas = [];

    ocultarDatosUsuario();

    const seccion = document.getElementById('tasksSection');
    if (seccion) seccion.classList.add('hidden');

    const tbody = document.getElementById('tasksTableBody');
    if (tbody) {
        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    }

    mostrarEstadoVacio();
}

function refrescarTabla() {
    const tareasFiltradas = filtrarTareas(tareasRegistradas, filtroEstadoActivo, filtroUsuarioActivo);
    const tareasOrdenadas = ordenarTareas(tareasFiltradas, criterioOrdenActivo);

    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (tareasOrdenadas.length === 0) {
        mostrarEstadoVacio();
        return;
    }

    ocultarEstadoVacio();
    mostrarSeccionTareas();

    tareasOrdenadas.forEach(function (tarea, indice) {
        agregarTareaATabla(tarea, indice);
    });
}

// ── RF-01: BUSCAR USUARIO POR DOCUMENTO ──────────────────────────────────────

export async function manejarBusquedaUsuario(event) {
    event.preventDefault();

    const inputDocumento = document.getElementById('userDocument');
    const errorDocumento = document.getElementById('userDocumentError');

    // FEAT #57: await requerido porque validarFormularioBusqueda es async
    const esValido = await validarFormularioBusqueda(inputDocumento, errorDocumento);
    if (!esValido) return;

    // Se guarda el valor ANTES de reiniciar porque reiniciarVistaModoUsuario()
    // limpia el input y el valor quedaría vacío al llamar buscarUsuarioPorDocumento
    const documentoABuscar = inputDocumento.value.trim();

    reiniciarVistaModoUsuario();

    const usuario = await buscarUsuarioPorDocumento(documentoABuscar);

    if (!usuario) {
        mostrarError(
            errorDocumento,
            inputDocumento,
            'No se encontró ningún usuario con ese documento'
        );
        return;
    }

    usuarioActual = usuario;

    let tareas = [];
    try {
        tareas = await obtenerTareasDeUsuario(usuario.id);
        tareasRegistradas = tareas;
    } catch (err) {
        console.error('Error cargando tareas del usuario:', err);
        tareas = [];
    }

    mostrarResultadoUsuarioFijo(usuario, tareas);
}

function mostrarResultadoUsuarioFijo(usuario, tareas) {
    // Mostrar sección de datos del usuario
    const seccionDatos = document.getElementById('userDataSection');
    if (seccionDatos) seccionDatos.classList.remove('hidden');

    const spanId = document.getElementById('userId');
    const spanNombre = document.getElementById('userName');
    const spanEmail = document.getElementById('userEmail');

    if (spanId) spanId.textContent = usuario.documento || usuario.id;
    if (spanNombre) spanNombre.textContent = usuario.name;
    if (spanEmail) spanEmail.textContent = usuario.email;

    // Mostrar sección de tareas
    const seccionTareas = document.getElementById('tasksSection');
    if (seccionTareas) seccionTareas.classList.remove('hidden');

    const contadorEl = document.getElementById('tasksCount');
    if (contadorEl) {
        contadorEl.textContent = `${tareas.length} ${tareas.length === 1 ? 'tarea' : 'tareas'}`;
    }

    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (tareas.length === 0) {
        mostrarEstadoVacio();
        return;
    }

    const estadoVacio = document.getElementById('tasksEmptyState');
    if (estadoVacio) estadoVacio.classList.add('hidden');

    tareas.forEach(function (tarea, indice) {
        agregarTareaATabla(tarea, indice);
    });
}

// ── RF-03: EDITAR TAREA ───────────────────────────────────────────────────────

export function manejarEdicionTarea(tarea) {
    // Se pasa true para que Título y Descripción sean de solo lectura en el panel usuario
    mostrarModalEdicion(tarea, true);

    const formulario = document.getElementById('editTaskForm');
    if (!formulario) return;

    formulario.onsubmit = async function (event) {
        event.preventDefault();

        const titulo = document.getElementById('editTaskTitle').value.trim();
        const descripcion = document.getElementById('editTaskDescription').value.trim();
        const estado = document.getElementById('editTaskStatus').value;
        const tareaId = document.getElementById('editTaskId').value;
        const comentEl = document.getElementById('editTaskComment');
        const comentario = comentEl ? comentEl.value.trim() : '';

        const idsUsuarios = Array.isArray(tarea.assignedUsers)
            ? tarea.assignedUsers.map(u => typeof u === 'object' ? (u.id !== undefined ? u.id : u._id) : u)
            : [];

        const datosActualizados = {
            title: titulo || tarea.title,
            description: descripcion,
            status: estado,
            comment: comentario,
            assignedUsers: idsUsuarios
        };

        const btnSubmit = formulario.querySelector('button[type="submit"]');
        const textoOriginal = btnSubmit ? btnSubmit.textContent : 'Guardar';
        if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.textContent = 'Guardando...'; }

        try {
            const tareaActualizada = await actualizarTarea(tareaId, datosActualizados);

            if (tareaActualizada) {
                const idBuscado = (tarea.id !== undefined && tarea.id !== null) ? tarea.id : tarea._id;
                const indice = tareasRegistradas.findIndex(
                    t => String(t.id !== undefined && t.id !== null ? t.id : t._id) === String(idBuscado)
                );

                if (indice !== -1) {
                    tareasRegistradas[indice] = {
                        ...tareasRegistradas[indice],
                        ...tareaActualizada,
                        status: estado,
                        comment: comentario,
                    };
                }

                refrescarTabla();
                ocultarModalEdicion();
                await mostrarNotificacion('Tarea actualizada exitosamente', 'exito');
            }
        } catch (error) {
            console.error('Error al actualizar tarea:', error);
            await mostrarNotificacion(error.message || 'Error al actualizar la tarea', 'error');
        } finally {
            if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.textContent = textoOriginal; }
        }
    };
}

// ── RF-04: EXPORTAR TAREA INDIVIDUAL COMO JSON ───────────────────────────────

// Descarga una sola tarea como archivo .json con nombre basado en su título.
// Se reutiliza exportarTareasJSON pasando un arreglo de un elemento.
// Parámetro: tarea — el objeto de la tarea a exportar
export async function manejarExportacionTarea(tarea) {

    // Se exporta la tarea envuelta en un arreglo para reutilizar el utilitario
    const exportado = exportarTareasJSON([tarea]);

    if (exportado) {
        await mostrarNotificacion(`Tarea "${tarea.title}" exportada correctamente`, 'exito');
    } else {
        await mostrarNotificacion('Error al exportar la tarea', 'error');
    }
}

// ── DELEGACIÓN DE EVENTOS EN LA TABLA ────────────────────────────────────────

// Manejador delegado: escucha todos los clics del tbody y despacha según data-action.
function manejarClicEnTabla(event) {
    const botonAccion = event.target.closest('[data-action]');
    if (!botonAccion) return;

    const tareaId = botonAccion.dataset.id;
    const accion = botonAccion.dataset.action;

    if (!tareaId || tareaId === 'undefined') return;

    const tarea = tareasRegistradas.find(t => {
        const id = (t.id !== undefined && t.id !== null) ? t.id : t._id;
        return String(id) === String(tareaId);
    });

    if (!tarea) {
        console.warn(`Tarea con ID ${tareaId} no encontrada en el arreglo local`);
        return;
    }

    // Editar: abre el modal con los datos actuales de la tarea
    if (accion === 'edit') manejarEdicionTarea(tarea);

    // Exportar: descarga esta tarea individual como archivo .json
    if (accion === 'export') manejarExportacionTarea(tarea);
}

// ── REGISTRO DE LISTENERS (llamado desde main.js) ─────────────────────────────

// Filtra en tiempo real las filas de #tasksTableBody según el texto del buscador.
// Opera sobre los datos en memoria (tareasRegistradas) sin recargar ni hacer fetch.
function filtrarTablaEnTiempoReal(termino) {
    const t = termino.trim().toLowerCase();
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;

    // Si no hay término, mostrar todas las tareas cargadas
    if (!t) {
        refrescarTabla();
        return;
    }

    // Filtrar sobre tareasRegistradas directamente en el DOM
    const tareasFiltradas = tareasRegistradas.filter(function (tarea) {
        return (
            String(tarea.id).includes(t) ||
            (tarea.title && tarea.title.toLowerCase().includes(t)) ||
            (tarea.status && tarea.status.toLowerCase().includes(t)) ||
            (tarea.description && tarea.description.toLowerCase().includes(t))
        );
    });

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (tareasFiltradas.length === 0) {
        mostrarEstadoVacio();
        return;
    }

    ocultarEstadoVacio();
    mostrarSeccionTareas();
    tareasFiltradas.forEach(function (tarea, indice) {
        agregarTareaATabla(tarea, indice);
    });
}

export function registrarEventListeners() {

    // Filtra las tareas cargadas al cambiar el estado seleccionado.
    const filtroEstadoUsuario = document.getElementById('filtroEstadoUsuario');
    if (filtroEstadoUsuario) {
        filtroEstadoUsuario.addEventListener('change', function () {
            filtroEstadoActivo = filtroEstadoUsuario.value;
            refrescarTabla();
        });
    }

    // ── Buscador de tareas del panel usuario (lupa) ──────────────────────────
    // Previene el submit nativo (que recargaría la página y cerraría la sesión).
    // Filtra en tiempo real las filas ya renderizadas en #tasksTableBody.
    const formBusquedaTareas = document.getElementById('userSearchTaskForm');
    const inputBusquedaTareas = document.getElementById('userSearchTaskInput');
    if (formBusquedaTareas && inputBusquedaTareas) {
        // Bloquear submit (botón lupa) para que no recargue la página
        formBusquedaTareas.addEventListener('submit', function (e) {
            e.preventDefault();
            filtrarTablaEnTiempoReal(inputBusquedaTareas.value);
        });
        // Filtrado en tiempo real al escribir
        inputBusquedaTareas.addEventListener('input', function () {
            filtrarTablaEnTiempoReal(inputBusquedaTareas.value);
        });
    }

    // Delegación de clicks en tabla de tareas del modo usuario
    const tbody = document.getElementById('tasksTableBody');
    if (tbody) {
        tbody.addEventListener('click', manejarClicEnTabla);
    }

    // Botones del modal de edición
    const btnCerrarModal = document.getElementById('editCloseBtn');
    if (btnCerrarModal) btnCerrarModal.addEventListener('click', ocultarModalEdicion);

    const btnCancelarModal = document.getElementById('editCancelBtn');
    if (btnCancelarModal) btnCancelarModal.addEventListener('click', ocultarModalEdicion);

    // Todos los eventos de navegación y del panel admin
    registrarEventosNavegacion();
}