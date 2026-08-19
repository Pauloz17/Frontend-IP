// MÓDULO: ui/modoUI.js
// EL DIRECTOR DE ORQUESTA: Solo dice quién sale al escenario y quién se esconde.

import { obtenerTareasDeUsuario, obtenerDashboard } from '../api/tareasApi.js';
import { obtenerUsuarioSesion, cerrarSesion } from '../utils/sesion.js';
import { agregarTareaATabla, renderizarDashboard } from './tareasUI.js';
import { inicializarAuthEvents, limpiarFormularioLogin, abrirModalRegistro } from './authUI.js';
import { activarModoAdmin, inicializarAdminUI, registrarCardsContraibles, abrirModalRolesPorId } from './adminUI.js';
import { activarModoInstructor, inicializarInstructorUI } from './instructorUI.js';
import { mostrarConfirmacion } from '../utils/notificaciones.js';

// Función mágica para buscar elementos por su nombre (ID)
const $ = id => document.getElementById(id);

// Apaga todas las pantallas para dejar la mesa limpia
export function ocultarTodo() {
    ['pantallaInicio', 'vistaUsuario', 'vistaAdmin', 'vistaInstructor'].forEach(id => {
        const el = $(id);
        if (el) el.classList.add('hidden');
    });
}
// Cambia la dirección que ves arriba en el navegador
// El router es el dueño de la URL. Esta función solo conserva compatibilidad
// con llamadas directas sin volver a usar rutas de servidor.
const _actualizarPath = p => {
    if (window.location.hash !== `#${p}`) {
        window.history.replaceState({}, '', `#${p}`);
    }
};

// Muestra la pantalla de bienvenida (donde pones tu clave)
export function activarModoInicio() {
    ocultarTodo();
    $('pantallaInicio').classList.remove('hidden');
    document.body.dataset.modo = 'inicio';
    _actualizarPath('/login');
    limpiarFormularioLogin();
}

// Muestra la pantalla del alumno/usuario
export async function activarModoUsuario() {
    ocultarTodo();
    $('vistaUsuario').classList.remove('hidden');
    _actualizarPath('/usuario');
    
    const user = obtenerUsuarioSesion();
    if (!user) return activarModoInicio();
    
    // Pone tu nombre y documento en la pantalla
    $('userId').textContent = user.documento || user.id;
    $('userName').textContent = user.name;

    // Busca tus tareas y las pone en la tabla
    const tareas = await obtenerTareasDeUsuario(user.id);
    const tbody = $('tasksTableBody');
    while(tbody.firstChild) tbody.removeChild(tbody.firstChild);
    
    tareas.forEach((t, i) => agregarTareaATabla(t, i));
    
    // Actualiza los cuadritos con números de arriba
    const stats = await obtenerDashboard();
    renderizarDashboard(stats, 'userDash');
}

// Conecta todos los cables (botones) para que la app funcione
export function registrarEventosNavegacion() {
    inicializarAuthEvents();
    inicializarAdminUI();
    inicializarInstructorUI();
    registrarCardsContraibles();
    
    // Prepara los botones de "Salir"
    ['btnLogoutUsuario', 'btnLogoutAdmin', 'btnLogoutInstructor'].forEach(id => {
        const btn = $(id);
        if (btn) btn.onclick = manejarCerrarSesion;
    });

    // Prepara los botones de "Perfil" (ícono de persona) — abren el modal de cambio de contraseña
    ['btnPerfilUsuario', 'btnPerfilAdmin', 'btnPerfilInstructor'].forEach(id => {
        const btn = $(id);
        if (btn) btn.onclick = abrirModalPassword;
    });

    // Abre la ventana de registro si haces clic en el botón
    const btnAbrirRegistro = $('btnAbrirRegistro');
    if (btnAbrirRegistro) btnAbrirRegistro.onclick = abrirModalRegistro;
}

// Pregunta si de verdad quieres salir y cierra la puerta
async function manejarCerrarSesion() {
    if (await mostrarConfirmacion('¿Cerrar sesión?', 'Volverás al inicio', 'Sí')) {
        cerrarSesion();
        activarModoInicio();
    }
}

// ── MODAL DE CAMBIO DE CONTRASEÑA ─────────────────────────────────────────
// Abre el modal #cambioPasswordModal. Lo usa el botón de perfil (persona)
// y también el router cuando la URL es /admin/cambiar-password (etc.)
export function abrirModalPassword() {
    const modal = $('cambioPasswordModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');

    const cerrarModal = () => {
        modal.classList.add('hidden');
    };

    const btnClose = $('cambioPasswordClose');
    const btnCancelar = $('cambioPasswordCancelar');
    
    if (btnClose) btnClose.onclick = cerrarModal;
    if (btnCancelar) btnCancelar.onclick = cerrarModal;
}

// Re-export para que el router pueda acceder vía import dinámico de modoUI
export { abrirModalRolesPorId };
