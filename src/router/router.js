// MÓDULO: router/router.js
// CAPA:   Router
//
// Enrutador SPA basado en PATHS reales (history.pushState/popstate).
// Las URLs son como las de cualquier app web:
//
//   /login                              → pantalla de inicio
//   /registro                           → modal de registro sobre login
//   /recuperar-password                 → modal recuperar contraseña
//   /admin                              → panel admin
//   /admin/cambiar-password             → modal cambiar contraseña
//   /admin/crear-tarea                  → card de crear tarea expandida
//   /admin/tareas/:id/editar            → modal editar tarea
//   /admin/usuarios/:id/roles           → modal gestionar roles
//   /admin/usuarios/:id/tareas          → modal ver/asignar tareas
//   /usuario                            → panel usuario
//   /usuario/cambiar-password           → modal cambiar contraseña
//   /usuario/tareas/:id/editar          → modal editar tarea (usuario)
//   /instructor                         → panel instructor
//   /instructor/cambiar-password        → modal cambiar contraseña
//   /instructor/crear-tarea             → card de crear tarea expandida
//   /instructor/tareas/:id/editar       → modal editar tarea
//   /instructor/usuarios/:id/tareas     → modal ver/asignar tareas
//
// Para que el refresh funcione en producción, el servidor debe servir
// index.html para cualquier ruta (SPA fallback). Vite lo hace en dev.
// Para `serve` en build: `serve dist -s`.

import { haySesionActiva, obtenerRoles } from '../utils/sesion.js';

// Vistas-intermediarias (cada una llama a su activarModoX)
import * as HomeView from '../ui/home.js';
import * as LoginView from '../ui/login.js';
import * as AdminView from '../ui/admin.js';
import * as UsuarioView from '../ui/usuario.js';
import * as InstructorView from '../ui/instructor.js';

// ── INTENCIÓN PENDIENTE ──────────────────────────────────────────────────────
// Cuando un usuario sin sesión intenta entrar a una URL protegida (ej.
// /admin/usuarios/45/roles), guardamos esa ruta acá. Después de un login
// exitoso, redirigimos ahí en lugar de al panel base, respetando la intención
// original del link. Si nadie la consume queda en null.
let _rutaPendiente = null;

export function tomarRutaPendiente() {
    const r = _rutaPendiente;
    _rutaPendiente = null;
    return r;
}

function _esRutaProtegida(path) {
    return path !== '/' && path !== '/login' && path !== '/registro' && path !== '/recuperar-password';
}

// ── HELPERS DE ROLES ─────────────────────────────────────────────────────────

function rolPrincipal() {
    const roles = obtenerRoles();
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('instructor')) return 'instructor';
    if (roles.includes('user')) return 'user';
    return null;
}

// Importación tardía (lazy) para evitar dependencia circular con modoUI.
// Las funciones se resuelven en runtime cuando ya están todos los módulos
// evaluados, no en tiempo de carga.
async function _abrirModalPorRuta(rutaModal, params) {
    const mod = await import('../ui/modoUI.js');
    if (rutaModal === 'cambiar-password' && typeof mod.abrirModalPassword === 'function') {
        mod.abrirModalPassword();
    } else if (rutaModal === 'crear-tarea' && typeof mod.expandirCardCrearTarea === 'function') {
        mod.expandirCardCrearTarea();
    } else if (rutaModal === 'tarea-editar' && typeof mod.abrirModalEditarTareaPorId === 'function') {
        mod.abrirModalEditarTareaPorId(params.id);
    } else if (rutaModal === 'usuario-roles' && typeof mod.abrirModalRolesPorId === 'function') {
        mod.abrirModalRolesPorId(params.id);
    } else if (rutaModal === 'usuario-tareas' && typeof mod.abrirModalUsuarioPorId === 'function') {
        mod.abrirModalUsuarioPorId(params.id);
    }
}

// ── PARSEO DE RUTAS CON PARÁMETROS ───────────────────────────────────────────
// Las rutas con :id se reconocen con un patrón simple. Devuelve null si no
// matchea, o { panel, accion, params } si sí.
function _parsearRuta(path) {
    // Normalizar: quitar slash final excepto en raíz
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);

    // Sin sub-ruta
    const sinSub = {
        '/': { panel: 'raiz', accion: null },
        '/login': { panel: 'login', accion: null },
        '/registro': { panel: 'login', accion: 'registro' },
        '/recuperar-password': { panel: 'login', accion: 'recuperar-password' },
        '/admin': { panel: 'admin', accion: null },
        '/usuario': { panel: 'usuario', accion: null },
        '/instructor': { panel: 'instructor', accion: null },
    };
    if (sinSub[path]) return { ...sinSub[path], params: {} };

    // Sub-rutas con parámetros — uso regex simple
    const patrones = [
        { re: /^\/admin\/cambiar-password$/, panel: 'admin', accion: 'cambiar-password' },
        { re: /^\/admin\/crear-tarea$/, panel: 'admin', accion: 'crear-tarea' },
        { re: /^\/admin\/tareas\/(\d+)\/editar$/, panel: 'admin', accion: 'tarea-editar', paramName: 'id' },
        { re: /^\/admin\/usuarios\/(\d+)\/roles$/, panel: 'admin', accion: 'usuario-roles', paramName: 'id' },
        { re: /^\/admin\/usuarios\/(\d+)\/tareas$/, panel: 'admin', accion: 'usuario-tareas', paramName: 'id' },
        { re: /^\/usuario\/cambiar-password$/, panel: 'usuario', accion: 'cambiar-password' },
        { re: /^\/usuario\/tareas\/(\d+)\/editar$/, panel: 'usuario', accion: 'tarea-editar', paramName: 'id' },
        { re: /^\/instructor\/cambiar-password$/, panel: 'instructor', accion: 'cambiar-password' },
        { re: /^\/instructor\/crear-tarea$/, panel: 'instructor', accion: 'crear-tarea' },
        { re: /^\/instructor\/tareas\/(\d+)\/editar$/, panel: 'instructor', accion: 'tarea-editar', paramName: 'id' },
        { re: /^\/instructor\/usuarios\/(\d+)\/tareas$/, panel: 'instructor', accion: 'usuario-tareas', paramName: 'id' },
    ];

    for (const p of patrones) {
        const m = path.match(p.re);
        if (m) {
            const params = p.paramName ? { [p.paramName]: m[1] } : {};
            return { panel: p.panel, accion: p.accion, params };
        }
    }
    return null;
}

