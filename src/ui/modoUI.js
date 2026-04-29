// MÓDULO: ui/modoUI.js
// CAPA:   UI

// Responsabilidad: gestionar qué vista está activa (inicio, usuario, admin),
// el modal dinámico de usuario del panel admin, filtros y ordenamiento.
//
// Toda petición HTTP pasa por los módulos de api/.
// Toda notificación pasa por notificaciones.js.

import {
    obtenerTodasLasTareas,
    obtenerTareasDeUsuario,
    eliminarTarea,
    registrarTarea,
    obtenerDashboard,
    actualizarTarea,
} from '../api/tareasApi.js';

import {
    obtenerTodosLosUsuarios,
    eliminarUsuario,
    actualizarUsuario,
    cambiarRolUsuario,          // ← nueva función
    cambiarPassword,
} from '../api/usuariosApi.js';

import {
    mostrarNotificacion,
    mostrarConfirmacion,
} from '../utils/notificaciones.js';

import { filtrarTareas }  from '../utils/filtros.js';

import { mostrarModalEdicion, ocultarModalEdicion, agregarTareaATabla } from './tareasUI.js';

import { ordenarTareas }  from '../utils/ordenamiento.js';

import { exportarTareasJSON } from '../utils/exportacion.js';

// Se agrega validarFormularioRegistro a los imports de validaciones
// Este import conecta modoUI.js con la nueva función que valida los 5 campos del modal
import { validarFormularioUsuario, validarFormularioTarea, validarFormularioLogin, validarFormularioRegistro } from '../utils/validaciones.js';

// Agregar junto a los otros imports al inicio de modoUI.js:
import { loginUsuario, registrarUsuario, forgotPassword, verifyResetCode, resetPassword } from '../api/authApi.js';

import { guardarSesion, cerrarSesion, obtenerUsuarioSesion } from '../utils/sesion.js';

// ── REFERENCIAS A VISTAS ──────────────────────────────────────────────────────

const pantallaInicio = document.getElementById('pantallaInicio');
const vistaUsuario   = document.getElementById('vistaUsuario');
const vistaAdmin     = document.getElementById('vistaAdmin');
// Busca donde están definidas vistaAdmin, vistaUsuario, pantallaInicio y agrega:
const vistaInstructor = document.getElementById('vistaInstructor');

// Oculta todas las vistas del sistema antes de mostrar la activa
// IMPORTANTE: incluir vistaInstructor en esta función es crítico
// Sin esta línea, al cerrar sesión el instructor la página quedaba visualmente rota
// porque vistaInstructor permanecía visible detrás de la pantalla de inicio
function ocultarTodo() {
    // Ocultar la pantalla de inicio (formulario de login)
    pantallaInicio.classList.add('hidden');
    // Ocultar la vista del panel de usuario normal
    vistaUsuario.classList.add('hidden');
    // Ocultar la vista del panel de administrador
    vistaAdmin.classList.add('hidden');
    // Ocultar la vista del panel instructor — faltaba esta línea
    // Su ausencia causaba que el panel verde quedara visible al cerrar sesión
    if (vistaInstructor) vistaInstructor.classList.add('hidden');
}

export function activarModoInicio() {
    ocultarTodo();
    pantallaInicio.classList.remove('hidden');
    document.body.dataset.modo = 'inicio';
    // Limpiar los campos del formulario para no exponer datos del usuario anterior
    // Esto es especialmente importante en computadores compartidos
    limpiarFormularioLogin();
}

// ── ACTIVAR MODO USUARIO (ACTUALIZADO) ────────────────────────────────────────
// Al entrar al panel de usuario ya no se muestra el formulario de búsqueda.
// En su lugar se leen los datos del usuario directamente desde el token JWT
// guardado en localStorage y se cargan sus tareas automáticamente.
//
// Esto es más seguro y profesional: el usuario no puede buscar las tareas
// de otra persona escribiendo un documento diferente.
export async function activarModoUsuario() {
    ocultarTodo();
    vistaUsuario.classList.remove('hidden');
    document.body.dataset.modo = 'usuario';

    // Leer los datos del usuario desde el token guardado en localStorage
    // obtenerUsuarioSesion() viene de src/utils/sesion.js y parsea el JSON del localStorage
    const usuarioSesion = obtenerUsuarioSesion();

    // Si no hay sesión activa (el token expiró o fue borrado) redirigir al login
    if (!usuarioSesion) {
        activarModoInicio();
        return;
    }

    // Mostrar los datos del usuario en la sección de datos
    // Estos datos vienen del payload del token, no de una petición al servidor
    const seccionDatos = document.getElementById('userDataSection');
    if (seccionDatos) seccionDatos.classList.remove('hidden');

    const spanId     = document.getElementById('userId');
    const spanNombre = document.getElementById('userName');
    const spanEmail  = document.getElementById('userEmail');

    // usuarioSesion.documento es el número de cédula guardado en el token JWT
    if (spanId)     spanId.textContent     = usuarioSesion.documento || usuarioSesion.id;
    if (spanNombre) spanNombre.textContent = usuarioSesion.name;
    // El email viene de obtenerUsuarioSesion pero el campo depende de qué guardó guardarSesion
    // Si el email no está en el token, se muestra el documento
    if (spanEmail)  spanEmail.textContent  = usuarioSesion.email || '—';

    // Cargar automáticamente las tareas del usuario usando su id del token
    // obtenerTareasDeUsuario hace GET /api/tasks/filter?userId={id}
    const tareas = await obtenerTareasDeUsuario(usuarioSesion.id);

    // Mostrar la sección de tareas
    const seccionTareas = document.getElementById('tasksSection');
    if (seccionTareas) seccionTareas.classList.remove('hidden');

    // Actualizar el contador de tareas
    const contadorEl = document.getElementById('tasksCount');
    if (contadorEl) {
        const cantidad = tareas ? tareas.length : 0;
        contadorEl.textContent = `${cantidad} ${cantidad === 1 ? 'tarea' : 'tareas'}`;
    }

    // Pintar las tareas en la tabla
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (!tareas || tareas.length === 0) {
        // Mostrar estado vacío si no hay tareas asignadas
        const estadoVacio = document.getElementById('tasksEmptyState');
        if (estadoVacio) estadoVacio.classList.remove('hidden');
        return;
    }

    // Ocultar el estado vacío y pintar cada tarea
    const estadoVacio = document.getElementById('tasksEmptyState');
    if (estadoVacio) estadoVacio.classList.add('hidden');

    tareas.forEach(function(tarea, indice) {
        // agregarTareaATabla viene de tareasUI.js y construye la fila con createElement
        agregarTareaATabla(tarea, indice);
    });

    // Cargar el dashboard de estadísticas del panel usuario.
    // Se llama con los IDs del vistaUsuario (prefijo userDash) para no
    // sobreescribir los valores del dashboard del panel admin.
    cargarDashboardUsuario();   // ← AGREGAR ESTA LÍNEA
}

export async function activarModoAdmin() {
    ocultarTodo();
    vistaAdmin.classList.remove('hidden');
    document.body.dataset.modo = 'admin';
    // Carga inicial en paralelo: no bloqueamos la UI
    cargarDashboard();
    cargarTablaUsuarios();
    cargarTodasLasTareas();
    // Se inicializa el dropdown de usuarios de la card "Crear Tarea"
    // await garantiza que los checkboxes están cargados antes de continuar
    await inicializarDropdownUsuarios();
}

// ── ACTIVAR MODO INSTRUCTOR ───────────────────────────────────────────────────
// Activa el panel de docente con paleta verde pastel.
// El instructor tiene CRUD completo de tareas pero no puede gestionar usuarios.
// Se llama desde main.js cuando role === 'instructor'.
export async function activarModoInstructor() {
    ocultarTodo();
    vistaInstructor.classList.remove('hidden');
    document.body.dataset.modo = 'instructor';

    // Cargar datos en paralelo: no bloqueamos la UI mientras carga
    cargarDashboardInstructor();
    cargarTablaUsuariosInstructor();
    cargarTareasInstructor();
    // Inicializar el dropdown de usuarios para la card "Crear Tarea" del instructor
    await inicializarDropdownInstructor();
}

// cargarDashboardInstructor — actualiza las tarjetas de estadísticas del panel instructor.
// Usa los IDs con prefijo "instrDash" definidos en el vistaInstructor del index.html.
async function cargarDashboardInstructor() {
    const data = await obtenerDashboard();
    if (!data) return;

    const el = {
        total:      document.getElementById('instrDashTotal'),
        pendiente:  document.getElementById('instrDashPendiente'),
        progreso:   document.getElementById('instrDashProgreso'),
        aprobacion: document.getElementById('instrDashAprobacion'),
        completada: document.getElementById('instrDashCompletada'),
    };

    if (el.total)      el.total.textContent      = data.total;
    if (el.pendiente)  el.pendiente.textContent   = data.pendientes;
    if (el.progreso)   el.progreso.textContent    = data.enProgreso;
    if (el.aprobacion) el.aprobacion.textContent  = data.aprobacion ?? 0;
    if (el.completada) el.completada.textContent  = data.completadas;
}

// cargarTablaUsuariosInstructor — llena la tabla de usuarios del panel instructor.
// DIFERENCIA con cargarTablaUsuarios (admin): aquí los botones de acción son
// SOLO "Ver / Asignar" — sin Editar, sin Cambiar Rol, sin Eliminar.
async function cargarTablaUsuariosInstructor() {
    const tbody = document.getElementById('instrUsersTableBody');
    if (!tbody) return;

    // Limpiar el tbody antes de rellenarlo para evitar duplicados
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    const usuarios = await obtenerTodosLosUsuarios();
    if (!usuarios) return;

    // Actualizar el contador de usuarios en el header de la card
    const contador = document.getElementById('instrUsersCount');
    if (contador) {
        const cantidad = usuarios.length;
        contador.textContent = `${cantidad} ${cantidad === 1 ? 'usuario' : 'usuarios'}`;
    }

    usuarios.forEach(function(usuario, indice) {
        const fila = document.createElement('tr');

        const celdaNum = document.createElement('td');
        celdaNum.textContent = indice + 1;

        const celdaDoc = document.createElement('td');
        celdaDoc.textContent = usuario.documento;

        const celdaNombre = document.createElement('td');
        celdaNombre.textContent = usuario.name;

        const celdaEmail = document.createElement('td');
        celdaEmail.textContent = usuario.email;

        const celdaAcciones = document.createElement('td');
        const contenedor    = document.createElement('div');
        contenedor.classList.add('task-actions');

        // ÚNICO botón del instructor: "Ver / Asignar" — abre el modal de tareas del usuario
        // NO se crean botones de Editar, Cambiar Rol ni Eliminar
        const btnVer = document.createElement('button');
        btnVer.textContent = 'Ver / Asignar';
        btnVer.classList.add('btn-action', 'btn-action--edit');
        btnVer.type = 'button';
        // abrirModalUsuario viene de modoUI.js — permite ver y asignar tareas al usuario
        btnVer.addEventListener('click', function() { abrirModalUsuario(usuario); });

        contenedor.appendChild(btnVer);
        celdaAcciones.appendChild(contenedor);

        fila.appendChild(celdaNum);
        fila.appendChild(celdaDoc);
        fila.appendChild(celdaNombre);
        fila.appendChild(celdaEmail);
        fila.appendChild(celdaAcciones);

        tbody.appendChild(fila);
    });
}

// cargarTareasInstructor — llena la tabla de tareas del panel instructor.
// Es equivalente a cargarTodasLasTareas del admin pero usa los IDs del instructor.
async function cargarTareasInstructor() {
    const tbody = document.getElementById('instrTasksTableBody');
    if (!tbody) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    const tareas = await obtenerTodasLasTareas();
    if (!tareas) return;

    const contador = document.getElementById('instrTasksCount');
    if (contador) {
        const cantidad = tareas.length;
        contador.textContent = `${cantidad} ${cantidad === 1 ? 'tarea' : 'tareas'}`;
    }

    // Reusar la función agregarFilaTareaAdmin si existe, o construir las filas manualmente
    // siguiendo el mismo patrón que cargarTodasLasTareas del panel admin
    tareas.forEach(function(tarea, indice) {
        const fila = crearFilaTareaInstructor(tarea, indice);
        tbody.appendChild(fila);
    });
}

