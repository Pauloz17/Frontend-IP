// MÓDULO: main.js
// Punto de entrada. Inicializa la aplicación.

// ── IMPORTS ──────────────────────────────────────────────────────────────────
import { renderRoute } from './router/router.js';
import { registrarEventListeners }          from './services/tareasService.js';
import { mostrarEstadoVacio }               from './ui/tareasUI.js';
import { activarModoInicio, activarModoAdmin, activarModoUsuario, activarModoInstructor } from './ui/modoUI.js';
import { API_BASE_URL }                     from './utils/config.js';
import { haySesionActiva, obtenerUsuarioSesion } from './utils/sesion.js';
import { forgotPassword, verifyResetCode, resetPassword } from './api/authApi.js';
// Swal se carga desde CDN en index.html

// Inicializar el enrutador SPA con la ruta actual
renderRoute(window.location.pathname);

// ── DOMContentLoaded ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM cargado correctamente');

    const btnOlvidoTest = document.getElementById('btnOlvidoPassword');
    console.log('Botón olvido encontrado:', btnOlvidoTest);

    console.log('Sistema de Gestión de Tareas — SENA');
    console.log('Backend esperado en:', API_BASE_URL);

    // Registrar todos los event listeners del proyecto
    registrarEventListeners();

    // ==================== RECUPERACIÓN DE CONTRASEÑA ====================
    const olvidoModal = document.getElementById('olvidoPasswordModal');
    const btnOlvido = document.getElementById('btnOlvidoPassword');
    const olvidoClose = document.getElementById('olvidoPasswordClose');

    const paso1 = document.getElementById('olvidoPaso1');
    const paso2 = document.getElementById('olvidoPaso2');
    const paso3 = document.getElementById('olvidoPaso3');

    const olvidoEmailForm = document.getElementById('olvidoEmailForm');
    const olvidoCodigoForm = document.getElementById('olvidoCodigoForm');
    const olvidoNuevaPasswordForm = document.getElementById('olvidoNuevaPasswordForm');

    let emailRecuperacion = '';

    // Abrir modal
    btnOlvido.addEventListener('click', () => {
        olvidoModal.classList.remove('hidden');
        mostrarPaso(1);
        limpiarErrores();
    });

    // Cerrar modal
    olvidoClose.addEventListener('click', cerrarOlvidoModal);
    document.getElementById('olvidoPaso1Cancelar').addEventListener('click', cerrarOlvidoModal);

    function cerrarOlvidoModal() {
        olvidoModal.classList.add('hidden');
        olvidoEmailForm.reset();
        olvidoCodigoForm.reset();
        olvidoNuevaPasswordForm.reset();
        mostrarPaso(1);
        limpiarErrores();
    }

    function mostrarPaso(numero) {
        paso1.classList.toggle('hidden', numero !== 1);
        paso2.classList.toggle('hidden', numero !== 2);
        paso3.classList.toggle('hidden', numero !== 3);
    }

    function limpiarErrores() {
        ['olvidoEmailError', 'olvidoCodigoError', 'olvidoNuevaPasswordError', 'olvidoConfirmarPasswordError'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = '';
                el.style.display = 'none';
            }
        });
    }

    function mostrarError(id, mensaje) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = mensaje;
            el.style.display = 'block';
        }
    }

    // PASO 1: Enviar email
    olvidoEmailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        limpiarErrores();

        const email = document.getElementById('olvidoEmail').value.trim();

        if (!email || !email.includes('@')) {
            mostrarError('olvidoEmailError', 'Ingresa un correo válido');
            return;
        }

        const btn = olvidoEmailForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Enviando...';

        const resultado = await forgotPassword(email);

        btn.disabled = false;
        btn.textContent = 'Enviar código';

        if (resultado === true) {
            emailRecuperacion = email;
            mostrarPaso(2);
        } else {
            mostrarError('olvidoEmailError', resultado.error || 'Error al enviar el código');
        }
    });

    // PASO 2: Verificar código
    olvidoCodigoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        limpiarErrores();

        const codigo = document.getElementById('olvidoCodigo').value.trim();

        if (codigo.length !== 6 || !/^\d{6}$/.test(codigo)) {
            mostrarError('olvidoCodigoError', 'Ingresa un código de 6 dígitos numéricos');
            return;
        }

        const btn = olvidoCodigoForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Verificando...';

        const resultado = await verifyResetCode(emailRecuperacion, codigo);

        btn.disabled = false;
        btn.textContent = 'Verificar código';

        if (resultado === true) {
            mostrarPaso(3);
        } else {
            mostrarError('olvidoCodigoError', resultado.error || 'Código incorrecto o expirado');
        }
    });

    // PASO 3: Cambiar contraseña
    olvidoNuevaPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        limpiarErrores();

        const nuevaPassword = document.getElementById('olvidoNuevaPassword').value;
        const confirmar = document.getElementById('olvidoConfirmarPassword').value;

        if (nuevaPassword.length < 6) {
            mostrarError('olvidoNuevaPasswordError', 'Mínimo 6 caracteres');
            return;
        }

        if (nuevaPassword !== confirmar) {
            mostrarError('olvidoConfirmarPasswordError', 'Las contraseñas no coinciden');
            return;
        }

        const btn = olvidoNuevaPasswordForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Cambiando...';

        const resultado = await resetPassword(emailRecuperacion, nuevaPassword);

        btn.disabled = false;
        btn.textContent = 'Cambiar contraseña';

        if (resultado === true) {
            alert('¡Contraseña cambiada exitosamente! Ya puedes iniciar sesión.');
            cerrarOlvidoModal();
        } else {
            mostrarError('olvidoNuevaPasswordError', resultado.error || 'Error al cambiar la contraseña');
        }
    });

    // Botón volver del paso 2
    document.getElementById('olvidoPaso2Volver').addEventListener('click', () => {
        mostrarPaso(1);
        limpiarErrores();
    });

    // Botón cancelar del paso 3
    document.getElementById('olvidoPaso3Cancelar').addEventListener('click', cerrarOlvidoModal);

    // ── SESIÓN ─────────────────────────────────────────────────────────────
    // NUEVO: Si hay una sesión guardada, ir directo al modo correcto sin pedir login
    if (haySesionActiva()) {
        const usuario = obtenerUsuarioSesion();
        if (usuario && usuario.role === 'admin') {
            activarModoAdmin();
        } else if (usuario && usuario.role === 'instructor') {
            activarModoInstructor();
        } else if (usuario) {
            activarModoUsuario();
            mostrarEstadoVacio();
        } else {
            activarModoInicio();
        }
    } else {
        // No hay sesión guardada → mostrar el formulario de login
        activarModoInicio();
        mostrarEstadoVacio();
    }

    console.log('Aplicación lista.');
});