// ── RENDER DE PANEL ──────────────────────────────────────────────────────────
function _renderPanel(panel) {
    switch (panel) {
        case 'login': LoginView.render(); return;
        case 'admin': AdminView.render(); return;
        case 'usuario': UsuarioView.render(); return;
        case 'instructor': InstructorView.render(); return;
        case 'raiz': HomeView.render(); return;
    }
}

// ── API PÚBLICA ──────────────────────────────────────────────────────────────

// Cambia la URL y renderiza la nueva vista. Usa pushState para que
// quede en el historial (el usuario puede volver atrás).
export function navigate(path) {
    if (_obtenerRutaHash() === path) {
        renderRoute(path);
        return;
    }
    window.location.hash = `#${path}`;
}

// Reemplaza la URL sin agregar al historial. Útil cuando el código sincroniza
// la URL después de abrir una vista (no queremos que el botón "atrás" vuelva
// a un estado anterior duplicado).
export function reemplazarUrl(path) {
    if (_obtenerRutaHash() === path) return;
    window.history.replaceState({}, '', `#${path}`);
}

// El hash no llega al servidor: #/admin se puede recargar sin rutas especiales.
function _obtenerRutaHash() {
    const hash = window.location.hash.replace(/^#/, '');
    return hash.startsWith('/') ? hash : '/';
}

// Render principal: parsea la ruta, valida permisos, muestra el panel
// correspondiente y abre el modal de la sub-ruta si lo hay.
export async function renderRoute(rawPath) {
    const path = rawPath || _obtenerRutaHash();
    const parsed = _parsearRuta(path);

    // Ruta no reconocida → al raíz
    if (!parsed) {
        navigate('/');
        return;
    }

    // ── Bloque de seguridad ──────────────────────────────────────────────────
    // Si la ruta es protegida y no hay sesión: guardamos la ruta como pendiente
    // y mandamos al login. Después de loguear, el handler del login consume la
    // ruta pendiente con tomarRutaPendiente().
    if (_esRutaProtegida(path) && !haySesionActiva()) {
        _rutaPendiente = path;
        navigate('/login');
        return;
    }

    // ── Render del panel (si no es el modo actual) ───────────────────────────
    if (parsed.panel === 'raiz') {
        // raíz: redirige según sesión
        if (!haySesionActiva()) { navigate('/login'); return; }
        const r = rolPrincipal();
        if (r === 'admin') { navigate('/admin'); return; }
        if (r === 'instructor') { navigate('/instructor'); return; }
        if (r === 'user') { navigate('/usuario'); return; }
        navigate('/login');
        return;
    }

    // Validar rol para paneles protegidos
    if (parsed.panel === 'admin' && !obtenerRoles().includes('admin')) {
        _rutaPendiente = null;
        navigate('/login');
        return;
    }
    if (parsed.panel === 'usuario' && !obtenerRoles().includes('user')) {
        _rutaPendiente = null;
        navigate('/login');
        return;
    }
    if (parsed.panel === 'instructor' && !obtenerRoles().includes('instructor')) {
        _rutaPendiente = null;
        navigate('/login');
        return;
    }

    // Render del panel solo si no estamos ya en él (evita doble carga)
    const modoEsperado = parsed.panel === 'login' ? 'inicio' : parsed.panel;
    if (document.body.dataset.modo !== modoEsperado) {
        _renderPanel(parsed.panel);
        const { registrarEventosNavegacion } = await import('../ui/modoUI.js');
        registrarEventosNavegacion();
    }

    // ── Render del modal/acción de la sub-ruta ───────────────────────────────
    if (parsed.accion) {
        // Esperar un tick para que el panel termine de montar el DOM antes
        // de abrir el modal, especialmente cuando venimos de un panel distinto.
        setTimeout(() => _abrirModalPorRuta(parsed.accion, parsed.params), 0);
    }
}

// ── LISTENER DE POPSTATE (botones atrás/adelante del navegador) ──────────────
window.addEventListener('hashchange', () => renderRoute(_obtenerRutaHash()));
