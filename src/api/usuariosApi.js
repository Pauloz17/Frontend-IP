// MÓDULO: api/usuariosApi.js
// CAPA:   API

// Centraliza todas las peticiones HTTP de usuarios al backend Express + MySQL.
// NUNCA manipula el DOM ni conoce la interfaz.
//
// Endpoints cubiertos:
//   GET    /api/users              -> obtenerTodosLosUsuarios
//   GET    /api/users/:id          -> obtenerUsuarioPorId
//   GET    /api/users/:userId/tasks -> obtenerTareasDeUsuarioById
//   POST   /api/users              -> crearUsuario
//   PUT    /api/users/:id          -> actualizarUsuario
//   DELETE /api/users/:id          -> eliminarUsuario

import { API_BASE_URL, API_PREFIX } from '../utils/config.js';
import { fetchConAuth } from '../utils/fetchConAuth.js';

// ── OBTENER TODOS LOS USUARIOS ────────────────────────────────────────────────
export async function obtenerTodosLosUsuarios() {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users`;
        const response = await fetchConAuth(url, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al obtener los usuarios');
        return json.data;
    } catch (error) {
        console.error('obtenerTodosLosUsuarios:', error);
        return null;
    }
}

// ── OBTENER USUARIO POR ID ────────────────────────────────────────────────────
export async function obtenerUsuarioPorId(id) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}`;
        const response = await fetchConAuth(url);
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Usuario ${id} no encontrado`);
        return json.data;
    } catch (error) {
        console.error('obtenerUsuarioPorId:', error);
        return null;
    }
}

// ── OBTENER TAREAS DE UN USUARIO POR ID (endpoint propio de users) ────────────
// GET /api/users/:userId/tasks
// Alternativa al filtro de tareas; devuelve el mismo resultado.
export async function obtenerTareasDeUsuarioById(userId) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/${userId}/tasks`;
        const response = await fetchConAuth(url);
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al obtener tareas del usuario ${userId}`);
        return json.data;
    } catch (error) {
        console.error('obtenerTareasDeUsuarioById:', error);
        return [];
    }
}

// ── CREAR USUARIO ─────────────────────────────────────────────────────────────
// POST /api/users
// Cuerpo: { documento, name, email }
export async function crearUsuario(datosUsuario) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users`;
        const response = await fetchConAuth(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al crear el usuario');
        return json.data;
    } catch (error) {
        console.error('crearUsuario:', error);
        return null;
    }
}

// ── ACTUALIZAR USUARIO ────────────────────────────────────────────────────────
// PUT /api/users/:id
// Solo permite actualizar: documento, name, email (el modelo ignora el resto)
export async function actualizarUsuario(id, datosUsuario) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}`;
        const response = await fetchConAuth(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al actualizar usuario ${id}`);
        return json.data;
    } catch (error) {
        console.error('actualizarUsuario:', error);
        return null;
    }
}

// ── ELIMINAR USUARIO ──────────────────────────────────────────────────────────
// DELETE /api/users/:id
export async function eliminarUsuario(id) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}`;
        const response = await fetchConAuth(url, { method: 'DELETE' });
        const json = await response.json();
        if (!json.success) throw new Error(json.message || `Error al eliminar usuario ${id}`);
        return true;
    } catch (error) {
        console.error('eliminarUsuario:', error);
        return false;
    }
}

// ── MULTI-ROL: CATÁLOGO Y GESTIÓN ─────────────────────────────────────────────
// El backend pasó a soportar multi-rol real (un usuario puede tener varios roles
// a la vez). Estas funciones envuelven los 5 endpoints nuevos.
// Todas requieren que el token autenticado pertenezca a un admin.

// GET /api/users/available-roles — catálogo de roles del sistema.
// Devuelve SIEMPRE un array de strings, ej: ['admin', 'instructor', 'user'].
// El backend a veces los manda como objetos { id, name, permissions }; aquí
// los aplanamos para que el resto del frontend no tenga que preocuparse.
export async function obtenerRolesDisponibles() {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/available-roles`;
        const response = await fetchConAuth(url, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al obtener el catálogo de roles');
        const crudos = Array.isArray(json.data) ? json.data : (json.data?.roles || []);
        return _normalizarNombresDeRoles(crudos);
    } catch (error) {
        console.error('obtenerRolesDisponibles:', error);
        return null;
    }
}

