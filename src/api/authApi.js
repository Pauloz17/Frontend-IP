// MÓDULO: api/authApi.js
// CAPA: API

import { API_BASE_URL, API_PREFIX } from '../utils/config.js';

export async function loginUsuario({ email, password }) {
    const url = `${API_BASE_URL}${API_PREFIX}/auth/login`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || json.message || 'Credenciales incorrectas');
    return json.data;
}

export async function registrarUsuario({ name, documento, email, password }) {
    const url = `${API_BASE_URL}${API_PREFIX}/auth/register`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, documento, email, password }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Error al registrar el usuario');
    return json.data;
}

export async function renovarToken(refreshToken) {
    const url = `${API_BASE_URL}${API_PREFIX}/auth/refresh`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || 'No se pudo renovar el token');
    return json.data;
}

export async function forgotPassword(email) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/auth/forgot-password`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al enviar el correo');
        return true;
    } catch (error) {
        console.error('forgotPassword:', error);
        return { error: error.message };
    }
}

export async function verifyResetCode(email, code) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/auth/verify-reset-code`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Código incorrecto o expirado');
        return true;
    } catch (error) {
        console.error('verifyResetCode:', error);
        return { error: error.message };
    }
}

export async function resetPassword(email, newPassword) {
    try {
        const url = `${API_BASE_URL}${API_PREFIX}/auth/reset-password`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, newPassword }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Error al restablecer la contraseña');
        return true;
    } catch (error) {
        console.error('resetPassword:', error);
        return { error: error.message };
    }
}