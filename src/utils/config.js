// MODULO: utils/config.js
// CAPA: Utils
//
// CONFIGURACION CENTRALIZADA PARA LOCAL Y RED
//
// 1. Normal: reutiliza la IP/host con que se abrio el frontend y usa
//    VITE_API_PORT (3000 por defecto). Ejemplo: 192.168.1.20:5173 -> :3000.
// 2. Servidor distinto: definir VITE_API_BASE_URL en .env.local.
//    Ejemplo: VITE_API_BASE_URL=http://192.168.1.20:3000
//
// Ningun modulo API debe repetir IP ni puerto; todos importan este archivo.

const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '');
const apiPort = import.meta.env.VITE_API_PORT || '3000';
const fallbackUrl = `${window.location.protocol}//${window.location.hostname}:${apiPort}`;

export const API_BASE_URL = configuredUrl || fallbackUrl;
export const API_PREFIX = '/api';