// crearFilaTareaInstructor — construye una fila de la tabla de tareas del instructor.
// El instructor puede Editar y Eliminar tareas (CRUD completo).
// Sigue el mismo patrón de crearFilaTareaAdmin.
function crearFilaTareaInstructor(tarea, indice) {
    const fila = document.createElement('tr');

    const celdaNum = document.createElement('td');
    celdaNum.textContent = indice + 1;

    const celdaTitulo = document.createElement('td');
    celdaTitulo.textContent = tarea.title;

    const celdaDesc = document.createElement('td');
    celdaDesc.textContent = tarea.description || '—';

    const celdaEstado = document.createElement('td');
    // Reutilizar la misma función de formato de estado que el panel admin
    const badgeEstado = document.createElement('span');
    badgeEstado.classList.add('status-badge', `status-badge--${tarea.status}`);
    badgeEstado.textContent = tarea.status.replace(/_/g, ' ');
    celdaEstado.appendChild(badgeEstado);

    const celdaUsuario = document.createElement('td');
    celdaUsuario.textContent = tarea.assignedUsersDisplay || '—';

    const celdaAcciones = document.createElement('td');
    const contenedor    = document.createElement('div');
    contenedor.classList.add('task-actions');

    // Botón Editar — abre el modal de edición de tarea (el mismo del admin)
    const btnEditar = document.createElement('button');
    btnEditar.textContent = '✏️ Editar';
    btnEditar.classList.add('btn-action', 'btn-action--edit');
    btnEditar.type = 'button';
    btnEditar.addEventListener('click', function() {
        // abrirModalEditarTarea usa el modal existente id="editModal" del index.html
        abrirModalEditarTarea(tarea);
    });

    // Botón Eliminar — pide confirmación antes de eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = '🗑️ Eliminar';
    btnEliminar.classList.add('btn-action', 'btn-action--delete');
    btnEliminar.type = 'button';
    btnEliminar.addEventListener('click', async function() {
        const confirmado = await mostrarConfirmacion(
            '¿Eliminar tarea?',
            `"${tarea.title}" será eliminada permanentemente.`,
            'Sí, eliminar'
        );
        if (!confirmado) return;

        const eliminado = await eliminarTarea(tarea.id);
        if (eliminado) {
            await mostrarNotificacion('Tarea eliminada correctamente', 'exito');
            // Recargar el instructor panel tras la eliminación
            cargarTareasInstructor();
            cargarDashboardInstructor();
        } else {
            await mostrarNotificacion('Error al eliminar la tarea', 'error');
        }
    });

    contenedor.appendChild(btnEditar);
    contenedor.appendChild(btnEliminar);
    celdaAcciones.appendChild(contenedor);

    fila.appendChild(celdaNum);
    fila.appendChild(celdaTitulo);
    fila.appendChild(celdaDesc);
    fila.appendChild(celdaEstado);
    fila.appendChild(celdaUsuario);
    fila.appendChild(celdaAcciones);

    return fila;
}

// inicializarDropdownInstructor — carga los usuarios en el dropdown de la card Crear Tarea del instructor.
// Usa los IDs instrUsuariosDropdown*, distintos a los del admin para coexistir en el DOM.
async function inicializarDropdownInstructor() {
    const panel = document.getElementById('instrUsuariosDropdownPanel');
    const btn   = document.getElementById('instrUsuariosDropdownBtn');
    const texto = document.getElementById('instrUsuariosDropdownTexto');
    if (!panel || !btn) return;

    const usuarios = await obtenerTodosLosUsuarios();
    if (!usuarios) return;

    // Limpiar el panel antes de rellenarlo
    while (panel.firstChild) panel.removeChild(panel.firstChild);

    // Crear un checkbox por cada usuario
    usuarios.forEach(function(usuario) {
        const label = document.createElement('label');
        label.classList.add('usuarios-dropdown__opcion');

        const checkbox = document.createElement('input');
        checkbox.type  = 'checkbox';
        checkbox.value = String(usuario.id);
        checkbox.classList.add('usuarios-dropdown__checkbox');

        const spanNombre = document.createElement('span');
        spanNombre.textContent = `${usuario.name} (${usuario.documento})`;

        label.appendChild(checkbox);
        label.appendChild(spanNombre);
        panel.appendChild(label);
    });

    // Abrir/cerrar el panel al hacer clic en el botón
    btn.addEventListener('click', function() {
        const estaAbierto = !panel.classList.contains('hidden');
        if (estaAbierto) {
            panel.classList.add('hidden');
            btn.setAttribute('aria-expanded', 'false');
        } else {
            panel.classList.remove('hidden');
            btn.setAttribute('aria-expanded', 'true');
        }
    });

    // Actualizar el texto del botón según los usuarios seleccionados
    panel.addEventListener('change', function() {
        const seleccionados = Array.from(panel.querySelectorAll('input:checked'));
        texto.textContent = seleccionados.length === 0
            ? 'Seleccionar usuarios...'
            : seleccionados.map(cb => cb.nextSibling.textContent).join(', ');
    });
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

// Carga las estadísticas del dashboard desde el backend y las muestra en pantalla.
// GET /api/tasks/dashboard → { total, pendientes, enProgreso, aprobacion, completadas }
// ACTUALIZACIÓN v3.4.0: se agrega el elemento dashboardAprobacion para pendiente_aprobacion.
async function cargarDashboard() {
    const data = await obtenerDashboard();
    if (!data) return;

    // Se mapean los ids del DOM con las propiedades de la respuesta del backend
    const el = {
        total:      document.getElementById('dashboardTotal'),
        pendiente:  document.getElementById('dashboardPendiente'),
        progreso:   document.getElementById('dashboardProgreso'),
        // Nuevo elemento del dashboard para el cuarto estado del sistema
        aprobacion: document.getElementById('dashboardAprobacion'),
        completada: document.getElementById('dashboardCompletada'),
    };

    if (el.total)      el.total.textContent      = data.total;
    if (el.pendiente)  el.pendiente.textContent   = data.pendientes;
    if (el.progreso)   el.progreso.textContent    = data.enProgreso;
    // data.aprobacion viene del controlador getDashboard() del backend
    if (el.aprobacion) el.aprobacion.textContent  = data.aprobacion ?? 0;
    if (el.completada) el.completada.textContent  = data.completadas;
}

// ── TABLA USUARIOS ────────────────────────────────────────────────────────────

export async function cargarTablaUsuarios() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const usuarios = await obtenerTodosLosUsuarios();

    if (!usuarios) {
        await mostrarNotificacion('Error al cargar los usuarios', 'error');
        return;
    }
    // Dentro de cargarTablaUsuarios, después de obtener los usuarios y antes de vaciar el tbody
    // Se actualiza el contador de usuarios con el mismo formato que el contador de tareas
    const contadorUsuariosEl = document.getElementById('adminUsersCount');
    if (contadorUsuariosEl) {
        const cantidad = usuarios ? usuarios.length : 0;
        // Texto con singular o plural según la cantidad
        contadorUsuariosEl.textContent = `${cantidad} ${cantidad === 1 ? 'usuario' : 'usuarios'}`;
    }

    // Vaciar tbody con removeChild para respetar la regla del proyecto
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (usuarios.length === 0) {
        const fila = document.createElement('tr');
        const td   = document.createElement('td');
        td.colSpan        = 5;
        td.textContent    = 'No hay usuarios registrados';
        td.style.textAlign = 'center';
        td.style.color    = '#9ca3af';
        fila.appendChild(td);
        tbody.appendChild(fila);
        return;
    }

    usuarios.forEach(function(usuario, indice) {
        tbody.appendChild(crearFilaUsuario(usuario, indice));
    });
}

// Construye una fila de la tabla de usuarios del panel admin
// Ahora incluye tres botones: Ver/Asignar, Editar y Eliminar
// Parámetros:
//   usuario — objeto del usuario a representar
//   indice  — posición en la lista (para el # correlativo)
function crearFilaUsuario(usuario, indice) {
    const fila = document.createElement('tr');

    const celdaNum = document.createElement('td');
    celdaNum.textContent = indice + 1;

    const celdaDoc = document.createElement('td');
    celdaDoc.textContent = usuario.documento || usuario.id;

    const celdaNombre = document.createElement('td');
    celdaNombre.textContent = usuario.name;

    const celdaEmail = document.createElement('td');
    celdaEmail.textContent = usuario.email;

    const celdaAcciones = document.createElement('td');
    const contenedor    = document.createElement('div');
    contenedor.classList.add('task-actions');

    // Botón Ver / Asignar — abre el modal de tareas del usuario
    const btnVer = document.createElement('button');
    btnVer.textContent = 'Ver / Asignar';
    btnVer.classList.add('btn-action', 'btn-action--edit');
    btnVer.type = 'button';
    btnVer.addEventListener('click', function() { abrirModalUsuario(usuario); });

    // NUEVO: Botón Editar — abre el modal de edición de datos del usuario
    // Sigue el mismo patrón de los demás botones de acción del proyecto
    const btnEditar = document.createElement('button');
    btnEditar.textContent = '✏️ Editar';
    btnEditar.classList.add('btn-action', 'btn-action--edit');
    btnEditar.type = 'button';
    btnEditar.addEventListener('click', function() { abrirModalEditarUsuario(usuario); });

    // Botón/select para cambiar el rol — ahora soporta 3 opciones: admin, user, instructor
    // Se usa un select para facilitar la elección entre 3 roles
    const selectRol = document.createElement('select');
    selectRol.classList.add('btn-action', 'btn-action--rol');
    selectRol.title = 'Cambiar rol del usuario';

    // Opción por defecto que muestra el rol actual (no se puede seleccionar)
    const optDefault = document.createElement('option');
    optDefault.value    = '';
    optDefault.disabled = true;
    optDefault.selected = true;
    const etiquetasRol = { admin: '👑 Admin', user: '👤 User', instructor: '📚 Instructor' };
    optDefault.textContent = etiquetasRol[usuario.role] || usuario.role;
    selectRol.appendChild(optDefault);

    // Opciones de los otros roles (excluyendo el rol actual del usuario)
    const todosLosRoles = [
        { value: 'admin',      label: '👑 Hacer Admin' },
        { value: 'user',       label: '👤 Hacer User' },
        { value: 'instructor', label: '📚 Hacer Instructor' },
    ];

    todosLosRoles.forEach(function(rolOpcion) {
        // No mostrar el rol que el usuario ya tiene
        if (rolOpcion.value === usuario.role) return;
        const opt = document.createElement('option');
        opt.value       = rolOpcion.value;
        opt.textContent = rolOpcion.label;
        selectRol.appendChild(opt);
    });

    // Al cambiar la selección, confirmar y ejecutar el cambio de rol
    selectRol.addEventListener('change', async function() {
        const nuevoRol    = selectRol.value;
        if (!nuevoRol) return;
        const etiquetaRol = etiquetasRol[nuevoRol] || nuevoRol;

        const confirmado = await mostrarConfirmacion(
            `¿Cambiar rol de ${usuario.name}?`,
            `El usuario pasará a ser ${etiquetaRol}. Tendrá efecto en su próximo inicio de sesión.`,
            `Sí, hacer ${etiquetaRol}`
        );

        if (!confirmado) {
            // Revertir el select si el usuario cancela
            selectRol.value = '';
            return;
        }

        const usuarioActualizado = await cambiarRolUsuario(usuario.id, nuevoRol);
        if (usuarioActualizado) {
            await mostrarNotificacion(`Rol de ${usuario.name} actualizado a ${etiquetaRol}`, 'exito');
            cargarTablaUsuarios();
        } else {
            await mostrarNotificacion('Error al cambiar el rol del usuario', 'error');
            selectRol.value = '';
        }
    });

    contenedor.appendChild(selectRol);

    // Botón Eliminar — pide confirmación antes de eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = '🗑️ Eliminar';
    btnEliminar.classList.add('btn-action', 'btn-action--delete');
    btnEliminar.type = 'button';
    btnEliminar.addEventListener('click', async function() {
        const confirmado = await mostrarConfirmacion(
            '¿Eliminar usuario?',
            `"${usuario.name}" será eliminado permanentemente.`,
            'Sí, eliminar'
        );
        if (!confirmado) return;

        const eliminado = await eliminarUsuario(usuario.id);
        if (eliminado) {
            await mostrarNotificacion('Usuario eliminado correctamente', 'exito');
            cargarTablaUsuarios();
            cargarTodasLasTareas();
            cargarDashboard();
        } else {
            await mostrarNotificacion('Error al eliminar el usuario', 'error');
        }
    });

    // Se agregan los tres botones al contenedor de acciones
    contenedor.appendChild(btnVer);
    contenedor.appendChild(btnEditar);
    contenedor.appendChild(btnEliminar);
    celdaAcciones.appendChild(contenedor);

    fila.appendChild(celdaNum);
    fila.appendChild(celdaDoc);
    fila.appendChild(celdaNombre);
    fila.appendChild(celdaEmail);
    fila.appendChild(celdaAcciones);

    return fila;
}

