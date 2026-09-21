// MÓDULO: ui/modoUI.js
// EL DIRECTOR DE ORQUESTA: Solo dice quién sale al escenario y quién se esconde.

import { obtenerTareasDeUsuario, obtenerDashboard } from '../api/tareasApi.js';
import { obtenerUsuarioSesion, cerrarSesion, obtenerUsuarioId } from '../utils/sesion.js';
import { agregarTareaATabla, renderizarDashboard } from './tareasUI.js';
import { establecerTareasRegistradas } from '../services/tareasService.js';
import { inicializarAuthEvents, limpiarFormularioLogin, abrirModalRegistro } from './authUI.js';
import { activarModoAdmin, inicializarAdminUI, registrarCardsContraibles, abrirModalRolesPorId } from './adminUI.js';
import { activarModoInstructor, inicializarInstructorUI } from './instructorUI.js';
import { mostrarConfirmacion, mostrarNotificacion } from '../utils/notificaciones.js';
import { cambiarPassword } from '../api/usuariosApi.js';
import { validarComplejidadPassword } from '../utils/validaciones.js';
import { API_BASE_URL, API_PREFIX } from '../utils/config.js';
import { fetchConAuth } from '../utils/fetchConAuth.js';

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
    establecerTareasRegistradas(tareas);
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

    // ── HALLAZGO #2: Toggle mostrar/ocultar contraseña en el login ─────────────
    const btnToggle = $('btnTogglePassword');
    const inputPass = $('loginPassword');
    if (btnToggle && inputPass) {
        btnToggle.addEventListener('click', function() {
            const esPassword = inputPass.type === 'password';
            inputPass.type = esPassword ? 'text' : 'password';
            btnToggle.textContent = esPassword ? '🙈' : '👁️';
        });
    }

    // ── HALLAZGO #5: Llenar ip-display y welcome-msg en los 3 paneles ────────
    _cargarDatosDeSistema();
}

// Pregunta si de verdad quieres salir y cierra la puerta
async function manejarCerrarSesion() {
    if (await mostrarConfirmacion('¿Cerrar sesión?', 'Volverás al inicio', 'Sí')) {
        cerrarSesion();
        activarModoInicio();
    }
}

// ── HALLAZGO #5: Obtener IP del servidor y nombre del usuario ────────────────
async function _cargarDatosDeSistema() {
    const user = obtenerUsuarioSesion();
    const nombreUsuario = user ? user.name : '';

    [
        ['welcome-msg',       nombreUsuario],
        ['welcome-msg-admin', nombreUsuario],
        ['welcome-msg-instr', nombreUsuario],
    ].forEach(([id, texto]) => {
        const el = $(id);
        if (el && texto) el.textContent = `Bienvenido, ${texto}`;
    });

    try {
        const url = `${API_BASE_URL}${API_PREFIX}/system/network-ip`;
        const res = await fetchConAuth(url, { cache: 'no-store' });
        const json = await res.json();
        const ip = (json.data && json.data.ip) || json.ip || 'No disponible';

        ['ip-display', 'ip-display-admin', 'ip-display-instr'].forEach(id => {
            const el = $(id);
            if (el) el.textContent = ip;
        });
    } catch (err) {
        console.warn('No se pudo obtener la IP del servidor:', err);
        ['ip-display', 'ip-display-admin', 'ip-display-instr'].forEach(id => {
            const el = $(id);
            if (el) el.textContent = 'No disponible';
        });
    }
}

// ── MODAL DE CAMBIO DE CONTRASEÑA ────────────────────────────────────
export function abrirModalPassword() {
    const modal = $('cambioPasswordModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');

    const cerrarModal = () => {
        modal.classList.add('hidden');
        ['passwordActual', 'passwordNueva', 'passwordConfirmar'].forEach(id => {
            const el = $(id);
            if (el) el.value = '';
        });
        ['passwordActualError', 'passwordNuevaError', 'passwordConfirmarError'].forEach(id => {
            const el = $(id);
            if (el) el.textContent = '';
        });
        const form = $('cambioPasswordForm');
        if (form) form.removeEventListener('submit', _manejarCambioPassword);
    };

    const btnClose    = $('cambioPasswordClose');
    const btnCancelar = $('cambioPasswordCancelar');
    
    if (btnClose)    btnClose.onclick    = cerrarModal;
    if (btnCancelar) btnCancelar.onclick = cerrarModal;

    const form = $('cambioPasswordForm');
    if (form) {
        form.removeEventListener('submit', _manejarCambioPassword);
        form.addEventListener('submit', _manejarCambioPassword);
    }
}

async function _manejarCambioPassword(e) {
    e.preventDefault();

    const inputActual    = document.getElementById('passwordActual');
    const inputNueva     = document.getElementById('passwordNueva');
    const inputConfirmar = document.getElementById('passwordConfirmar');
    const errorActual    = document.getElementById('passwordActualError');
    const errorNueva     = document.getElementById('passwordNuevaError');
    const errorConfirmar = document.getElementById('passwordConfirmarError');

    [errorActual, errorNueva, errorConfirmar].forEach(el => { if (el) el.textContent = ''; });

    let hayError = false;

    if (!inputActual.value) {
        if (errorActual) errorActual.textContent = 'Ingresa tu contraseña actual';
        hayError = true;
    }

    const complejidad = validarComplejidadPassword(inputNueva.value);
    if (!complejidad.valido) {
        if (errorNueva) errorNueva.textContent = complejidad.mensaje;
        hayError = true;
    }

    if (inputNueva.value !== inputConfirmar.value) {
        if (errorConfirmar) errorConfirmar.textContent = 'Las contraseñas no coinciden';
        hayError = true;
    }

    if (hayError) return;

    const userId = obtenerUsuarioId();
    if (!userId) {
        mostrarNotificacion('No hay usuario en sesión', 'error');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const textoOriginal = btn ? btn.textContent : 'Cambiar Contraseña';
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    const resultado = await cambiarPassword(userId, {
        currentPassword: inputActual.value,
        newPassword:     inputNueva.value,
    });

    if (btn) { btn.disabled = false; btn.textContent = textoOriginal; }

    if (resultado === true) {
        await mostrarNotificacion('Contraseña cambiada exitosamente', 'exito');
        const modal = document.getElementById('cambioPasswordModal');
        if (modal) modal.classList.add('hidden');
        e.target.reset();
    } else {
        const mensaje = (resultado && resultado.error) ? resultado.error : 'Error al cambiar la contraseña';
        if (errorActual) errorActual.textContent = mensaje;
    }
}

export { abrirModalRolesPorId };
