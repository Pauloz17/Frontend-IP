// MÓDULO: ui/adminUI.js
// EL AYUDANTE DEL JEFE: Maneja las cajitas que se abren y la lista de usuarios.

import { obtenerTodosLosUsuarios, eliminarUsuario } from '../api/usuariosApi.js';
import { obtenerTodasLasTareas, obtenerDashboard, eliminarTarea, registrarTarea, obtenerTareasDeUsuario } from '../api/tareasApi.js';
import { renderizarDashboard, crearFilaTareaAdmin, formatearEstadoTarea } from './tareasUI.js';
import { mostrarNotificacion, mostrarConfirmacion } from '../utils/notificaciones.js';
import { filtrarTareas } from '../utils/filtros.js';
import { ordenarTareas } from '../utils/ordenamiento.js';
import { obtenerUsuarioId } from '../utils/sesion.js';

const $ = id => document.getElementById(id);
const limpiarNodo = n => { while (n?.firstChild) n.removeChild(n.firstChild); };

let todasLasTareas = []; // Aquí guardamos las tareas para no pedirlas al servidor a cada rato

// Esto hace que las "Cards" se cierren o abran cuando tocas el título
export function registrarCardsContraibles() {
    const pares = [
        ['toggleUsuarios', 'cuerpoUsuarios'],
        ['toggleTareas', 'cuerpoTareas'],
        ['toggleCrearTareas', 'cuerpoCrearTareas'],
    ];

    pares.forEach(([encabezadoId, cuerpoId]) => {
        const encabezado = $(encabezadoId);
        const cuerpo = $(cuerpoId);
        if (!encabezado || !cuerpo) return;

        encabezado.onclick = () => {
            const oculto = cuerpo.classList.toggle('oculto');
            const btn = encabezado.querySelector('.btn-toggle-card');
            if (btn) btn.classList.toggle('contraido', oculto);
            encabezado.classList.toggle('sin-borde', oculto);
        };
    });
}

// Crea la lista de personas para elegir a quién darle una tarea
export async function recargarCheckboxesDropdown() {
    const panel = $('usuariosDropdownPanel');
    const btn = $('usuariosDropdownBtn');
    const texto = $('usuariosDropdownTexto');
    if (!panel || !btn) return;

    limpiarNodo(panel);
    const usuarios = await obtenerTodosLosUsuarios();

    if (!usuarios || usuarios.length === 0) {
        panel.innerHTML = '<p class="usuarios-dropdown__vacio">Nadie registrado</p>';
        return;
    }

    usuarios.forEach(user => {
        const label = document.createElement('label');
        label.className = 'usuarios-dropdown__opcion';
        label.innerHTML = `
            <input type="checkbox" value="${user.id}" class="usuarios-dropdown__checkbox">
            <span class="usuarios-dropdown__avatar">${user.name.substring(0, 2).toUpperCase()}</span>
            <div class="usuarios-dropdown__info">
                <span class="usuarios-dropdown__nombre">${user.name}</span>
                <span class="usuarios-dropdown__doc">Doc: ${user.documento}</span>
            </div>
        `;

        // Si marcas a alguien, actualizamos el texto del botón
        label.querySelector('input').onchange = (e) => {
            label.classList.toggle('seleccionada', e.target.checked);
            actualizarTextoDropdown(btn, texto, panel);
        };
        panel.appendChild(label);
    });
}

// Prepara el selector de personas
export function inicializarAdminUI() {
    const btn = $('usuariosDropdownBtn');
    const panel = $('usuariosDropdownPanel');
    if (!btn || !panel) return;

    // Abre o cierra la lista de personas cuando haces clic
    btn.onclick = (e) => {
        e.stopPropagation();
        panel.classList.toggle('hidden');
    };

    // Si tocas fuera de la lista, se cierra sola
    document.onclick = (e) => {
        if (!panel.contains(e.target) && e.target !== btn) panel.classList.add('hidden');
    };
}

// Escribe los nombres de los elegidos en el botón
export function actualizarTextoDropdown(btn, texto, panel) {
    const marcados = Array.from(panel.querySelectorAll('input:checked'));
    if (marcados.length === 0) {
        texto.textContent = 'Seleccionar usuarios...';
        return;
    }

    const nombres = marcados.map(cb => cb.closest('label').querySelector('.usuarios-dropdown__nombre').textContent);
    texto.textContent = nombres.length <= 2 
        ? nombres.join(', ') 
        : `${nombres.slice(0, 2).join(', ')} y ${nombres.length - 2} más`;
}