// ── MODAL EDITAR USUARIO ──────────────────────────────────────────────────────

// Abre un modal dinámico para editar los datos de un usuario (nombre, correo, documento)
// Sigue la misma lógica de construcción que abrirModalUsuario: createElement + appendChild
// Parámetro: usuario — objeto con los datos actuales del usuario a editar
async function abrirModalEditarUsuario(usuario) {

    // Se cierra cualquier modal de edición de usuario que ya esté abierto
    cerrarModalEditarUsuarioExistente();

    // Overlay oscuro que cubre toda la pantalla
    const overlay = document.createElement('div');
    overlay.className = 'modal-usuario-overlay';
    overlay.id        = 'modalEditarUsuarioOverlay';

    // Contenedor del modal
    const modal = document.createElement('div');
    modal.className = 'modal-usuario';

    // ── Header del modal ──────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'modal-usuario__header';

    const infoTexto = document.createElement('div');

    // Título con el nombre actual del usuario
    const titulo = document.createElement('h2');
    titulo.className   = 'modal-usuario__titulo';
    titulo.textContent = `Editar: ${usuario.name}`;

    const subtitulo = document.createElement('p');
    subtitulo.className   = 'modal-usuario__subtitulo';
    subtitulo.textContent = `Documento actual: ${usuario.documento || usuario.id}`;

    infoTexto.appendChild(titulo);
    infoTexto.appendChild(subtitulo);

    // Botón de cierre en la esquina del header
    const btnCerrar = document.createElement('button');
    btnCerrar.className   = 'modal-usuario__cerrar';
    btnCerrar.type        = 'button';
    btnCerrar.textContent = '✕';
    btnCerrar.addEventListener('click', cerrarModalEditarUsuarioExistente);

    header.appendChild(infoTexto);
    header.appendChild(btnCerrar);
    modal.appendChild(header);

    // ── Cuerpo: formulario de edición ─────────────────────────────────────────
    const cuerpo = document.createElement('div');
    cuerpo.className = 'modal-usuario__asignar';

    const formEditar = document.createElement('form');
    formEditar.className = 'form';

    // GRUPO DOCUMENTO
    const grupoDoc = document.createElement('div');
    grupoDoc.className = 'form__group';
    const labelDoc = document.createElement('label');
    labelDoc.setAttribute('for', 'editar-usuario-documento');
    labelDoc.className   = 'form__label';
    labelDoc.textContent = 'Número de documento';
    const inputDoc = document.createElement('input');
    inputDoc.type        = 'text';
    inputDoc.id          = 'editar-usuario-documento';
    inputDoc.className   = 'form__input';
    inputDoc.placeholder = 'Ej: 1097497124';
    // Se pre-rellena con el valor actual del usuario
    inputDoc.value       = usuario.documento || '';
    grupoDoc.appendChild(labelDoc);
    grupoDoc.appendChild(inputDoc);

    // GRUPO NOMBRE
    const grupoNombre = document.createElement('div');
    grupoNombre.className = 'form__group';
    const labelNombre = document.createElement('label');
    labelNombre.setAttribute('for', 'editar-usuario-nombre');
    labelNombre.className   = 'form__label';
    labelNombre.textContent = 'Nombre completo';
    const inputNombre = document.createElement('input');
    inputNombre.type        = 'text';
    inputNombre.id          = 'editar-usuario-nombre';
    inputNombre.className   = 'form__input';
    inputNombre.placeholder = 'Ej: Karol Torres';
    // Se pre-rellena con el valor actual del usuario
    inputNombre.value       = usuario.name || '';
    grupoNombre.appendChild(labelNombre);
    grupoNombre.appendChild(inputNombre);

    // GRUPO EMAIL
    const grupoEmail = document.createElement('div');
    grupoEmail.className = 'form__group';
    const labelEmail = document.createElement('label');
    labelEmail.setAttribute('for', 'editar-usuario-email');
    labelEmail.className   = 'form__label';
    labelEmail.textContent = 'Correo electrónico';
    const inputEmail = document.createElement('input');
    // FEAT #57: type="text" en lugar de "email" para evitar el tooltip nativo del browser.
    // La validación de formato se hace manualmente en validarFormularioUsuario().
    inputEmail.type        = 'text';
    inputEmail.id          = 'editar-usuario-email';
    inputEmail.className   = 'form__input';
    inputEmail.placeholder = 'Ej: usuario@correo.com';
    // Se pre-rellena con el valor actual del usuario
    inputEmail.value       = usuario.email || '';
    grupoEmail.appendChild(labelEmail);
    grupoEmail.appendChild(inputEmail);

    // Botón de submit del formulario de edición
    const btnGuardar = document.createElement('button');
    btnGuardar.type      = 'submit';
    btnGuardar.className = 'btn btn--admin-primary';
    const spanBtn = document.createElement('span');
    spanBtn.className   = 'btn__text';
    spanBtn.textContent = 'Guardar Cambios';
    btnGuardar.appendChild(spanBtn);

    formEditar.appendChild(grupoDoc);
    formEditar.appendChild(grupoNombre);
    formEditar.appendChild(grupoEmail);
    formEditar.appendChild(btnGuardar);

    // Listener del submit: llama a la API para actualizar y recarga la tabla
    formEditar.addEventListener('submit', async function(event) {
        event.preventDefault();

        // FEAT #57: validación completa con mensajes del backend (Zod-matching)
        const valido = await validarFormularioUsuario({
            docInput:   inputDoc,
            nameInput:  inputNombre,
            emailInput: inputEmail,
            docError:   null,
            nameError:  null,
            emailError: null,
        });
        if (!valido) return;

        const documento = inputDoc.value.trim();
        const nombre    = inputNombre.value.trim();
        const email     = inputEmail.value.trim();

        // Se llama a la capa API con el id del usuario y los datos nuevos
        const usuarioActualizado = await actualizarUsuario(usuario.id, {
            documento,
            name:  nombre,
            email,
        });

        if (usuarioActualizado) {
            cerrarModalEditarUsuarioExistente();
            await mostrarNotificacion(`${nombre} fue actualizado correctamente`, 'exito');
            // Se recarga la tabla para reflejar los datos actualizados
            cargarTablaUsuarios();
        } else {
            await mostrarNotificacion('Error al actualizar el usuario', 'error');
        }
    });

    cuerpo.appendChild(formEditar);
    modal.appendChild(cuerpo);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Clic en el overlay oscuro cierra el modal (igual que el modal de asignar)
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) cerrarModalEditarUsuarioExistente();
    });
}

// Cierra y elimina el modal de edición de usuario si existe en el DOM
function cerrarModalEditarUsuarioExistente() {
    const existing = document.getElementById('modalEditarUsuarioOverlay');
    if (existing) existing.remove();
}

// ── DASHBOARD LOCAL ──────────────────────────────────────────────────────────
// Recalcula los contadores del dashboard usando todasLasTareas en memoria,
// sin hacer ninguna petición al servidor.
// Se usa después de editar o eliminar una tarea para reflejar el cambio de inmediato.
// ACTUALIZACIÓN v3.4.0: incluye el contador de pendiente_aprobacion.
function actualizarDashboardLocal() {
    const el = {
        total:      document.getElementById('dashboardTotal'),
        pendiente:  document.getElementById('dashboardPendiente'),
        progreso:   document.getElementById('dashboardProgreso'),
        // Nuevo contador para el cuarto estado del sistema
        aprobacion: document.getElementById('dashboardAprobacion'),
        completada: document.getElementById('dashboardCompletada'),
    };
    if (!el.total) return;

    // Se filtran las tareas de memoria por cada uno de los cuatro estados
    const pendientes  = todasLasTareas.filter(t => t.status === 'pendiente').length;
    const enProgreso  = todasLasTareas.filter(t => t.status === 'en_progreso').length;
    // Cuarto estado: el usuario marcó la tarea como lista para revisión del admin
    const aprobacion  = todasLasTareas.filter(t => t.status === 'pendiente_aprobacion').length;
    const completadas = todasLasTareas.filter(t => t.status === 'completada').length;

    el.total.textContent      = todasLasTareas.length;
    el.pendiente.textContent  = pendientes;
    el.progreso.textContent   = enProgreso;
    if (el.aprobacion) el.aprobacion.textContent = aprobacion;
    el.completada.textContent = completadas;
}

// ── TABLA TAREAS ADMIN ────────────────────────────────────────────────────────

// Fuente de verdad del admin: todas las tareas sin filtrar
let todasLasTareas = [];

export async function cargarTodasLasTareas() {
    const tareas = await obtenerTodasLasTareas();
    todasLasTareas = tareas || [];
    aplicarFiltrosAdmin();
}

export function aplicarFiltrosAdmin() {
    const tbody         = document.getElementById('adminTasksTableBody');
    const contadorEl    = document.getElementById('adminTasksCount');
    const filtroEstado  = document.getElementById('adminFiltroEstado');
    const filtroUsuario = document.getElementById('adminFiltroUsuario');
    const ordenSelect   = document.getElementById('adminOrdenSelect');

    if (!tbody) return;

    const estado  = filtroEstado  ? filtroEstado.value  : '';
    const termino = filtroUsuario ? filtroUsuario.value  : '';
    const orden   = ordenSelect   ? ordenSelect.value    : '';

    let resultado = filtrarTareas(todasLasTareas, estado, termino);
    resultado     = ordenarTareas(resultado, orden);

    // Vaciar tbody con removeChild para respetar la regla del proyecto
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (contadorEl) {
        contadorEl.textContent = `${resultado.length} ${resultado.length === 1 ? 'tarea' : 'tareas'}`;
    }

    if (resultado.length === 0) {
        const fila = document.createElement('tr');
        const td   = document.createElement('td');
        td.colSpan        = 6;
        td.textContent    = 'No hay tareas que coincidan con los filtros';
        td.style.textAlign = 'center';
        td.style.color    = '#9ca3af';
        fila.appendChild(td);
        tbody.appendChild(fila);
        return;
    }

    resultado.forEach(function(tarea, indice) {
        tbody.appendChild(crearFilaTareaAdmin(tarea, indice));
    });
}

// Convierte el valor técnico del estado a texto legible en español.
// Se usa en la tabla de tareas del panel admin.
// ACTUALIZACIÓN v3.4.0: incluye el cuarto estado pendiente_aprobacion.
function formatearEstado(estado) {
    const mapa = {
        pendiente:            'Pendiente',
        en_progreso:          'En Progreso',
        // Estado que pone el usuario cuando considera que terminó su trabajo
        pendiente_aprobacion: 'Pendiente por aprobar',
        completada:           'Completada',
    };
    return mapa[estado] || estado;
}

// Abre el modal de edición compartido para una tarea del panel admin.
// Al guardar, recarga la tabla de tareas y el dashboard.
function manejarEdicionTareaAdmin(tarea) {
    mostrarModalEdicion(tarea);

    const formulario = document.getElementById('editTaskForm');

    async function guardarCambiosAdmin(event) {
        event.preventDefault();

        const tareaId     = document.getElementById('editTaskId').value;
        const titulo      = document.getElementById('editTaskTitle').value.trim();
        const descripcion = document.getElementById('editTaskDescription').value.trim();
        const estado      = document.getElementById('editTaskStatus').value;
        const comentEl    = document.getElementById('editTaskComment');
        const comentario  = comentEl ? comentEl.value.trim() : '';

        const datosActualizados = {
            title:       titulo,
            description: descripcion,
            status:      estado,
            comment:     comentario,
        };

        const tareaActualizada = await actualizarTarea(tareaId, datosActualizados);

        if (tareaActualizada) {
            // Actualización local: modifica la tarea en memoria y repinta sin fetch
            const idx = todasLasTareas.findIndex(t => t.id.toString() === tareaId.toString());
            if (idx !== -1) {
                todasLasTareas[idx] = {
                    ...todasLasTareas[idx],
                    ...tareaActualizada,
                    // Se garantiza que el comment quede actualizado (backend + local)
                    comment: tareaActualizada.comment !== undefined
                        ? tareaActualizada.comment
                        : comentario || null,
                };
            }
            ocultarModalEdicion();
            actualizarDashboardLocal();
            aplicarFiltrosAdmin();
            await mostrarNotificacion('Tarea actualizada exitosamente', 'exito');
        } else {
            await mostrarNotificacion('Error al actualizar la tarea', 'error');
        }

        formulario.removeEventListener('submit', guardarCambiosAdmin);
    }

    formulario.addEventListener('submit', guardarCambiosAdmin);
}

