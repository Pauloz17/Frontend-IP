// src/router/router.js
// Enrutador SPA adaptado a la arquitectura de show/hide existente.

import { haySesionActiva, obtenerUsuarioSesion } from '../utils/sesion.js';
import { mostrarEstadoVacio } from '../ui/tareasUI.js';

// Importación de las nuevas vistas (intermediarios)
import * as HomeView from '../ui/home.js'; // Referenciado como HomeView para consistencia
import * as LoginView from '../ui/login.js';
import * as AdminView from '../ui/admin.js';
import * as UsuarioView from '../ui/usuario.js';
import * as InstructorView from '../ui/instructor.js';

// ── Handlers por ruta ────────────────────────────────────────────────────────

function renderLogin() {
    LoginView.render();
}

function renderAdmin() {
    if (!haySesionActiva()) { navigate('/login'); return; }
    const usuario = obtenerUsuarioSesion();
    if (usuario?.role !== 'admin') { navigate('/login'); return; }
    AdminView.render();
}

function renderUsuario() {
    if (!haySesionActiva()) { navigate('/login'); return; }
    const usuario = obtenerUsuarioSesion();
    if (usuario?.role !== 'user') { navigate('/login'); return; }
    UsuarioView.render();
}

function renderInstructor() {
    if (!haySesionActiva()) { navigate('/login'); return; }
    const usuario = obtenerUsuarioSesion();
    if (usuario?.role !== 'instructor') { navigate('/login'); return; }
    InstructorView.render();
}

// Ruta raíz: redirige según el rol guardado en sesión
function renderRaiz() {
    if (!haySesionActiva()) { 
        HomeView.render(); 
        return; 
    }

    const usuario = obtenerUsuarioSesion();
    if (usuario?.role === 'admin') AdminView.render();
    else if (usuario?.role === 'instructor') InstructorView.render();
    else if (usuario?.role === 'user') { 
        UsuarioView.render(); 
        mostrarEstadoVacio(); 
    } else {
        HomeView.render();
    }
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
