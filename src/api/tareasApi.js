// MÓDULO: api/tareasApi.js
// CAPA:   API

// Centraliza todas las peticiones HTTP de tareas al backend Express + MySQL.
// NUNCA manipula el DOM ni conoce la interfaz.
//
// Endpoints cubiertos:
//   GET    /api/tasks                        -> obtenerTodasLasTareas
//   GET    /api/tasks/filter?status=&userId= -> filtrarTareasRemoto (no usado por defecto, el filtro es local)
//   GET    /api/tasks/dashboard              -> obtenerDashboard
//   GET    /api/tasks/filter?userId=         -> obtenerTareasDeUsuario
//   POST   /api/tasks                        -> registrarTarea
//   PUT    /api/tasks/:id                    -> actualizarTarea
//   PATCH  /api/tasks/:id/status             -> cambiarEstadoTarea
//   DELETE /api/tasks/:id                    -> eliminarTarea
//   POST   /api/tasks/:taskId/assign         -> asignarUsuariosATarea
//   GET    /api/tasks/:taskId/users          -> obtenerUsuariosAsignados
//   DELETE /api/tasks/:taskId/users/:userId  -> quitarUsuarioDeTarea

import { API_BASE_URL, API_PREFIX } from '../utils/config.js';
import { fetchConAuth } from '../utils/fetchConAuth.js';

// ── OBTENER TODAS LAS TAREAS ──────────────────────────────────────────────────
// GET /api/tasks
// El modelo del backend resuelve assignedUsers (array IDs) a assignedUsersDisplay
// (string con nombres), así que la respuesta ya viene lista para pintar la tabla.
export async function obtenerTodasLasTareas() {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/tasks`;
        const response = await fetchConAuth(url, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al obtener todas las tareas');
        return json.data;
    } catch (error) {
        console.error('obtenerTodasLasTareas:', error);
        return [];
    }
}

// ── OBTENER DASHBOARD ─────────────────────────────────────────────────────────
// GET /api/tasks/dashboard
// Retorna { total, pendientes, enProgreso, completadas }
export async function obtenerDashboard() {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/dashboard`;
        const response = await fetchConAuth(url, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al obtener el dashboard');
        return json.data;
    } catch (error) {
        console.error('obtenerDashboard:', error);
        return null;
    }
}

// ── OBTENER TAREAS DE UN USUARIO ──────────────────────────────────────────────
// GET /api/tasks/filter?userId=:id
// Retorna las tareas cuyo assignedUsers incluye el userId dado.
export async function obtenerTareasDeUsuario(userId) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/filter?userId=${userId}`;
        const response = await fetchConAuth(url, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al obtener tareas del usuario ${userId}`);
        return json.data;
    } catch (error) {
        console.error('obtenerTareasDeUsuario:', error);
        return [];
    }
}

// ── OBTENER TAREA POR ID ──────────────────────────────────────────────────────
// GET /api/tasks/:id
export async function obtenerTareaPorId(id) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/${id}`;
        const response = await fetchConAuth(url);
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Tarea ${id} no encontrada`);
        return json.data;
    } catch (error) {
        console.error('obtenerTareaPorId:', error);
        return null;
    }
}

// ── REGISTRAR TAREA ───────────────────────────────────────────────────────────
// POST /api/tasks
// Cuerpo: { title, description, status, assignedUsers, comment }
export async function registrarTarea(datosTarea) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/tasks`;
        const response = await fetchConAuth(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosTarea),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al registrar la tarea');
        return json.data;
    } catch (error) {
        console.error('registrarTarea:', error);
        return null;
    }
}

// ── ACTUALIZAR TAREA (PUT completo) ───────────────────────────────────────────
// PUT /api/tasks/:id
// Acepta: { title, description, status, assignedUsers, comment }
export async function actualizarTarea(tareaId, datosTarea) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/${tareaId}`;
        const response = await fetchConAuth(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosTarea),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al actualizar tarea ${tareaId}`);
        return json.data;
    } catch (error) {
        console.error('actualizarTarea:', error);
        return null;
    }
}

// ── CAMBIAR SOLO EL ESTADO ────────────────────────────────────────────────────
// PATCH /api/tasks/:id/status
// Cuerpo: { status: 'pendiente' | 'en_progreso' | 'completada' }
export async function cambiarEstadoTarea(tareaId, status) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/${tareaId}/status`;
        const response = await fetchConAuth(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al cambiar estado de tarea ${tareaId}`);
        return json.data;
    } catch (error) {
        console.error('cambiarEstadoTarea:', error);
        return null;
    }
}

// ── ELIMINAR TAREA ────────────────────────────────────────────────────────────
// DELETE /api/tasks/:id
export async function eliminarTarea(tareaId) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/${tareaId}`;
        const response = await fetchConAuth(url, { method: 'DELETE' });
        const json = await response.json();
        if (!json.success) throw new Error(json.message || `Error al eliminar tarea ${tareaId}`);
        return true;
    } catch (error) {
        console.error('eliminarTarea:', error);
        return false;
    }
}

// ── ASIGNAR USUARIOS A TAREA ──────────────────────────────────────────────────
// POST /api/tasks/:taskId/assign
// Cuerpo: { userIds: [1, 2, 3] }
export async function asignarUsuariosATarea(taskId, userIds) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/${taskId}/assign`;
        const response = await fetchConAuth(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al asignar usuarios a tarea ${taskId}`);
        return json.data;
    } catch (error) {
        console.error('asignarUsuariosATarea:', error);
        return null;
    }
}

// ── QUITAR USUARIO DE TAREA ───────────────────────────────────────────────────
// DELETE /api/tasks/:taskId/users/:userId
export async function quitarUsuarioDeTarea(taskId, userId) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/tasks/${taskId}/users/${userId}`;
        const response = await fetchConAuth(url, { method: 'DELETE' });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || `Error al quitar usuario ${userId} de tarea ${taskId}`);
        return json.data;
    } catch (error) {
        console.error('quitarUsuarioDeTarea:', error);
        return null;
    }
}

// ── BUSCAR USUARIO POR DOCUMENTO ─────────────────────────────────────────────
// GET /api/users/by-document/:documento
// Usa la ruta dedicada del backend en lugar de traer todos los usuarios y filtrar en memoria.
// Esto evita el problema del caché 304 que impedía encontrar usuarios recién creados.
export async function buscarUsuarioPorDocumento(documentoId) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/users/by-document/${encodeURIComponent(documentoId.toString().trim())}`;
        const response = await fetchConAuth(url, { cache: 'no-store' });
        const json = await response.json();
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(json.message || 'Error al consultar el servidor');
        return json.data;
    } catch (error) {
        console.error('buscarUsuarioPorDocumento:', error);
        return null;
    }
}