function crearFilaTareaAdmin(tarea, indice) {
    const fila = document.createElement('tr');

    const celdaNum = document.createElement('td');
    celdaNum.textContent = indice + 1;

    const celdaTitulo = document.createElement('td');
    celdaTitulo.textContent = tarea.title;

    const celdaDesc = document.createElement('td');
    celdaDesc.textContent = tarea.description || '—';

    const celdaEstado = document.createElement('td');
    const badge = document.createElement('span');
    badge.classList.add('status-badge', `status-${tarea.status}`);
    badge.textContent = formatearEstado(tarea.status);
    celdaEstado.appendChild(badge);

    const celdaUsuario = document.createElement('td');
    celdaUsuario.textContent = tarea.assignedUsersDisplay || 'Sin asignar';

    const celdaAcciones = document.createElement('td');
    const contenedor    = document.createElement('div');
    contenedor.classList.add('task-actions');

    // Botón Editar — abre el modal compartido con el modo usuario
    const btnEditar = document.createElement('button');
    btnEditar.textContent = '✏️ Editar';
    btnEditar.classList.add('btn-action', 'btn-action--edit');
    btnEditar.type = 'button';
    btnEditar.addEventListener('click', function() {
        manejarEdicionTareaAdmin(tarea);
    });

    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = '🗑️ Eliminar';
    btnEliminar.classList.add('btn-action', 'btn-action--delete');
    btnEliminar.type = 'button';
    btnEliminar.addEventListener('click', async function() {
        const confirmado = await mostrarConfirmacion(
            '¿Eliminar tarea?',
            `"${tarea.title}" será eliminada permanentemente.`,
            'Sí, eliminar'
        );
        if (!confirmado) return;

        const eliminada = await eliminarTarea(tarea.id);
        if (eliminada) {
            // Eliminación local: quita la tarea de memoria y repinta sin fetch
            todasLasTareas = todasLasTareas.filter(t => t.id !== tarea.id);
            actualizarDashboardLocal();
            aplicarFiltrosAdmin();
            await mostrarNotificacion('Tarea eliminada correctamente', 'exito');
        } else {
            await mostrarNotificacion('Error al eliminar la tarea', 'error');
        }
    });

    contenedor.appendChild(btnEditar);
    contenedor.appendChild(btnEliminar);
    celdaAcciones.appendChild(contenedor);

    fila.appendChild(celdaNum);
    fila.appendChild(celdaTitulo);
    fila.appendChild(celdaDesc);
    fila.appendChild(celdaEstado);
    fila.appendChild(celdaUsuario);
    fila.appendChild(celdaAcciones);

    return fila;
}

// ── MODAL USUARIO (admin) ─────────────────────────────────────────────────────

export async function abrirModalUsuario(usuario) {
    cerrarModalUsuarioExistente();

    const overlay = document.createElement('div');
    overlay.className = 'modal-usuario-overlay';
    overlay.id        = 'modalUsuarioOverlay';

    const modal = document.createElement('div');
    modal.className = 'modal-usuario';

    // Header
    const header = document.createElement('div');
    header.className = 'modal-usuario__header';

    const infoTexto = document.createElement('div');
    const titulo = document.createElement('h2');
    titulo.className   = 'modal-usuario__titulo';
    titulo.textContent = usuario.name;
    const subtitulo = document.createElement('p');
    subtitulo.className   = 'modal-usuario__subtitulo';
    subtitulo.textContent = `Documento: ${usuario.documento || usuario.id}`;
    infoTexto.appendChild(titulo);
    infoTexto.appendChild(subtitulo);

    const btnCerrar = document.createElement('button');
    btnCerrar.className   = 'modal-usuario__cerrar';
    btnCerrar.type        = 'button';
    btnCerrar.textContent = '✕';
    btnCerrar.addEventListener('click', cerrarModalUsuarioExistente);

    header.appendChild(infoTexto);
    header.appendChild(btnCerrar);
    modal.appendChild(header);

    // Cuerpo: dos columnas
    const cuerpo = document.createElement('div');
    cuerpo.className = 'modal-usuario__cuerpo';

    // ── Columna izquierda: tareas actuales ────────────────────────────────────
    const seccionTareas = document.createElement('div');
    seccionTareas.className = 'modal-usuario__tareas';

    const tituloTareas = document.createElement('h3');
    tituloTareas.className   = 'modal-usuario__seccion-titulo';
    tituloTareas.textContent = 'Tareas asignadas';
    seccionTareas.appendChild(tituloTareas);

    const tareas = await obtenerTareasDeUsuario(usuario.id);

    if (!tareas || tareas.length === 0) {
        const p = document.createElement('p');
        p.className   = 'modal-vacio';
        p.textContent = 'Este usuario no tiene tareas asignadas.';
        seccionTareas.appendChild(p);
    } else {
        tareas.forEach(function(tarea) {
            const item = document.createElement('div');
            item.className = 'modal-tarea-item';

            const texto = document.createElement('span');
            texto.textContent = tarea.title;

            const badge = document.createElement('span');
            badge.classList.add('status-badge', `status-${tarea.status}`);
            badge.textContent = formatearEstado(tarea.status);

            item.appendChild(texto);
            item.appendChild(badge);
            seccionTareas.appendChild(item);
        });
    }

    cuerpo.appendChild(seccionTareas);

    // ── Columna derecha: asignar nueva tarea ──────────────────────────────────
    const seccionAsignar = document.createElement('div');
    seccionAsignar.className = 'modal-usuario__asignar';

    const tituloAsignar = document.createElement('h3');
    tituloAsignar.className   = 'modal-usuario__seccion-titulo';
    tituloAsignar.textContent = 'Asignar nueva tarea';
    seccionAsignar.appendChild(tituloAsignar);

    const formAsignar = document.createElement('form');
    formAsignar.className = 'form';

    // Campo título
    const grupoTitulo = document.createElement('div');
    grupoTitulo.className = 'form__group';
    const labelTitulo = document.createElement('label');
    labelTitulo.setAttribute('for', 'modal-tarea-titulo');
    labelTitulo.className   = 'form__label';
    labelTitulo.textContent = 'Título';
    const inputTitulo = document.createElement('input');
    inputTitulo.type        = 'text';
    inputTitulo.id          = 'modal-tarea-titulo';
    inputTitulo.className   = 'form__input';
    inputTitulo.placeholder = 'Título de la tarea';
    grupoTitulo.appendChild(labelTitulo);
    grupoTitulo.appendChild(inputTitulo);

    // Campo descripción
    const grupoDesc = document.createElement('div');
    grupoDesc.className = 'form__group';
    const labelDesc = document.createElement('label');
    labelDesc.setAttribute('for', 'modal-tarea-desc');
    labelDesc.className   = 'form__label';
    labelDesc.textContent = 'Descripción ';
    const spanOpcional = document.createElement('span');
    spanOpcional.className   = 'form__label--opcional';
    spanOpcional.textContent = '(opcional)';
    labelDesc.appendChild(spanOpcional);
    const textareaDesc = document.createElement('textarea');
    textareaDesc.id          = 'modal-tarea-desc';
    textareaDesc.className   = 'form__input form__textarea';
    textareaDesc.rows        = 2;
    textareaDesc.placeholder = 'Descripción…';
    grupoDesc.appendChild(labelDesc);
    grupoDesc.appendChild(textareaDesc);

    // Campo estado
    const grupoEstado = document.createElement('div');
    grupoEstado.className = 'form__group';
    const labelEstado = document.createElement('label');
    labelEstado.setAttribute('for', 'modal-tarea-estado');
    labelEstado.className   = 'form__label';
    labelEstado.textContent = 'Estado';
    const selectEstado = document.createElement('select');
    selectEstado.id        = 'modal-tarea-estado';
    selectEstado.className = 'form__input';

    const optDefault = document.createElement('option');
    optDefault.value = ''; optDefault.disabled = true; optDefault.selected = true;
    optDefault.textContent = 'Selecciona un estado';

    // El admin solo puede crear tareas con estos 3 estados (no "pendiente_aprobacion",
    // ese lo pone el usuario cuando termina su trabajo)
    [
        ['pendiente',   'Pendiente'],
        ['en_progreso', 'En Progreso'],
        ['completada',  'Completada'],
    ].forEach(([v, t]) => {
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = t;
        selectEstado.appendChild(opt);
    });

    selectEstado.insertBefore(optDefault, selectEstado.firstChild);
    grupoEstado.appendChild(labelEstado);
    grupoEstado.appendChild(selectEstado);

    // Campo comentario (opcional)
    const grupoComentario = document.createElement('div');
    grupoComentario.className = 'form__group';
    const labelComentario = document.createElement('label');
    labelComentario.setAttribute('for', 'modal-tarea-comentario');
    labelComentario.className = 'form__label';
    labelComentario.textContent = 'Comentario ';
    const spanOpcionalComentario = document.createElement('span');
    spanOpcionalComentario.className   = 'form__label--opcional';
    spanOpcionalComentario.textContent = '(opcional)';
    labelComentario.appendChild(spanOpcionalComentario);
    const textareaComentario = document.createElement('textarea');
    textareaComentario.id          = 'modal-tarea-comentario';
    textareaComentario.className   = 'form__input form__textarea';
    textareaComentario.rows        = 2;
    textareaComentario.placeholder = 'Agrega un comentario inicial...';
    grupoComentario.appendChild(labelComentario);
    grupoComentario.appendChild(textareaComentario);

    // Botón
    const btnAsignar = document.createElement('button');
    btnAsignar.type      = 'submit';
    btnAsignar.className = 'btn btn--admin-primary';
    const spanBtn = document.createElement('span');
    spanBtn.className   = 'btn__text';
    spanBtn.textContent = 'Asignar Tarea';
    btnAsignar.appendChild(spanBtn);

    formAsignar.appendChild(grupoTitulo);
    formAsignar.appendChild(grupoDesc);
    formAsignar.appendChild(grupoEstado);
    formAsignar.appendChild(grupoComentario);
    formAsignar.appendChild(btnAsignar);

    formAsignar.addEventListener('submit', async function(event) {
        event.preventDefault();

        const titulo     = inputTitulo.value.trim();
        const desc       = textareaDesc.value.trim();
        const estado     = selectEstado.value;
        const comentario = textareaComentario.value.trim();

        // FEAT #57: validación con mensajes del backend (Zod-matching)
        const validoTarea = await validarFormularioTarea({
            titleInput:  inputTitulo,
            statusInput: selectEstado,
            titleError:  null,
            statusError: null,
        });
        if (!validoTarea) return;

        const datosTarea = {
            title:         titulo,
            description:   desc,
            status:        estado,
            comment:       comentario || null,
            assignedUsers: [parseInt(usuario.id, 10) || usuario.id],
        };

        const tareaCreada = await registrarTarea(datosTarea);

        if (tareaCreada) {
            // CORRECCIÓN: se cierra el modal automáticamente al crear la tarea.
            // Antes se rearía el modal llamando de nuevo a abrirModalUsuario(),
            // lo que provocaba que el usuario tuviera que cerrarlo manualmente.
            // Ahora se cierra solo y se recargan los datos en segundo plano.
            cerrarModalUsuarioExistente();
            cargarTodasLasTareas();  // Recarga inmediata ANTES de la notificación
            cargarDashboard();
            await mostrarNotificacion(`Tarea "${titulo}" asignada correctamente`, 'exito');
        } else {
            await mostrarNotificacion('Error al asignar la tarea', 'error');
        }
    });

    seccionAsignar.appendChild(formAsignar);
    cuerpo.appendChild(seccionAsignar);
    modal.appendChild(cuerpo);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) cerrarModalUsuarioExistente();
    });
}

function cerrarModalUsuarioExistente() {
    const existing = document.getElementById('modalUsuarioOverlay');
    if (existing) existing.remove();
}

