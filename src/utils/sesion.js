// MÓDULO: utils/sesion.js
// CAPA:   Utils
//
// Centraliza el manejo de la sesión en localStorage.
// Ningún otro módulo debe acceder a localStorage directamente.
// Paulo usa obtenerAccessToken() y obtenerRefreshToken() desde fetchConAuth.js.

const KEYS = {
    ACCESS_TOKEN:  'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USUARIO:       'usuarioActual',
    PERMISOS:      'permisosUsuario',
};

// ── GUARDAR SESIÓN ───────────────────────────────────────────────────────────
/**
 * Guarda el token y la información de autorización del usuario.
 *
 * Con multi-rol el backend devuelve `user.roles` como array de objetos
 * { name: 'admin', permissions: ['tasks.create', ...] }. Aquí guardamos:
 *   - el objeto usuario tal cual viene (incluye el array de roles con permisos),
 *   - además un array plano de strings con los nombres de roles, para que
 *     el resto del frontend pueda hacer `usuario.roles.includes('admin')`
 *     sin tener que inspeccionar cada objeto.
 *
 * Soporta dos formas de invocación por compatibilidad con el código existente:
 *   guardarSesion(token, roles, permisos, usuario)
 *   guardarSesion(token, usuario)   // si el usuario ya trae roles dentro
 *
 * @param {string} token   JWT de acceso
 * @param {Array|Object} rolesOUsuario  Array de roles (legacy) u objeto usuario
 * @param {Array} [permisos]            Array de permisos atómicos (legacy)
 * @param {Object} [usuario]            Datos del usuario (legacy)
 */
export function guardarSesion(token, rolesOUsuario, permisos, usuario) {
    localStorage.setItem(KEYS.ACCESS_TOKEN, token);

    let usuarioFinal;
    let nombresRoles;
    let permisosPlanos;

    if (Array.isArray(rolesOUsuario)) {
        // Forma legacy: (token, roles, permisos, usuario)
        usuarioFinal   = usuario || {};
        nombresRoles   = rolesOUsuario.map(_extraerNombreRol).filter(Boolean);
        permisosPlanos = Array.isArray(permisos) ? permisos : _extraerPermisosDeRoles(rolesOUsuario);
    } else {
        // Forma nueva: (token, usuario) — donde usuario.roles ya viene del backend
        usuarioFinal   = rolesOUsuario || {};
        const rolesIn  = Array.isArray(usuarioFinal.roles) ? usuarioFinal.roles : [];
        nombresRoles   = rolesIn.map(_extraerNombreRol).filter(Boolean);
        permisosPlanos = _extraerPermisosDeRoles(rolesIn);
    }

    // Fallback al campo legacy `role` si el backend aún no manda `roles`
    if (nombresRoles.length === 0 && typeof usuarioFinal.role === 'string') {
        nombresRoles = [usuarioFinal.role];
    }

    // Guardamos el usuario conservando el array original de roles (con permisos)
    // y agregamos `rolesNombres` para acceso rápido como array de strings.
    const datosUsuario = { ...usuarioFinal, rolesNombres: nombresRoles };
    localStorage.setItem(KEYS.USUARIO, JSON.stringify(datosUsuario));
    localStorage.setItem(KEYS.PERMISOS, JSON.stringify(permisosPlanos));
}

// Devuelve el nombre de un rol acepte string o objeto { name, permissions }
function _extraerNombreRol(rol) {
    if (!rol) return null;
    if (typeof rol === 'string') return rol;
    return rol.name || null;
}

// Aplana los permisos de un array de objetos rol en una lista de strings única
function _extraerPermisosDeRoles(roles) {
    if (!Array.isArray(roles)) return [];
    const set = new Set();
    roles.forEach(r => {
        if (r && Array.isArray(r.permissions)) {
            r.permissions.forEach(p => set.add(p));
        }
    });
    return Array.from(set);
}

// ── VALIDACIÓN DE PERMISOS ───────────────────────────────────────────────────
/**
 * Verifica si el usuario logueado tiene un permiso atómico.
 *
 * Mira primero la lista plana en `permisosUsuario` (forma legacy de este repo),
 * y como fallback recorre `usuarioActual.roles[].permissions` por si el login
 * guardó el usuario sin haber aplanado los permisos.
 */
export function tienePermiso(permisoRequerido) {
    // 1) Fuente principal: lista plana guardada en login
    try {
        const raw = localStorage.getItem(KEYS.PERMISOS);
        if (raw) {
            const permisos = JSON.parse(raw);
            if (Array.isArray(permisos) && permisos.includes(permisoRequerido)) return true;
        }
    } catch { /* ignorar JSON inválido y caer al fallback */ }

    // 2) Fallback: derivarlo del array de roles del usuario
    const usuario = obtenerUsuarioSesion();
    if (!usuario || !Array.isArray(usuario.roles)) return false;
    return usuario.roles.some(r =>
        r && Array.isArray(r.permissions) && r.permissions.includes(permisoRequerido)
    );
}

// Devuelve los roles del usuario logueado como array de strings ([] si no hay).
export function obtenerRoles() {
    const usuario = obtenerUsuarioSesion();
    if (!usuario) return [];
    if (Array.isArray(usuario.rolesNombres)) return usuario.rolesNombres;
    if (Array.isArray(usuario.roles))         return usuario.roles.map(_extraerNombreRol).filter(Boolean);
    if (typeof usuario.role === 'string')     return [usuario.role];
    return [];
}

export function obtenerUsuarioId() {
    const usuario = obtenerUsuarioSesion();
    return usuario ? usuario.id : null;
}

// Actualiza solo el accessToken — lo usa el interceptor de Paulo
export function actualizarAccessToken(nuevoToken) {
    localStorage.setItem(KEYS.ACCESS_TOKEN, nuevoToken);
}

// Guarda el refreshToken devuelto por /auth/login para que fetchConAuth pueda
// usarlo en el silent refresh cuando expire el accessToken.
export function guardarRefreshToken(refreshToken) {
    if (refreshToken) localStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
}

// Retorna el accessToken guardado, o null si no hay sesión
export function obtenerAccessToken() {
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
}

// Retorna el refreshToken guardado, o null si no hay sesión
export function obtenerRefreshToken() {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
}

// Retorna el objeto del usuario guardado, o null si no hay sesión
export function obtenerUsuarioSesion() {
    const raw = localStorage.getItem(KEYS.USUARIO);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

// Borra todos los datos de sesión (logout)
export function cerrarSesion() {
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    localStorage.removeItem(KEYS.USUARIO);
    localStorage.removeItem(KEYS.PERMISOS);
}

// Retorna true si hay un token guardado (sesión activa)
export function haySesionActiva() {
    return Boolean(localStorage.getItem(KEYS.ACCESS_TOKEN));
}