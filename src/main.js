// MÓDULO: main.js
// Punto de entrada. Inicializa la aplicación.

import { registrarEventListeners }          from './services/tareasService.js';
import { mostrarEstadoVacio }               from './ui/tareasUI.js';
// MODIFICAR la importación al inicio del archivo — agregar activarModoInstructor:
import { activarModoInicio, activarModoAdmin, activarModoUsuario, activarModoInstructor } from './ui/modoUI.js';
import { API_BASE_URL }                     from './utils/config.js';
import { haySesionActiva, obtenerUsuarioSesion } from './utils/sesion.js';

document.addEventListener('DOMContentLoaded', function () {
    console.log('Sistema de Gestión de Tareas — SENA');
    console.log('Backend esperado en:', API_BASE_URL);

    // Registrar todos los event listeners del proyecto (igual que antes)
    registrarEventListeners();

    // NUEVO: Si hay una sesión guardada, ir directo al modo correcto sin pedir login
    if (haySesionActiva()) {
        const usuario = obtenerUsuarioSesion();
        if (usuario && usuario.role === 'admin') {
            // El usuario guardado es admin → abrir el panel de administrador
            activarModoAdmin();
        } else if (usuario && usuario.role === 'instructor') {
            // El usuario es instructor — abrir el panel de docente con paleta verde
            activarModoInstructor();
        } else if (usuario) {
            // El usuario guardado es un usuario normal → abrir la vista de usuario
            activarModoUsuario();
            mostrarEstadoVacio();
        } else {
            // Hay un token pero los datos del usuario están corruptos — limpiar y pedir login
            activarModoInicio();
        }
    } else {
        // No hay sesión guardada → mostrar el formulario de login
        activarModoInicio();
        mostrarEstadoVacio();
    }

    console.log('Aplicación lista.');
});