// ── CARDS CONTRAÍBLES ─────────────────────────────────────────────────────────
// Registra el comportamiento de toggle (contraer/desplegar) en las cards del panel admin.
// Cada card tiene un encabezado con clase admin-card__cabecera--toggle y un cuerpo
// con clase admin-card__cuerpo. Al hacer clic en el encabezado (o en la flecha):
//   - Se alterna la clase "oculto" en el cuerpo para ocultarlo o mostrarlo
//   - Se alterna la clase "contraido" en la flecha para rotarla
//   - Se alterna la clase "sin-borde" en el encabezado para quitar el separador
function registrarCardsContraibles() {
    // Pares de [id del encabezado, id del cuerpo] de cada card contraíble
    const pares = [
        ['toggleUsuarios',     'cuerpoUsuarios'],
        ['toggleTareas',       'cuerpoTareas'],
        // La card de crear tareas se agrega aquí cuando Sebastián la cree
        ['toggleCrearTareas',  'cuerpoCrearTareas'],
    ];

    pares.forEach(function(par) {
        const encabezadoId = par[0];
        const cuerpoId     = par[1];

        const encabezado = document.getElementById(encabezadoId);
        const cuerpo     = document.getElementById(cuerpoId);

        // Si alguno de los dos no existe en el DOM se salta este par
        if (!encabezado || !cuerpo) return;

        const botonFlecha = encabezado.querySelector('.btn-toggle-card');

        // Listener en el encabezado completo para que el clic en cualquier parte lo active
        encabezado.addEventListener('click', function() {
            // Se alterna la visibilidad del cuerpo de la card
            const estaOculto = cuerpo.classList.toggle('oculto');

            // Si está oculto la flecha apunta hacia arriba (clase contraido)
            // Si está visible la flecha apunta hacia abajo (sin clase)
            if (botonFlecha) botonFlecha.classList.toggle('contraido', estaOculto);

            // Se quita el borde inferior del encabezado cuando la card está contraída
            encabezado.classList.toggle('sin-borde', estaOculto);
        });
    });
}

// ── CARD CREAR TAREAS — DROPDOWN DE USUARIOS ──────────────────────────────────
// Flag para registrar los listeners del botón y del documento solo una vez.
// Sin esto, cada vez que se llama inicializarDropdownUsuarios() (p.ej. al crear
// un usuario) se duplican los listeners y el panel se abre/cierra erráticamente.
let _dropdownListenersRegistrados = false;

// Recarga los checkboxes del panel sin volver a registrar listeners.
async function recargarCheckboxesDropdown() {
    const btn   = document.getElementById('usuariosDropdownBtn');
    const panel = document.getElementById('usuariosDropdownPanel');
    const texto = document.getElementById('usuariosDropdownTexto');

    if (!btn || !panel || !texto) return;

    // Mensaje de carga mientras llega la respuesta del backend
    while (panel.firstChild) panel.removeChild(panel.firstChild);
    const msgCarga = document.createElement('p');
    msgCarga.className   = 'usuarios-dropdown__cargando';
    msgCarga.textContent = 'Cargando usuarios...';
    panel.appendChild(msgCarga);

    const usuarios = await obtenerTodosLosUsuarios();

    // Limpiar mensaje de carga
    while (panel.firstChild) panel.removeChild(panel.firstChild);

    if (!usuarios || usuarios.length === 0) {
        const vacio = document.createElement('div');
        vacio.className = 'usuarios-dropdown__vacio';

        const icono = document.createElement('span');
        icono.className   = 'usuarios-dropdown__vacio-icono';
        icono.textContent = '\u{1F465}';

        const msg = document.createElement('p');
        msg.className   = 'usuarios-dropdown__vacio-texto';
        msg.textContent = 'No hay usuarios registrados';

        vacio.appendChild(icono);
        vacio.appendChild(msg);
        panel.appendChild(vacio);
        return;
    }

    // Encabezado con contador de usuarios disponibles
    const encabezado = document.createElement('div');
    encabezado.className = 'usuarios-dropdown__encabezado';
    const contador = document.createElement('span');
    contador.className   = 'usuarios-dropdown__contador';
    contador.textContent = `${usuarios.length} usuario${usuarios.length !== 1 ? 's' : ''} disponible${usuarios.length !== 1 ? 's' : ''}`;
    encabezado.appendChild(contador);
    panel.appendChild(encabezado);

    // Una fila por cada usuario con avatar de iniciales
    usuarios.forEach(function(usuario) {
        const opcion = document.createElement('label');
        opcion.className = 'usuarios-dropdown__opcion';

        const checkbox = document.createElement('input');
        checkbox.type      = 'checkbox';
        checkbox.value     = usuario.id;
        checkbox.className = 'usuarios-dropdown__checkbox';
        checkbox.addEventListener('change', function() {
            actualizarTextoDropdown(btn, texto, panel);
            opcion.classList.toggle('seleccionada', checkbox.checked);
        });

        // Avatar circular con las dos primeras iniciales del nombre
        const avatar = document.createElement('span');
        avatar.className   = 'usuarios-dropdown__avatar';
        avatar.textContent = usuario.name
            .split(' ')
            .slice(0, 2)
            .map(function(p) { return p[0]; })
            .join('')
            .toUpperCase();

        // Info: nombre en negrita y documento en gris
        const info = document.createElement('div');
        info.className = 'usuarios-dropdown__info';

        const nombre = document.createElement('span');
        nombre.className   = 'usuarios-dropdown__nombre';
        nombre.textContent = usuario.name;

        const doc = document.createElement('span');
        doc.className   = 'usuarios-dropdown__doc';
        doc.textContent = `Doc: ${usuario.documento}`;

        info.appendChild(nombre);
        info.appendChild(doc);

        opcion.appendChild(checkbox);
        opcion.appendChild(avatar);
        opcion.appendChild(info);
        panel.appendChild(opcion);
    });
}

