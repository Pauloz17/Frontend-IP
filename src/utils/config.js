// MÓDULO: utils/config.js
// CAPA:   Utils
//
// Define la URL base del backend de forma DINÁMICA según desde dónde se abra
// la app. window.location.hostname devuelve:
//   - 'localhost'       cuando entras por http://localhost:<puerto>
//   - '192.168.x.x'     cuando entras desde otro PC/celular de la red local
//
// El backend siempre corre en el puerto 3000, así que basta con concatenar.
// Esto evita tener que cambiar la IP a mano cada vez que cambia la red.

const host = window.location.hostname;

export const API_BASE_URL = 'http://' + host + ':3000';
export const API_PREFIX   = '/api';
