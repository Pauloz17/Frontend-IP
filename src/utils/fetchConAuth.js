// MÓDULO: utils/fetchConAuth.js
// CAPA:   Utils
//
// Responsabilidad única: realizar peticiones HTTP autenticadas con JWT.
//
// Si el servidor responde 401 (token expirado), este módulo:
//   1. Pide automáticamente un nuevo accessToken usando el refreshToken.
//   2. Guarda el nuevo accessToken en localStorage.
//   3. Reintenta la petición original con el nuevo token.
// Todo esto sin que el usuario note ninguna interrupción. Se llama "Silent Refresh".
//
// USO en tareasApi.js o usuariosApi.js:
//   import { fetchConAuth } from '../utils/fetchConAuth.js';
//   const response = await fetchConAuth(url, { method: 'GET' });
//
// fetchConAuth tiene exactamente la misma firma que el fetch() nativo.

import { renovarToken }         from '../api/authApi.js';
import {
    obtenerAccessToken,
    obtenerRefreshToken,
    actualizarAccessToken,
    cerrarSesion,
}                               from './sesion.js';
import { activarModoInicio }    from '../ui/modoUI.js';
import { mostrarNotificacion }  from './notificaciones.js';

// Flag para evitar múltiples llamadas simultáneas al endpoint de refresh.
// Si dos peticiones fallan con 401 al mismo tiempo, solo una hace el refresh;
// las demás esperan en la cola _esperandoRefresh.
let _refrescando      = false;
let _esperandoRefresh = [];

// Realiza una petición HTTP con el token JWT en el header Authorization.
// Si recibe 401, intenta renovar el token y reintenta la petición.
//
// Parámetros:
//   url      — URL completa del endpoint
//   opciones — mismo objeto de opciones que fetch() nativo (method, body, headers…)
export async function fetchConAuth(url, opciones = {}) {
    const token = obtenerAccessToken();

    // Construir las opciones agregando el header Authorization
    const opcionesConAuth = {
        ...opciones,
        headers: {
            'Content-Type': 'application/json',
            // Se sobreescriben los headers del llamador si los tiene
            ...opciones.headers,
            // Si hay token guardado se agrega el Bearer; si no, se omite
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    };

    // Primera intención — petición normal con el token actual
    const respuesta = await fetch(url, opcionesConAuth);

    // Si el servidor responde algo diferente a 401, retornamos la respuesta directamente
    // (puede ser 200, 400, 404, 500, etc.)
    if (respuesta.status !== 401) return respuesta;

    // ── SILENT REFRESH ────────────────────────────────────────────────────────
    // Llegamos aquí SOLO si el servidor respondió 401 (token expirado o inválido).

    // Si ya hay un refresh en curso esperamos a que termine
    // para no lanzar múltiples peticiones de refresh simultáneas
    if (_refrescando) {
        return new Promise((resolve, reject) => {
            _esperandoRefresh.push({ resolve, reject, url, opciones });
        });
    }

    _refrescando = true;
    const refreshToken = obtenerRefreshToken();

    // Si no hay refreshToken guardado no hay forma de renovar — cerrar sesión
    if (!refreshToken) {
        _refrescando = false;
        _cerrarSesionYRedirigir();
        return respuesta;
    }

    try {
        // Llamar al endpoint de Paulo en el backend: POST /api/auth/refresh
        const { accessToken: nuevoToken } = await renovarToken(refreshToken);

        // Guardar el nuevo accessToken en localStorage (función de Karol en sesion.js)
        actualizarAccessToken(nuevoToken);

        // Resolver las peticiones que estaban esperando en la cola
        _esperandoRefresh.forEach(({ resolve, url: u, opciones: o }) => {
            resolve(fetchConAuth(u, o));
        });
        _esperandoRefresh = [];

        // Reintentar la petición original con el nuevo token
        return fetchConAuth(url, opciones);

    } catch (_error) {
        // El refresh también falló (refreshToken expirado o inválido) — forzar logout
        _esperandoRefresh.forEach(({ reject }) => reject(new Error('Sesión expirada')));
        _esperandoRefresh = [];
        _cerrarSesionYRedirigir();
        return respuesta;

    } finally {
        // Siempre liberar el flag al terminar, haya error o no
        _refrescando = false;
    }
}

// Cierra la sesión del usuario, le muestra una notificación y lo redirige al login.
// Se llama cuando el refreshToken también está expirado o es inválido.
function _cerrarSesionYRedirigir() {
    cerrarSesion();
    mostrarNotificacion('Tu sesión expiró. Por favor inicia sesión de nuevo.', 'advertencia');
    activarModoInicio();
}