// Inicializa el dropdown de checkboxes de usuarios en la card "Crear Tarea".
// Registra los listeners del botón y del documento solo la primera vez.
// Las llamadas posteriores (tras crear un usuario) solo recargan los checkboxes.
async function inicializarDropdownUsuarios() {
    const btn   = document.getElementById('usuariosDropdownBtn');
    const panel = document.getElementById('usuariosDropdownPanel');
    const texto = document.getElementById('usuariosDropdownTexto');

    if (!btn || !panel || !texto) return;

    // Carga los checkboxes (siempre, para reflejar usuarios recién creados)
    await recargarCheckboxesDropdown();

    // Los listeners del botón y del documento se registran solo una vez
    if (_dropdownListenersRegistrados) return;
    _dropdownListenersRegistrados = true;

    // Listener del botón: abre o cierra el panel al hacer clic
    btn.addEventListener('click', function(event) {
        event.stopPropagation();

        const estaAbierto = !panel.classList.contains('hidden');

        if (estaAbierto) {
            panel.classList.add('hidden');
            btn.classList.remove('abierto');
            btn.setAttribute('aria-expanded', 'false');
        } else {
            panel.classList.remove('hidden');
            btn.classList.add('abierto');
            btn.setAttribute('aria-expanded', 'true');
        }
    });

    // Clic fuera del dropdown lo cierra
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('usuariosDropdown');
        if (dropdown && !dropdown.contains(event.target)) {
            panel.classList.add('hidden');
            btn.classList.remove('abierto');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
}

// Actualiza el texto del botón del dropdown según los checkboxes seleccionados.
// Si ninguno está seleccionado muestra el placeholder.
// Si hay seleccionados muestra los nombres separados por coma (máximo 2 + "y N más").
// Parámetros:
//   btn   — el elemento button del dropdown
//   texto — el span que muestra el texto dentro del botón
//   panel — el div con los checkboxes para leer cuáles están marcados
function actualizarTextoDropdown(btn, texto, panel) {
    // Se buscan todos los checkboxes marcados dentro del panel
    const seleccionados = panel.querySelectorAll('input[type="checkbox"]:checked');

    if (seleccionados.length === 0) {
        // Sin selección se muestra el placeholder original
        texto.textContent = 'Seleccionar usuarios...';
        return;
    }

    // Se recogen los nombres de los labels de los checkboxes seleccionados
    const nombres = Array.from(seleccionados).map(function(cb) {
        // El span con el nombre es el siguiente hermano del checkbox dentro del label
        const label = cb.closest('.usuarios-dropdown__opcion');
        const span  = label ? label.querySelector('span') : null;
        // Solo se toma el nombre (antes del paréntesis del documento)
        return span ? span.textContent.split(' (')[0] : '';
    }).filter(Boolean);

    // Si hay 2 o menos nombres se muestran todos
    // Si hay más se muestran los primeros 2 y "y N más"
    if (nombres.length <= 2) {
        texto.textContent = nombres.join(', ');
    } else {
        texto.textContent = `${nombres.slice(0, 2).join(', ')} y ${nombres.length - 2} más`;
    }
}

// Retorna un arreglo con los IDs numéricos de los usuarios seleccionados en el dropdown.
// Se usa al hacer submit del formulario de crear tarea.
function obtenerIdsSeleccionados() {
    const panel = document.getElementById('usuariosDropdownPanel');
    if (!panel) return [];

    // Se buscan todos los checkboxes marcados y se mapean a número entero
    const checkboxes = panel.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(function(cb) {
        return parseInt(cb.value, 10);
    });
}

// ── LIMPIAR FORMULARIO DE LOGIN ───────────────────────────────────────────────
// Limpia los campos de email y contraseña del formulario de login,
// oculta el mensaje de bienvenida y quita los mensajes de error visibles.
//
// Se llama desde activarModoInicio() y desde manejarCerrarSesion()
// para garantizar que cuando el usuario vuelve a la pantalla de inicio
// no vea los datos del usuario anterior en los campos.
// Esto es crítico en entornos compartidos: un segundo usuario no debe
// ver el email del usuario anterior si este no cerró el navegador.
function limpiarFormularioLogin() {
    // Limpiar el campo de email
    const inputEmail = document.getElementById('loginEmail');
    if (inputEmail) inputEmail.value = '';

    // Limpiar el campo de contraseña
    const inputPassword = document.getElementById('loginPassword');
    if (inputPassword) inputPassword.value = '';

    // Resetear el botón del ojo (mostrar/ocultar contraseña) a su estado inicial
    if (inputPassword) inputPassword.type = 'password';
    const btnToggle = document.getElementById('btnTogglePassword');
    if (btnToggle) btnToggle.textContent = '👁️';

    // Ocultar el mensaje de bienvenida post-login si está visible
    // El mensaje dice "Sesión iniciada · [nombre]" y debe desaparecer al volver
    const bienvenidaDiv = document.getElementById('loginBienvenida');
    if (bienvenidaDiv) bienvenidaDiv.classList.add('hidden');

    // Limpiar los spans de error para que no queden mensajes visibles
    const errorEmail = document.getElementById('loginEmailError');
    if (errorEmail) errorEmail.textContent = '';

    const errorPassword = document.getElementById('loginPasswordError');
    if (errorPassword) errorPassword.textContent = '';

    // Quitar la clase 'error' de los inputs si quedaron marcados en rojo
    if (inputEmail)    inputEmail.classList.remove('error');
    if (inputPassword) inputPassword.classList.remove('error');
}

// ── CERRAR SESIÓN CON CONFIRMACIÓN ────────────────────────────────────────────
// Se llama al hacer clic en el botón circular de logout en ambos paneles.
// Muestra una confirmación SweetAlert2 antes de cerrar sesión.
// Si el usuario confirma:
//   1. Se borra la sesión del localStorage (tokens y datos del usuario)
//   2. Se limpian los campos del formulario de login
//   3. Se redirige a la pantalla de inicio
// Así ningún dato queda expuesto si otro usuario usa el mismo computador.
async function manejarCerrarSesion() {

    // Pedir confirmación antes de cerrar sesión
    // mostrarConfirmacion viene de notificaciones.js y usa SweetAlert2
    const confirmado = await mostrarConfirmacion(
        '¿Cerrar sesión?',
        'Se cerrará tu sesión actual y volverás a la pantalla de inicio.',
        'Sí, cerrar sesión'
    );

    // Si el usuario canceló no se hace nada
    if (!confirmado) return;

    // Borrar todos los datos de sesión del localStorage
    // cerrarSesion() está en src/utils/sesion.js y elimina accessToken,
    // refreshToken y usuarioActual en un solo paso
    cerrarSesion();

    // Limpiar los campos del formulario antes de mostrar la pantalla de inicio
    // Así el próximo usuario que abra la página no verá los datos del anterior
    limpiarFormularioLogin();

    // Redirigir a la pantalla de inicio
    activarModoInicio();
}

// ── ABRIR MODAL DE REGISTRO ───────────────────────────────────────────────────
// Se llama al hacer clic en el botón "Regístrate aquí" debajo del login.
// El modal aparece encima de la pantalla de inicio sin que esta desaparezca.
function abrirModalRegistro() {
    const modal = document.getElementById('registroModal');
    if (modal) modal.classList.remove('hidden');
    // Limpiar el formulario por si el usuario lo abrió y cerró antes
    limpiarFormularioRegistro();
}

// ── CERRAR MODAL DE REGISTRO ──────────────────────────────────────────────────
// Se llama al hacer clic en el botón X o al registrarse exitosamente.
function cerrarModalRegistro() {
    const modal = document.getElementById('registroModal');
    if (modal) modal.classList.add('hidden');
    limpiarFormularioRegistro();
}

// ── LIMPIAR FORMULARIO DE REGISTRO ───────────────────────────────────────────
// Limpia todos los campos del formulario y los mensajes de error.
// Se llama al abrir y al cerrar el modal para siempre empezar limpio.
function limpiarFormularioRegistro() {
    // Agregar 'registroConfirmar' al array de campos
    const campos = ['registroNombre', 'registroDocumento', 'registroEmail', 'registroPassword', 'registroConfirmar'];
    campos.forEach(function(id) {
        const input = document.getElementById(id);
        if (input) {
            input.value = '';
            input.classList.remove('error');
        }
    });
    // Agregar 'registroConfirmarError' al array de errores
    const errores = ['registroNombreError', 'registroDocumentoError', 'registroEmailError', 'registroPasswordError', 'registroConfirmarError'];
    errores.forEach(function(id) {
        const span = document.getElementById(id);
        if (span) span.textContent = '';
    });
}

// ── VALIDAR FORMULARIO DE REGISTRO ───────────────────────────────────────────
// Valida los 4 campos del formulario antes de enviar la petición al backend.
// Muestra errores en los spans de cada campo Y como toast de SweetAlert2.
// Retorna true si todos los campos son válidos.
async function validarFormularioRegistroLocal() {
    let esValido      = true;
    let primerMensaje = null;

    const nombreInput    = document.getElementById('registroNombre');
    const documentoInput = document.getElementById('registroDocumento');
    const emailInput     = document.getElementById('registroEmail');
    const passwordInput  = document.getElementById('registroPassword');
    const confirmarInput  = document.getElementById('registroConfirmar');

    const nombreError    = document.getElementById('registroNombreError');
    const documentoError = document.getElementById('registroDocumentoError');
    const emailError     = document.getElementById('registroEmailError');
    const passwordError  = document.getElementById('registroPasswordError');
    const confirmarError  = document.getElementById('registroConfirmarError');

    // Limpiar errores previos
    [nombreError, documentoError, emailError, passwordError, confirmarError].forEach(el => { if (el) el.textContent = ''; });
    [nombreInput, documentoInput, emailInput, passwordInput, confirmarInput].forEach(el => { if (el) el.classList.remove('error'); });

    // Validar nombre: obligatorio, mínimo 3, solo letras y espacios
    const valorNombre = nombreInput ? nombreInput.value.trim() : '';
    if (!valorNombre) {
        const msg = 'El nombre es obligatorio';
        if (nombreError) nombreError.textContent = msg;
        if (nombreInput) nombreInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorNombre.length < 3) {
        const msg = 'El nombre debe tener al menos 3 caracteres';
        if (nombreError) nombreError.textContent = msg;
        if (nombreInput) nombreInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(valorNombre)) {
        // Si el nombre tiene números o caracteres especiales no se acepta
        const msg = 'El nombre solo puede contener letras y espacios';
        if (nombreError) nombreError.textContent = msg;
        if (nombreInput) nombreInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // Validar documento: obligatorio, solo números, mínimo 5
    const valorDocumento = documentoInput ? documentoInput.value.trim() : '';
    if (!valorDocumento) {
        const msg = 'El número de documento es obligatorio';
        if (documentoError) documentoError.textContent = msg;
        if (documentoInput) documentoInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (!/^\d+$/.test(valorDocumento)) {
        // Si el documento tiene letras o caracteres especiales no se acepta
        const msg = 'El documento solo puede contener números';
        if (documentoError) documentoError.textContent = msg;
        if (documentoInput) documentoInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorDocumento.length < 5) {
        const msg = 'El documento debe tener al menos 5 dígitos';
        if (documentoError) documentoError.textContent = msg;
        if (documentoInput) documentoInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // Validar email: obligatorio, formato válido (tiene @ y dominio)
    const valorEmail = emailInput ? emailInput.value.trim() : '';
    if (!valorEmail) {
        const msg = 'El correo electrónico es obligatorio';
        if (emailError) emailError.textContent = msg;
        if (emailInput) emailInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valorEmail)) {
        const msg = 'El correo electrónico no tiene un formato válido';
        if (emailError) emailError.textContent = msg;
        if (emailInput) emailInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // Validar contraseña: obligatoria, mínimo 6 caracteres
    const valorPassword = passwordInput ? passwordInput.value : '';
    if (!valorPassword) {
        const msg = 'La contraseña es obligatoria';
        if (passwordError) passwordError.textContent = msg;
        if (passwordInput) passwordInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorPassword.length < 6) {
        const msg = 'La contraseña debe tener al menos 6 caracteres';
        if (passwordError) passwordError.textContent = msg;
        if (passwordInput) passwordInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // Validar confirmar contraseña: obligatoria y debe coincidir con la contraseña
    const valorConfirmar = confirmarInput ? confirmarInput.value : '';
    if (!valorConfirmar) {
        const msg = 'Debes confirmar tu contraseña';
        if (confirmarError) confirmarError.textContent = msg;
        if (confirmarInput) confirmarInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorPassword && valorConfirmar !== valorPassword) {
        const msg = 'Las contraseñas no coinciden';
        if (confirmarError) confirmarError.textContent = msg;
        if (confirmarInput) confirmarInput.classList.add('error');
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }
    
    // Mostrar el primer error como toast de SweetAlert2
    if (primerMensaje) await mostrarNotificacion(primerMensaje, 'error');

    return esValido;
}

// registrarListenerCambioPassword — registra todos los eventos del modal de cambio de contraseña.
// Se llama una sola vez al inicio desde registrarEventosNavegacion().
// El modal se abre desde los 3 botones de perfil circular (admin, usuario, instructor).
function registrarListenerCambioPassword() {
    const modal          = document.getElementById('cambioPasswordModal');
    const btnCerrar      = document.getElementById('cambioPasswordClose');
    const btnCancelar    = document.getElementById('cambioPasswordCancelar');
    const form           = document.getElementById('cambioPasswordForm');

    // Función auxiliar para abrir el modal — limpia el formulario antes de mostrarlo
    function abrirModalPassword() {
        if (form) form.reset();
        // Limpiar mensajes de error del formulario anterior
        const errores = modal.querySelectorAll('.form__error');
        errores.forEach(el => { el.textContent = ''; });
        // Limpiar clases de error de los inputs
        const inputs = modal.querySelectorAll('.form__input');
        inputs.forEach(el => el.classList.remove('error'));
        modal.classList.remove('hidden');
    }

    // Función auxiliar para cerrar el modal
    function cerrarModalPassword() {
        modal.classList.add('hidden');
    }

    // Abrir el modal desde el botón de perfil del panel admin
    const btnPerfilAdmin = document.getElementById('btnPerfilAdmin');
    if (btnPerfilAdmin) btnPerfilAdmin.addEventListener('click', abrirModalPassword);

    // Abrir el modal desde el botón de perfil del panel usuario
    const btnPerfilUsuario = document.getElementById('btnPerfilUsuario');
    if (btnPerfilUsuario) btnPerfilUsuario.addEventListener('click', abrirModalPassword);

    // Abrir el modal desde el botón de perfil del panel instructor
    const btnPerfilInstructor = document.getElementById('btnPerfilInstructor');
    if (btnPerfilInstructor) btnPerfilInstructor.addEventListener('click', abrirModalPassword);

    // Cerrar el modal con el botón X
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModalPassword);

    // Cerrar el modal con el botón Cancelar
    if (btnCancelar) btnCancelar.addEventListener('click', cerrarModalPassword);

    // Cerrar el modal al hacer clic fuera del contenido del modal
    if (modal) {
        modal.addEventListener('click', function(e) {
            // Solo cerrar si el clic fue en el overlay (fondo oscuro), no en el contenido
            if (e.target === modal) cerrarModalPassword();
        });
    }

    // Submit del formulario de cambio de contraseña
    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();

            const actual     = document.getElementById('passwordActual').value;
            const nueva      = document.getElementById('passwordNueva').value;
            const confirmar  = document.getElementById('passwordConfirmar').value;

            // Limpiar errores anteriores antes de validar
            document.getElementById('passwordActualError').textContent    = '';
            document.getElementById('passwordNuevaError').textContent     = '';
            document.getElementById('passwordConfirmarError').textContent = '';

            // Validación de campos obligatorios
            let esValido = true;
            if (!actual) {
                document.getElementById('passwordActualError').textContent = 'La contraseña actual es obligatoria';
                esValido = false;
            }
            if (!nueva || nueva.length < 6) {
                document.getElementById('passwordNuevaError').textContent = 'La nueva contraseña debe tener al menos 6 caracteres';
                esValido = false;
            }
            if (nueva !== confirmar) {
                document.getElementById('passwordConfirmarError').textContent = 'Las contraseñas no coinciden';
                esValido = false;
            }
            if (!esValido) return;

            // Obtener el id del usuario logueado desde sesion.js
            const usuarioSesion = obtenerUsuarioSesion();
            if (!usuarioSesion) {
                await mostrarNotificacion('No hay sesión activa. Por favor inicia sesión.', 'error');
                return;
            }

            // Llamar al endpoint PATCH /api/users/:id/password
            const resultado = await cambiarPassword(usuarioSesion.id, {
                currentPassword: actual,
                newPassword:     nueva,
            });

            if (resultado === true) {
                cerrarModalPassword();
                await mostrarNotificacion('Contraseña actualizada correctamente', 'exito');
            } else {
                // El backend respondió con un error específico (ej: contraseña actual incorrecta)
                await mostrarNotificacion(resultado.error || 'Error al cambiar la contraseña', 'error');
            }
        });
    }
}

// ── REGISTRO DE EVENTOS DE NAVEGACIÓN ────────────────────────────────────────

export function registrarEventosNavegacion() {
    
    // Se registra el comportamiento de toggle en las cards contraíbles del panel admin
    registrarCardsContraibles();

    // ── FORMULARIO DE LOGIN ───────────────────────────────────────────────────────
    const formLogin       = document.getElementById('loginForm');
    const inputEmail     = document.getElementById('loginEmail');              // Se cambia el id de loginDocumento a loginEmail para que coincida con el HTML actualizado
    const inputPassword   = document.getElementById('loginPassword');
    const errorEmail     = document.getElementById('loginEmailError');
    const errorPassword   = document.getElementById('loginPasswordError');
    const bienvenidaDiv   = document.getElementById('loginBienvenida');
    const bienvenidaTexto = document.getElementById('loginBienvenidaTexto');
    const btnToggle       = document.getElementById('btnTogglePassword');

    // Botón 👁️ — alternar visibilidad de la contraseña
    if (btnToggle) {
        btnToggle.addEventListener('click', function () {
            const tipo = inputPassword.type === 'password' ? 'text' : 'password';
            inputPassword.type    = tipo;
            btnToggle.textContent = tipo === 'password' ? '👁️' : '🙈';
        });
    }

    // Submit del formulario de login
    if (formLogin) {
        formLogin.addEventListener('submit', async function (event) {
            event.preventDefault();

            // validarFormularioLogin valida ambos campos con el mismo patrón del proyecto:
            // muestra el error en el span del input Y como toast con SweetAlert2.
            // Retorna false si algo falla — en ese caso no llamamos al servidor.
             const esValido = await validarFormularioLogin({
                emailInput:    inputEmail,      // ← antes era docInput: inputDocumento
                passwordInput: inputPassword,
                emailError:    errorEmail,      // ← antes era docError: errorDocumento
                passwordError: errorPassword,
            });
            if (!esValido) return;

            // Deshabilitar el botón para evitar doble envío
            const btnLogin = document.getElementById('btnLogin');
            if (btnLogin) { btnLogin.disabled = true; btnLogin.textContent = 'Ingresando...'; }

            try {
                // Llamada al backend — si falla lanza un Error con el mensaje del servidor
                const datos = await loginUsuario({
                email:    inputEmail.value.trim(),     // ← antes era documento
                password: inputPassword.value,
            })

                // Guardar tokens y datos del usuario en localStorage
                guardarSesion(datos);

                // Si el backend no incluye el email en datos.user, lo tomamos del campo del formulario
                if (!datos.user.email) {
                    const emailIngresado = inputEmail.value.trim();
                    const usuarioConEmail = { ...datos.user, email: emailIngresado };
                    guardarSesion({ ...datos, user: usuarioConEmail });
                } else {
                    guardarSesion(datos);
                }

                // Mostrar saludo personalizado con el rol
                const etiquetaRol = datos.user.role === 'admin' ? 'Administrador' : 'Usuario';
                if (bienvenidaDiv && bienvenidaTexto) {
                    bienvenidaTexto.textContent = `Sesión iniciada · ${datos.user.name}`;
                    bienvenidaDiv.classList.remove('hidden');
                }

                // Pequeña pausa para que el usuario vea el saludo antes de redirigir
                await new Promise(resolve => setTimeout(resolve, 1200));

                // Redirigir al modo que corresponde según el rol del usuario
                // Se evalúan los 3 roles posibles: admin, instructor y user
                // Sin este bloque completo, el instructor aterrizaba en la vista de usuario
                if (datos.user.role === 'admin') {
                    // El rol admin activa el panel de administración con CRUD completo
                    await activarModoAdmin();
                } else if (datos.user.role === 'instructor') {
                    // El rol instructor activa el panel docente con paleta verde
                    // Esta línea faltaba — causaba que instructor viera la vista de usuario
                    await activarModoInstructor();
                } else {
                    // El rol user activa el panel personal con solo sus tareas
                    activarModoUsuario();
                }

            } catch (error) {
                // El mensaje de error viene del backend en español
                await mostrarNotificacion(error.message || 'Credenciales incorrectas', 'error');
            } finally {
                // Siempre rehabilitar el botón, haya error o no
                if (btnLogin) {
                    btnLogin.disabled    = false;
                    btnLogin.textContent = 'Ingresar al Sistema';
                }
            }
        });
    }

    // Botones volver
    const btnLogoutUsuario = document.getElementById('btnLogoutUsuario');
    if (btnLogoutUsuario) {
        btnLogoutUsuario.addEventListener('click', manejarCerrarSesion);
    }

    const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');
    if (btnLogoutAdmin) {
        btnLogoutAdmin.addEventListener('click', manejarCerrarSesion);
    }

    // Botón de cerrar sesión del panel instructor
    const btnLogoutInstructor = document.getElementById('btnLogoutInstructor');
    if (btnLogoutInstructor) {
        btnLogoutInstructor.addEventListener('click', manejarCerrarSesion);
    }


    // Filtros de la tabla admin
    const btnAplicar = document.getElementById('adminBtnAplicarFiltros');
    if (btnAplicar) btnAplicar.addEventListener('click', aplicarFiltrosAdmin);

    const btnLimpiar = document.getElementById('adminBtnLimpiarFiltros');
    if (btnLimpiar) btnLimpiar.addEventListener('click', function() {
        const fe = document.getElementById('adminFiltroEstado');
        const fu = document.getElementById('adminFiltroUsuario');
        const fo = document.getElementById('adminOrdenSelect');
        if (fe) fe.value = '';
        if (fu) fu.value = '';
        if (fo) fo.value = '';
        aplicarFiltrosAdmin();
    });

    // Exportar JSON
    const btnExportar = document.getElementById('adminBtnExportar');
    if (btnExportar) btnExportar.addEventListener('click', function() {
        const exportado = exportarTareasJSON(todasLasTareas);
        if (!exportado) {
            mostrarNotificacion('No hay tareas para exportar', 'advertencia');
        } else {
            mostrarNotificacion('Exportación completada', 'exito');
        }
    });

    // Búsqueda de usuario en el header del admin
    const formBusqueda = document.getElementById('adminSearchUserForm');
    if (formBusqueda) {
        formBusqueda.addEventListener('submit', async function(event) {
            event.preventDefault();
            const input   = document.getElementById('adminUserDocument');
            const termino = (input.value || '').trim().toLowerCase();
            if (!termino) return;

            const usuarios = await obtenerTodosLosUsuarios();
            if (!usuarios) {
                await mostrarNotificacion('Error al buscar usuarios', 'error');
                return;
            }

            const encontrado = usuarios.find(u =>
                u.id.toString()                         === termino ||
                (u.documento && u.documento.toString() === termino) ||
                u.name.toLowerCase().includes(termino)
            );

            if (!encontrado) {
                await mostrarNotificacion(
                    `No se encontró ningún usuario con: "${input.value.trim()}"`,
                    'advertencia'
                );
                return;
            }

            input.value = '';
            abrirModalUsuario(encontrado);
        });
    }

    // Formulario de crear tarea en la card "Crear Tarea" del panel admin
    const formCrearTarea = document.getElementById('createTaskForm');
    if (formCrearTarea) {
        formCrearTarea.addEventListener('submit', async function(event) {
            event.preventDefault();

            // Se leen los valores de los campos del formulario
            const titleInput   = document.getElementById('newTaskTitle');
            const descInput    = document.getElementById('newTaskDescription');
            const statusInput  = document.getElementById('newTaskStatus');
            const commentInput = document.getElementById('newTaskComment');
            const titleError   = document.getElementById('newTaskTitleError');
            const statusError  = document.getElementById('newTaskStatusError');

            // FEAT #57: validación con mensajes descriptivos del backend (Zod-matching)
            const titulo  = titleInput  ? titleInput.value.trim()  : '';
            const estado  = statusInput ? statusInput.value         : '';

            const validoTareaForm = await validarFormularioTarea({
                titleInput,
                statusInput,
                titleError,
                statusError,
            });
            if (!validoTareaForm) return;

            // Se obtienen los IDs de los usuarios seleccionados en el dropdown de checkboxes
            const assignedUsers = obtenerIdsSeleccionados();

            // Validación: al menos un usuario debe estar seleccionado
            if (assignedUsers.length === 0) {
                await mostrarNotificacion('Debes asignar al menos un usuario a la tarea', 'advertencia');
                return;
            }

            // Se construye el objeto de la nueva tarea para enviar al backend
            const datosTarea = {
                title:         titulo,
                description:   descInput  ? descInput.value.trim()   : '',
                status:        estado,
                comment:       commentInput ? commentInput.value.trim() : '',
                assignedUsers: assignedUsers,
            };

            // Se llama al backend para crear la tarea
            let tareaCreada;
            try {
                tareaCreada = await registrarTarea(datosTarea);
            } catch (errorCreacion) {
                // Si el backend responde 400 (Zod) se muestran los mensajes descriptivos
                if (errorCreacion.errors && errorCreacion.errors.length > 0) {
                    await mostrarNotificacion(errorCreacion.errors[0].message, 'error');
                } else {
                    await mostrarNotificacion(
                        errorCreacion.message || 'No se pudo crear la tarea',
                        'error'
                    );
                }
                return;
            }

            if (tareaCreada) {
                // Se limpia el formulario después de crear exitosamente
                formCrearTarea.reset();

                // Se limpian los checkboxes del dropdown
                const panel = document.getElementById('usuariosDropdownPanel');
                if (panel) {
                    panel.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
                        cb.checked = false;
                    });
                }
                const textoDropdown = document.getElementById('usuariosDropdownTexto');
                if (textoDropdown) textoDropdown.textContent = 'Seleccionar usuarios...';

                // Se recargan la tabla de tareas y el dashboard para reflejar la nueva tarea
                cargarTodasLasTareas();
                cargarDashboard();
                await mostrarNotificacion(`Tarea "${datosTarea.title}" creada correctamente`, 'exito');
            }
        });
    }

    // Formulario de crear tarea del instructor
    const instrCreateTaskForm = document.getElementById('instrCreateTaskForm');
    if (instrCreateTaskForm) {
        instrCreateTaskForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const titulo     = document.getElementById('instrNewTaskTitle').value.trim();
            const desc       = document.getElementById('instrNewTaskDescription').value.trim();
            const estado     = document.getElementById('instrNewTaskStatus').value;
            const comentario = document.getElementById('instrNewTaskComment').value.trim();

            // Validación: estado obligatorio
            if (!estado) {
                await mostrarNotificacion('Selecciona un estado para la tarea', 'error');
                return;
            }
            if (!titulo || titulo.length < 3) {
                await mostrarNotificacion('El título debe tener al menos 3 caracteres', 'error');
                return;
            }

            // Obtener los usuarios seleccionados en el dropdown del instructor
            const checkboxes = document.querySelectorAll('#instrUsuariosDropdownPanel input:checked');
            const usuariosSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value, 10));

            if (usuariosSeleccionados.length === 0) {
                await mostrarNotificacion('Selecciona al menos un usuario para asignar la tarea', 'error');
                return;
            }

            const datosTarea = {
                title:         titulo,
                description:   desc || undefined,
                status:        estado,
                comment:       comentario || null,
                assignedUsers: usuariosSeleccionados,
            };

            const tareaCreada = await registrarTarea(datosTarea);
            if (tareaCreada) {
                // Limpiar el formulario tras crear la tarea
                instrCreateTaskForm.reset();
                // Deseleccionar los checkboxes del dropdown
                document.querySelectorAll('#instrUsuariosDropdownPanel input').forEach(cb => { cb.checked = false; });
                const texto = document.getElementById('instrUsuariosDropdownTexto');
                if (texto) texto.textContent = 'Seleccionar usuarios...';

                cargarTareasInstructor();
                cargarDashboardInstructor();
                await mostrarNotificacion(`Tarea "${titulo}" creada correctamente`, 'exito');
            } else {
                await mostrarNotificacion('Error al crear la tarea', 'error');
            }
        });
    }

    // ── MODAL DE REGISTRO ─────────────────────────────────────────────────────────
    // Abrir el modal al hacer clic en "Regístrate aquí"
    const btnAbrirRegistro = document.getElementById('btnAbrirRegistro');
    if (btnAbrirRegistro) {
        btnAbrirRegistro.addEventListener('click', abrirModalRegistro);
    }

    // Cerrar el modal al hacer clic en el botón X
    const btnCerrarRegistro = document.getElementById('registroCloseBtn');
    if (btnCerrarRegistro) {
        btnCerrarRegistro.addEventListener('click', cerrarModalRegistro);
    }

    // Cerrar el modal al hacer clic fuera de él (en el overlay oscuro)
    const registroModal = document.getElementById('registroModal');
    if (registroModal) {
        registroModal.addEventListener('click', function(event) {
            // Solo cerrar si el clic fue directamente en el overlay, no en el modal
            if (event.target === registroModal) cerrarModalRegistro();
        });
    }

    // Submit del formulario de registro
    const formRegistro = document.getElementById('registroForm');
    if (formRegistro) {
        formRegistro.addEventListener('submit', async function(event) {
            event.preventDefault();

            // Validar los campos antes de enviar
            const esValido = await validarFormularioRegistroLocal();
            if (!esValido) return;

            const btnRegistrar = document.getElementById('btnRegistrar');
            if (btnRegistrar) { btnRegistrar.disabled = true; btnRegistrar.textContent = 'Creando cuenta...'; }

            try {
                // Enviar el registro al backend (POST /api/auth/register)
                await registrarUsuario({
                    name:      document.getElementById('registroNombre').value.trim(),
                    documento: document.getElementById('registroDocumento').value.trim(),
                    email:     document.getElementById('registroEmail').value.trim(),
                    password:  document.getElementById('registroPassword').value,
                });

                // Si el registro fue exitoso cerrar el modal y mostrar notificación
                cerrarModalRegistro();
                await mostrarNotificacion('Cuenta creada correctamente. Ya puedes iniciar sesión.', 'exito');

            } catch (error) {
                // Si el backend respondió con un error (409 email duplicado, etc.)
                await mostrarNotificacion(error.message || 'No se pudo crear la cuenta', 'error');
            } finally {
                // Siempre rehabilitar el botón, haya error o no
                if (btnRegistrar) {
                    btnRegistrar.disabled    = false;
                    btnRegistrar.textContent = 'Crear cuenta';
                }
            }
        });
    }

    // ── BÚSQUEDA DE TAREAS EN EL PANEL USUARIO ────────────────────────────────
    // El input filtra en tiempo real las filas ya pintadas en la tabla.
    // No hace peticiones al servidor — trabaja sobre el DOM directamente.
    // El id del input coincide con el que está en index.html
    const userSearchTaskInput = document.getElementById('userSearchTaskInput');
    if (userSearchTaskInput) {
        userSearchTaskInput.addEventListener('input', function() {
            const termino = this.value.trim().toLowerCase();

            // Se obtienen todas las filas del tbody del panel usuario
            const filas = document.querySelectorAll('#tasksTableBody tr');

            filas.forEach(function(fila) {
                // Se busca el término en todo el texto de la fila
                // Así se puede buscar por id, título o estado en cualquier columna
                const textoFila = fila.textContent.toLowerCase();
                fila.style.display = textoFila.includes(termino) ? '' : 'none';
            });
        });
    }

    // Prevenir que el form de búsqueda de tareas recargue la página al presionar Enter
    const userSearchTaskForm = document.getElementById('userSearchTaskForm');
    if (userSearchTaskForm) {
        userSearchTaskForm.addEventListener('submit', function(event) {
            event.preventDefault();
        });
    }

    // ── BOTONES EDITAR Y EXPORTAR DE LA TABLA DE TAREAS DEL USUARIO ──────────
    // Los botones se crean dinámicamente en tareasUI.js con data-action="edit" o "export".
    // Se usa delegación de eventos en el tbody para capturar clics aunque
    // las filas se agreguen después de registrar este listener.
    const tablaUsuario = document.getElementById('tasksTableBody');
    if (tablaUsuario) {
        tablaUsuario.addEventListener('click', async function(event) {
            // Se busca el botón más cercano al elemento clickeado
            const btn = event.target.closest('button[data-action]');
            if (!btn) return; // El clic no fue en un botón de acción

            const accion  = btn.dataset.action;
            const tareaId = btn.dataset.id;

            if (accion === 'edit') {
                // Buscar la tarea completa en el DOM para pasarla al modal
                // Se reconstruye el objeto desde las celdas de la fila
                const fila        = btn.closest('tr');
                const titulo      = fila.cells[1].textContent;
                const descripcion = fila.cells[2].textContent === '—' ? '' : fila.cells[2].textContent;
                const estado      = fila.cells[3].querySelector('.status-badge').className
                    .split(' ')
                    .find(c => c.startsWith('status-') && c !== 'status-badge')
                    ?.replace('status-', '') || '';
                const comentario  = fila.cells[4].textContent === '—' ? '' : fila.cells[4].textContent;

                // mostrarModalEdicion viene de tareasUI.js
                // soloLecturaTituloDesc=true → modo usuario: título y desc de solo lectura
                mostrarModalEdicion({
                    id:          tareaId,
                    title:       titulo,
                    description: descripcion,
                    status:      estado,
                    comment:     comentario,
                }, true);

                // Registrar el submit del modal de edición para el modo usuario
                const formularioEdicion = document.getElementById('editTaskForm');

                // Clonar el form para eliminar listeners anteriores y evitar duplicados
                const formularioClonado = formularioEdicion.cloneNode(true);
                formularioEdicion.parentNode.replaceChild(formularioClonado, formularioEdicion);

                formularioClonado.addEventListener('submit', async function(ev) {
                    ev.preventDefault();

                    const nuevoEstado   = document.getElementById('editTaskStatus').value;
                    const nuevoComentario = document.getElementById('editTaskComment')
                        ? document.getElementById('editTaskComment').value.trim()
                        : '';

                    // Solo se envía el estado y el comentario — título y desc son solo lectura
                    const { actualizarTarea } = await import('../api/tareasApi.js');
                    const tareaActualizada = await actualizarTarea(tareaId, {
                        status:  nuevoEstado,
                        comment: nuevoComentario,
                    });

                    if (tareaActualizada) {
                        // Actualizar la fila en el DOM sin recargar toda la tabla
                        const { actualizarFilaTarea } = await import('./tareasUI.js');
                        actualizarFilaTarea(tareaActualizada);
                        ocultarModalEdicion();
                        await mostrarNotificacion('Tarea actualizada correctamente', 'exito');
                    } else {
                        await mostrarNotificacion('Error al actualizar la tarea', 'error');
                    }
                });

            } else if (accion === 'export') {
                // Exportar solo esta tarea como JSON
                // Se reconstruye el objeto mínimo necesario para la exportación
                const fila = btn.closest('tr');
                const tareaExportar = {
                    id:          tareaId,
                    title:       fila.cells[1].textContent,
                    description: fila.cells[2].textContent === '—' ? '' : fila.cells[2].textContent,
                    status:      fila.cells[3].querySelector('.status-badge').textContent,
                    comment:     fila.cells[4].textContent === '—' ? '' : fila.cells[4].textContent,
                };
                // exportarTareasJSON viene de exportacion.js y descarga el archivo
                const exportado = exportarTareasJSON([tareaExportar]);
                if (exportado) {
                    await mostrarNotificacion('Tarea exportada correctamente', 'exito');
                } else {
                    await mostrarNotificacion('No se pudo exportar la tarea', 'error');
                }
            }
        });
    }

    // Al final del cuerpo de registrarEventosNavegacion():
    registrarListenerCambioPassword();
    registrarListenerOlvidoPassword();
}

