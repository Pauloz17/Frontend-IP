// src/router/router.js
// Enrutador SPA adaptado a la arquitectura de show/hide existente.
// No inyecta HTML dinámico — llama a las funciones activarModo* de modoUI.js.

import { haySesionActiva, obtenerUsuarioSesion } from '../utils/sesion.js';
import {
    activarModoInicio,
    activarModoAdmin,
    activarModoUsuario,
    activarModoInstructor,
} from '../ui/modoUI.js';
import { mostrarEstadoVacio } from '../ui/tareasUI.js';

// ── Handlers por ruta ────────────────────────────────────────────────────────

function renderLogin() {
    activarModoInicio();
}

function renderAdmin() {
    if (!haySesionActiva()) { navigate('/login'); return; }
    const usuario = obtenerUsuarioSesion();
    if (usuario?.role !== 'admin') { navigate('/login'); return; }
    activarModoAdmin();
}

function renderUsuario() {
    if (!haySesionActiva()) { navigate('/login'); return; }
    const usuario = obtenerUsuarioSesion();
    if (usuario?.role !== 'user') { navigate('/login'); return; }
    activarModoUsuario();
    mostrarEstadoVacio();
}

function renderInstructor() {
    if (!haySesionActiva()) { navigate('/login'); return; }
    const usuario = obtenerUsuarioSesion();
    if (usuario?.role !== 'instructor') { navigate('/login'); return; }
    activarModoInstructor();
}

// Ruta raíz: redirige según el rol guardado en sesión
function renderRaiz() {
    if (!haySesionActiva()) { activarModoInicio(); return; }
    const usuario = obtenerUsuarioSesion();
    if      (usuario?.role === 'admin')       activarModoAdmin();
    else if (usuario?.role === 'instructor')  activarModoInstructor();
    else if (usuario?.role === 'user')        { activarModoUsuario(); mostrarEstadoVacio(); }
    else                                       activarModoInicio();
}

// ── Tabla de rutas ───────────────────────────────────────────────────────────

const rutas = {
    '/':           renderRaiz,
    '/login':      renderLogin,
    '/admin':      renderAdmin,
    '/usuario':    renderUsuario,
    '/instructor': renderInstructor,
};

// ── API pública ──────────────────────────────────────────────────────────────

export function navigate(path) {
    window.history.pushState({}, '', path);
    renderRoute(path);
}

export function renderRoute(path) {
    const handler = rutas[path] ?? rutas['/'];
    handler();
}

// Botones atrás / adelante del navegador
window.addEventListener('popstate', () => renderRoute(window.location.pathname));
