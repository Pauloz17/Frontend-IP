// MÓDULO: main.js
// Punto de entrada. Inicializa la aplicación.

// ── IMPORTS ──────────────────────────────────────────────────────────────────
import { registrarEventListeners }          from './services/tareasService.js';
import { mostrarEstadoVacio }               from './ui/tareasUI.js';
import { API_BASE_URL }                     from './utils/config.js';
import { cerrarSesion } from './utils/sesion.js';
import { forgotPassword, verifyResetCode, resetPassword } from './api/authApi.js';
import { validarComplejidadPassword } from './utils/validaciones.js';
import { renderRoute } from './router/router.js';
// Swal se carga desde CDN en index.html

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

        // Misma regla de complejidad que registro/cambio — alineada con el backend
        const resComplejidad = validarComplejidadPassword(nuevaPassword);
        if (!resComplejidad.valido) {
            mostrarError('olvidoNuevaPasswordError', resComplejidad.mensaje);
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

    // ── SESIÓN + ROUTING ───────────────────────────────────────────────────
    // Política del proyecto: la app SIEMPRE empieza pidiendo login al
    // recargar, aunque haya un accessToken guardado. Eso lo conseguimos
    // limpiando la sesión acá.
    //
    // Pero respetamos la URL escrita en la barra: si el usuario pegó
    // /admin/usuarios/45/roles, renderRoute detecta que es ruta protegida,
    // guarda esa URL como "pendiente" y muestra login. Después del login
    // exitoso (en el handler de modoUI.js) se navega a esa URL pendiente.
    cerrarSesion();
    mostrarEstadoVacio();
    // El router obtiene la ruta desde el hash actual (#/admin, #/usuario, etc.).
    renderRoute();

    console.log('Aplicación lista.');
});