// cargarDashboardUsuario — carga las estadísticas del dashboard en el panel de usuario.
// Usa IDs distintos a los del panel admin para que ambos paneles puedan coexistir
// en el DOM sin sobrescribirse mutuamente.
// Se llama desde activarModoUsuario() al entrar al panel de usuario.
async function cargarDashboardUsuario() {
    // obtenerDashboard viene de tareasApi.js y hace GET /api/tasks/dashboard
    // Retorna { total, pendientes, enProgreso, aprobacion, completadas }
    const data = await obtenerDashboard();
    if (!data) return;

    // Se mapean los IDs del DOM del panel usuario con las propiedades de la respuesta
    // Los IDs tienen el prefijo "userDash" para distinguirlos de los del panel admin
    const el = {
        total:      document.getElementById('userDashTotal'),
        pendiente:  document.getElementById('userDashPendiente'),
        progreso:   document.getElementById('userDashProgreso'),
        aprobacion: document.getElementById('userDashAprobacion'),
        completada: document.getElementById('userDashCompletada'),
    };

    // Asignar los valores solo si el elemento existe en el DOM
    if (el.total)      el.total.textContent      = data.total;
    if (el.pendiente)  el.pendiente.textContent   = data.pendientes;
    if (el.progreso)   el.progreso.textContent    = data.enProgreso;
    if (el.aprobacion) el.aprobacion.textContent  = data.aprobacion ?? 0;
    if (el.completada) el.completada.textContent  = data.completadas;
}

