// MÓDULO: api/authApi.js
// CAPA:   API
//
// Centraliza las peticiones HTTP de autenticación al backend.
// NUNCA manipula el DOM ni conoce la interfaz.
//
// Endpoints cubiertos:
//   POST /api/auth/login   -> loginUsuario
//   POST /api/auth/refresh -> renovarToken  (lo usa Paulo en fetchConAuth)

import { API_BASE_URL, API_PREFIX } from '../utils/config.js';
import { extraerDetallesValidacion } from '../utils/apiErrors.js';

// ── LOGIN (ACTUALIZADO) ───────────────────────────────────────────────────────
// POST /api/auth/login
// Cuerpo esperado: { email, password }  ← CAMBIO: antes era { documento, password }
// Respuesta exitosa: { accessToken, refreshToken, user: { id, name, role, documento } }
//
// El backend (auth.service.js de Ana Isabella) ahora busca el usuario por email.
// El token JWT sigue incluyendo { id, documento, role } en el payload,
// así que el resto del frontend no necesita cambios.
export async function loginUsuario({ email, password }) {
    const url = `${API_BASE_URL}${API_PREFIX}/auth/login`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const json = await response.json();
    if (!response.ok) {
        // Cuando el backend rechaza por Zod, el mensaje principal suele ser
        // genérico ("Error de validación en los datos enviados") y el detalle
        // viene en json.errors/details/issues. extraerDetallesValidacion los
        // aplana en un string para que el usuario vea el campo concreto que
        // falló sin tener que abrir DevTools.
        const detalles = extraerDetallesValidacion(json);
        const base = json.error || json.message || 'Credenciales incorrectas';
        throw new Error(detalles ? `${base}: ${detalles}` : base);
    }
    return json.data;
}

// ── REGISTRO DE USUARIO ───────────────────────────────────────────────────────
// POST /api/auth/register
// Este endpoint fue creado por Ana Isabella en el Issue B-1.
// Cuerpo: { name, documento, email, password }
// Respuesta exitosa 201: { success, message, data: { usuario sin password } }
// Error 409: email o documento ya registrado
// Error 400: datos inválidos (Zod)
//
// Si la petición falla (409 o 400) lanza un Error con el mensaje del servidor
// para que el modal de registro lo muestre con SweetAlert2.
export async function registrarUsuario({ name, documento, email, password }) {
    const url = `${API_BASE_URL}${API_PREFIX}/auth/register`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, documento, email, password }),
    });
    const json = await response.json();
    if (!response.ok) {
        const detalles = extraerDetallesValidacion(json);
        const base = json.message || 'Error al registrar el usuario';
        throw new Error(detalles ? `${base}: ${detalles}` : base);
    }
    return json.data;
}

// ── RENOVAR TOKEN ─────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Cuerpo: { refreshToken }
// Lo usa el interceptor de Paulo (fetchConAuth.js) para el silent refresh.
export async function renovarToken(refreshToken) {
    const url = `${API_BASE_URL}${API_PREFIX}/auth/refresh`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || 'No se pudo renovar el token');
    return json.data; // { accessToken }
}

// ── PASO 1: SOLICITAR CÓDIGO DE RECUPERACIÓN ──────────────────────────────────
// POST /api/auth/forgot-password
// El usuario ingresa su email para recibir el código de 6 dígitos en Mailtrap.
// Cuerpo: { email }
// Retorna: true si la petición fue exitosa (200), o el mensaje de error si falló.
export async function forgotPassword(email) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/auth/forgot-password`;
        const response = await fetch(url, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al enviar el correo');
        return true;
    } catch (error) {
        console.error('forgotPassword:', error);
        return { error: error.message };
    }
}

// ── PASO 2: VERIFICAR EL CÓDIGO ───────────────────────────────────────────────
// POST /api/auth/verify-reset-code
// El usuario ingresa el código de 6 dígitos recibido en Mailtrap.
// Cuerpo: { email, code }
// Retorna: true si el código es válido, o el mensaje de error si falló.
export async function verifyResetCode(email, code) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/auth/verify-reset-code`;
        const response = await fetch(url, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, code }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Código incorrecto o expirado');
        return true;
    } catch (error) {
        console.error('verifyResetCode:', error);
        return { error: error.message };
    }
}

// ── PASO 3: RESTABLECER LA CONTRASEÑA ─────────────────────────────────────────
// POST /api/auth/reset-password
// El usuario ingresa su nueva contraseña (después de verificar el código).
// Cuerpo: { email, newPassword }
// Retorna: true si la contraseña fue cambiada, o el mensaje de error si falló.
export async function resetPassword(email, newPassword) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/auth/reset-password`;
        const response = await fetch(url, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, newPassword }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al restablecer la contraseña');
        return true;
    } catch (error) {
        console.error('resetPassword:', error);
        return { error: error.message };
    }
}