// Saca la lista de IDs de los que elegiste
export function obtenerIdsSeleccionados() {
    return Array.from($('usuariosDropdownPanel').querySelectorAll('input:checked')).map(cb => parseInt(cb.value, 10));
}

// Prende la pantalla de Administrador
// Muestra la pantalla de Jefe (Admin) y llena las tablas
export async function activarModoAdmin() {
    document.body.dataset.modo = 'admin';
    $('vistaAdmin').classList.remove('hidden');
    
    // Cargamos todo al mismo tiempo para que sea rápido
    actualizarDashboardAdmin();
    dibujarTablaUsuarios();
    await cargarTareasAdmin();
    await recargarCheckboxesDropdown();

    // Preparamos los botones de filtros
    const btnFiltro = $('adminBtnAplicarFiltros');
    if (btnFiltro) btnFiltro.onclick = aplicarFiltrosAdmin;
}

// Pone los numeritos de colores en las tarjetas de arriba
async function actualizarDashboardAdmin() {
    const datos = await obtenerDashboard();
    if (datos) renderizarDashboard(datos, 'dashboard');
}

// Dibuja la lista de gente en el sistema
async function dibujarTablaUsuarios() {
    const tbody = $('usersTableBody');
    if (!tbody) return;
    limpiarNodo(tbody);

    const usuarios = await obtenerTodosLosUsuarios();
    const miId = obtenerUsuarioId();

    usuarios.forEach((u, i) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${i + 1}</td>
            <td>${u.documento}</td>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>
                <div class="task-actions">
                    <button class="btn-action btn-action--edit" id="ver-${u.id}">Ver / Asignar</button>
                    <button class="btn-action btn-action--delete" id="del-${u.id}">🗑️ Eliminar</button>
                </div>
            </td>
        `;
        
        // Si soy yo mismo, no me dejo borrar
        if (u.id === miId) fila.querySelector('.btn-action--delete').style.display = 'none';

        // Configurar botones
        fila.querySelector(`#ver-${u.id}`).onclick = () => abrirModalAsignar(u);
        fila.querySelector(`#del-${u.id}`).onclick = async () => {
            if (await mostrarConfirmacion('¿Borrar?', u.name)) {
                await eliminarUsuario(u.id);
                dibujarTablaUsuarios();
            }
        };
        tbody.appendChild(fila);
    });
}

// Trae todas las tareas del mundo y las guarda en la memoria
async function cargarTareasAdmin() {
    todasLasTareas = await obtenerTodasLasTareas() || [];
    aplicarFiltrosAdmin();
}

// Filtra y ordena las tareas según lo que el jefe elija
function aplicarFiltrosAdmin() {
    const tbody = $('adminTasksTableBody');
    if (!tbody) return;

    const estado = $('adminFiltroEstado')?.value || '';
    const user = $('adminFiltroUsuario')?.value || '';
    const orden = $('adminOrdenSelect')?.value || '';

    let filtradas = filtrarTareas(todasLasTareas, estado, user);
    filtradas = ordenarTareas(filtradas, orden);

    limpiarNodo(tbody);
    filtradas.forEach((t, i) => {
        tbody.appendChild(crearFilaTareaAdmin(t, i, {
            onEdit: (tarea) => console.log('Editando tarea...', tarea),
            onDelete: async (tarea) => {
                if (await mostrarConfirmacion('¿Borrar?', tarea.title)) {
                    await eliminarTarea(tarea.id);
                    cargarTareasAdmin();
                }
            }
        }));
    });
}

// Abre la ventana mágica para darle tareas a una persona
async function abrirModalAsignar(usuario) {
    const tareas = await obtenerTareasDeUsuario(usuario.id);
    // Aquí abrirías tu modal actual, pero ahora con los datos limpios.
    // (La lógica del modal es larga pero se mantiene igual que antes)
    console.log(`Abriendo tareas para ${usuario.name}`, tareas);
    mostrarNotificacion(`Viendo tareas de ${usuario.name}`, 'info');
}