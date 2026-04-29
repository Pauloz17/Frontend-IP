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

// ── CAMBIAR ROL DE USUARIO ────────────────────────────────────────────────────
// PATCH /api/users/:id/role
// Este endpoint fue creado por Sebastián en el Issue B-3.
// Solo funciona si el token del usuario autenticado tiene role = 'admin'.
//
// Parámetros:
//   id   — id numérico del usuario a modificar
//   role — nuevo rol: 'admin' o 'user'
//
// Retorna el usuario actualizado con el nuevo rol, o null si hubo error.
export async function cambiarRolUsuario(id, role) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/${id}/role`;
        const response = await fetchConAuth(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
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