// Detecta automáticamente si se accede por localhost o por la IP de la red
const host = window.location.hostname;

export const API_BASE_URL = `http://${host}:3000`;
export const API_PREFIX = '/api';
 