// GET /api/users/:id/roles — roles actuales del usuario.
// Devuelve SIEMPRE un array de strings, ej: ['admin', 'instructor'].
export async function obtenerRolesDeUsuario(id) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}/roles`;
        const response = await fetchConAuth(url, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al obtener roles del usuario ${id}`);
        const crudos = Array.isArray(json.data) ? json.data : (json.data?.roles || []);
        return _normalizarNombresDeRoles(crudos);
    } catch (error) {
        console.error('obtenerRolesDeUsuario:', error);
        return null;
    }
}

// Convierte un array que puede traer strings u objetos en uno SOLO de strings.
// Acepta: ['admin', 'user']  →  ['admin', 'user']
// Acepta: [{name:'admin'}, {name:'user'}]  →  ['admin', 'user']
// Acepta mezclas y descarta elementos vacíos.
function _normalizarNombresDeRoles(arr) {
    if (!Array.isArray(arr)) return [];
    return arr
        .map(r => (typeof r === 'string' ? r : (r && (r.name || r.nombre || r.rol)) || null))
        .filter(Boolean);
}

// PUT /api/users/:id/roles — reemplaza TODO el set de roles del usuario.
// Body: { roles: ['admin', 'instructor'] }
// Esta es la forma preferida: una sola petición que deja al usuario con
// exactamente los roles que le pasamos.
//
// Retorna { ok: true, data } cuando va bien, o { ok: false, status, message }
// cuando el backend rechaza con 400/401/403. El llamador decide qué hacer con
// cada error (mostrarlo dentro del modal, redirigir al login, etc.).
export async function reemplazarRolesDeUsuario(id, roles) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}/roles`;
        const response = await fetchConAuth(url, {
            method: 'PUT',
            body: JSON.stringify({ roles }),
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
            return { ok: false, status: response.status, message: json.message || 'Error al actualizar los roles' };
        }
        return { ok: true, data: json.data };
    } catch (error) {
        console.error('reemplazarRolesDeUsuario:', error);
        return { ok: false, status: 0, message: 'No se pudo conectar con el servidor' };
    }
}

// POST /api/users/:id/roles — agrega UN rol al usuario sin quitar los demás.
// Body: { role: 'instructor' }
// No se usa en el modal de checkboxes (que prefiere PUT con el set completo),
// pero queda disponible por si en el futuro se quieren acciones rápidas.
export async function agregarRolAUsuario(id, role) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}/roles`;
        const response = await fetchConAuth(url, {
            method: 'POST',
            body: JSON.stringify({ role }),
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
            return { ok: false, status: response.status, message: json.message || 'Error al agregar el rol' };
        }
        return { ok: true, data: json.data };
    } catch (error) {
        console.error('agregarRolAUsuario:', error);
        return { ok: false, status: 0, message: 'No se pudo conectar con el servidor' };
    }
}

// DELETE /api/users/:id/roles/:roleName — quita UN rol específico del usuario.
// El backend rechaza con 400 si es el último rol.
export async function quitarRolDeUsuario(id, roleName) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}/roles/${encodeURIComponent(roleName)}`;
        const response = await fetchConAuth(url, { method: 'DELETE' });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
            return { ok: false, status: response.status, message: json.message || 'Error al quitar el rol' };
        }
        return { ok: true, data: json.data };
    } catch (error) {
        console.error('quitarRolDeUsuario:', error);
        return { ok: false, status: 0, message: 'No se pudo conectar con el servidor' };
    }
}

// ── LEGACY: cambiar rol único (PATCH /:id/role) ───────────────────────────────
// @deprecated — el backend lo conserva por compatibilidad pero BORRA los demás
// roles del usuario. No usar en código nuevo: en su lugar llamar a
// reemplazarRolesDeUsuario(id, [...roles]).
export async function cambiarRolUsuario(id, role) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}/role`;
        const response = await fetchConAuth(url, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al cambiar el rol del usuario ${id}`);
        return json.data;
    } catch (error) {
        console.error('cambiarRolUsuario:', error);
        return null;
    }
}

// ── CAMBIAR CONTRASEÑA DEL USUARIO LOGUEADO ───────────────────────────────────
// PATCH /api/users/:id/password
// Cuerpo: { currentPassword, newPassword }
// Requiere que el usuario esté autenticado (Bearer Token en el header).
// El id es el del usuario logueado — se obtiene desde obtenerUsuarioSesion().
export async function cambiarPassword(userId, datos) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/${userId}/password`;
        const response = await fetchConAuth(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            // datos: { currentPassword, newPassword }
            body: JSON.stringify(datos),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al cambiar la contraseña');
        return true;
    } catch (error) {
        console.error('cambiarPassword:', error);
        // Retornar el mensaje de error para que el modal lo muestre al usuario
        return { error: error.message };
    }
}