// registrarListenerOlvidoPassword — registra todos los eventos del flujo de recuperación.
// Se llama una sola vez desde registrarEventosNavegacion().
// El flujo tiene 3 pasos secuenciales: email → código → nueva contraseña.
function registrarListenerOlvidoPassword() {
    const modal     = document.getElementById('olvidoPasswordModal');
    const btnAbrir  = document.getElementById('btnOlvidoPassword');
    const btnCerrar = document.getElementById('olvidoPasswordClose');
    const titulo    = document.getElementById('olvidoPasswordTitulo');

    // Variable para recordar el email entre los 3 pasos
    // Se usa let porque cambia durante el flujo
    let emailRecuperacion = '';

    // Función para mostrar solo el paso indicado y ocultar los demás
    // pasoVisible: 1, 2 o 3
    function mostrarPaso(pasoVisible) {
        const titulosPasos = {
            1: 'Recuperar contraseña',
            2: 'Verificar código',
            3: 'Nueva contraseña',
        };
        if (titulo) titulo.textContent = titulosPasos[pasoVisible];

        [1, 2, 3].forEach(function(num) {
            const el = document.getElementById(`olvidoPaso${num}`);
            if (el) {
                if (num === pasoVisible) el.classList.remove('hidden');
                else el.classList.add('hidden');
            }
        });
    }

    // Función para abrir el modal en el paso 1
    function abrirModalOlvido() {
        emailRecuperacion = '';
        mostrarPaso(1);
        // Limpiar los campos del formulario del paso 1
        const emailInput = document.getElementById('olvidoEmail');
        if (emailInput) emailInput.value = '';
        const emailError = document.getElementById('olvidoEmailError');
        if (emailError) emailError.textContent = '';
        modal.classList.remove('hidden');
    }

    // Función para cerrar el modal completamente
    function cerrarModalOlvido() {
        modal.classList.add('hidden');
        emailRecuperacion = '';
    }

    // Abrir el modal al hacer clic en el enlace
    if (btnAbrir) btnAbrir.addEventListener('click', abrirModalOlvido);

    // Cerrar con el botón X
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModalOlvido);

    // Cerrar al hacer clic en el overlay
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) cerrarModalOlvido();
        });
    }

    // Botones de cancelar/volver en cada paso
    const paso1Cancelar = document.getElementById('olvidoPaso1Cancelar');
    if (paso1Cancelar) paso1Cancelar.addEventListener('click', cerrarModalOlvido);

    const paso2Volver = document.getElementById('olvidoPaso2Volver');
    if (paso2Volver) paso2Volver.addEventListener('click', function() { mostrarPaso(1); });

    const paso3Cancelar = document.getElementById('olvidoPaso3Cancelar');
    if (paso3Cancelar) paso3Cancelar.addEventListener('click', cerrarModalOlvido);

    // ── PASO 1: enviar el email ────────────────────────────────────────────────
    const formEmail = document.getElementById('olvidoEmailForm');
    if (formEmail) {
        formEmail.addEventListener('submit', async function(event) {
            event.preventDefault();

            const emailInput = document.getElementById('olvidoEmail');
            const emailError = document.getElementById('olvidoEmailError');
            const valor      = emailInput.value.trim();

            // Validar formato de email con regex básica
            const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!valor || !formatoEmail.test(valor)) {
                emailError.textContent = 'Ingresa un correo electrónico válido';
                return;
            }
            emailError.textContent = '';

            // Llamar al endpoint forgot-password
            const resultado = await forgotPassword(valor);

            if (resultado === true) {
                // Guardar el email para usarlo en los siguientes pasos
                emailRecuperacion = valor;
                mostrarPaso(2);
                // Limpiar el campo de código
                const codigoInput = document.getElementById('olvidoCodigo');
                if (codigoInput) codigoInput.value = '';
            } else {
                await mostrarNotificacion(resultado.error || 'Error al enviar el correo', 'error');
            }
        });
    }

    // ── PASO 2: verificar el código ───────────────────────────────────────────
    const formCodigo = document.getElementById('olvidoCodigoForm');
    if (formCodigo) {
        formCodigo.addEventListener('submit', async function(event) {
            event.preventDefault();

            const codigoInput = document.getElementById('olvidoCodigo');
            const codigoError = document.getElementById('olvidoCodigoError');
            const valor       = codigoInput.value.trim();

            // Validar que sean exactamente 6 dígitos numéricos
            if (!valor || !/^\d{6}$/.test(valor)) {
                codigoError.textContent = 'El código debe tener exactamente 6 dígitos numéricos';
                return;
            }
            codigoError.textContent = '';

            const resultado = await verifyResetCode(emailRecuperacion, valor);

            if (resultado === true) {
                mostrarPaso(3);
                // Limpiar los campos de contraseña
                const nuevaInput     = document.getElementById('olvidoNuevaPassword');
                const confirmarInput = document.getElementById('olvidoConfirmarPassword');
                if (nuevaInput)     nuevaInput.value     = '';
                if (confirmarInput) confirmarInput.value = '';
            } else {
                await mostrarNotificacion(resultado.error || 'Código incorrecto o expirado', 'error');
            }
        });
    }

    // ── PASO 3: cambiar la contraseña ─────────────────────────────────────────
    const formNuevaPassword = document.getElementById('olvidoNuevaPasswordForm');
    if (formNuevaPassword) {
        formNuevaPassword.addEventListener('submit', async function(event) {
            event.preventDefault();

            const nuevaInput      = document.getElementById('olvidoNuevaPassword');
            const confirmarInput  = document.getElementById('olvidoConfirmarPassword');
            const nuevaError      = document.getElementById('olvidoNuevaPasswordError');
            const confirmarError  = document.getElementById('olvidoConfirmarPasswordError');
            const nueva           = nuevaInput.value;
            const confirmar       = confirmarInput.value;

            let esValido = true;
            nuevaError.textContent    = '';
            confirmarError.textContent = '';

            if (!nueva || nueva.length < 6) {
                nuevaError.textContent = 'La contraseña debe tener al menos 6 caracteres';
                esValido = false;
            }
            if (nueva !== confirmar) {
                confirmarError.textContent = 'Las contraseñas no coinciden';
                esValido = false;
            }
            if (!esValido) return;

            const resultado = await resetPassword(emailRecuperacion, nueva);

            if (resultado === true) {
                cerrarModalOlvido();
                await mostrarNotificacion('Contraseña restablecida correctamente. Ya puedes iniciar sesión.', 'exito');
            } else {
                await mostrarNotificacion(resultado.error || 'Error al restablecer la contraseña', 'error');
            }
        });
    }
}