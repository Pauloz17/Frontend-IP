import { loginUsuario, registrarUsuario, forgotPassword, verifyResetCode, resetPassword } from '../api/authApi.js';
import { guardarSesion, guardarRefreshToken, cerrarSesion } from '../utils/sesion.js';
import { mostrarNotificacion } from '../utils/notificaciones.js';
import { validarFormularioLogin, validarFormularioRegistro, validarComplejidadPassword } from '../utils/validaciones.js';
import { navigate, tomarRutaPendiente } from '../router/router.js';

const $ = id => document.getElementById(id);

export function inicializarAuthEvents() {
    const formLogin = $('loginForm');
    if (formLogin && formLogin.dataset.loginBound !== 'true') {
        formLogin.dataset.loginBound = 'true';
        formLogin.addEventListener('submit', manejarLogin);
    }

    const formRegistro = $('registroForm');
    if (formRegistro && formRegistro.dataset.registroBound !== 'true') {
        formRegistro.dataset.registroBound = 'true';
        formRegistro.addEventListener('submit', manejarRegistro);
    }

    const btnCerrarRegistro = $('registroCloseBtn');
    if (btnCerrarRegistro) {
        btnCerrarRegistro.onclick = cerrarModalRegistro;
    }

    const registroModal = $('registroModal');
    if (registroModal) {
        registroModal.onclick = (event) => {
            if (event.target === registroModal) {
                cerrarModalRegistro();
            }
        };
    }

    registrarListenerOlvidoPassword();
}

async function manejarLogin(e) {
    e.preventDefault();
    const inputEmail = $('loginEmail');
    const inputPass = $('loginPassword');

    const valido = await validarFormularioLogin({
        emailInput: inputEmail,
        passwordInput: inputPass,
        emailError: $('loginEmailError'),
        passwordError: $('loginPasswordError')
    });

    if (!valido) return;

    try {
        const datos = await loginUsuario({
            email: inputEmail.value.trim(),
            password: inputPass.value
        });

        guardarRefreshToken(datos.refreshToken);
        guardarSesion(datos.accessToken, datos.user);

        const roles = Array.isArray(datos.user.roles)
            ? datos.user.roles.map(r => r.name || r)
            : [datos.user.role];

        const target = roles.includes('admin') ? '/admin' : (roles.includes('instructor') ? '/instructor' : '/usuario');

        const pendiente = tomarRutaPendiente();
        navigate(pendiente || target);
    } catch (err) {
        mostrarNotificacion(err.message, 'error');
    }
}

async function manejarRegistro(e) {
    e.preventDefault();

    const nombreInput = $('registroNombre');
    const docInput = $('registroDocumento');
    const emailInput = $('registroEmail');
    const passInput = $('registroPassword');
    const confirmarInput = $('registroConfirmar');

    // Validar los 5 campos del modal (misma lógica que el backend con Zod)
    const valido = await validarFormularioRegistro({
        nombreInput,
        nombreError: $('registroNombreError'),
        docInput,
        docError: $('registroDocumentoError'),
        emailInput,
        emailError: $('registroEmailError'),
        passInput,
        passError: $('registroPasswordError'),
        confirmarInput,
        confirmarError: $('registroConfirmarError'),
    });

    if (!valido) return;

    // Deshabilitar botón mientras se envía la petición al backend
    const btn = e.target.querySelector('button[type="submit"]');
    const textoOriginal = btn ? btn.textContent : 'Crear cuenta';
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Creando cuenta...';
    }

    try {
        await registrarUsuario({
            name: nombreInput.value.trim(),
            documento: docInput.value.trim(),
            email: emailInput.value.trim(),
            password: passInput.value,
        });

        // Registro exitoso: cerrar modal y avisar al usuario
        cerrarModalRegistro();
        await mostrarNotificacion('Cuenta creada exitosamente. Ya puedes iniciar sesión.', 'exito');
    } catch (err) {
        // Error 409 (email/documento ya existen) o 400 (validación) del backend
        await mostrarNotificacion(err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = textoOriginal;
        }
    }
}

function registrarListenerOlvidoPassword() {
    const btnAbrir = $('btnOlvidoPassword');
    if (!btnAbrir) return;

    btnAbrir.addEventListener('click', () => {
        $('olvidoPasswordModal').classList.remove('hidden');
        // Resto de la lógica de pasos 1, 2, 3...
    });
}

export function abrirModalRegistro() {
    const registroModal = $('registroModal');
    if (!registroModal) return;
    limpiarFormularioRegistro();
    registroModal.classList.remove('hidden');
}

function cerrarModalRegistro() {
    const registroModal = $('registroModal');
    if (!registroModal) return;
    registroModal.classList.add('hidden');
    limpiarFormularioRegistro();
}

function limpiarFormularioRegistro() {
    ['registroNombre', 'registroDocumento', 'registroEmail', 'registroPassword', 'registroConfirmar'].forEach(id => {
        const el = $(id);
        if (el) { el.value = ''; el.classList.remove('error'); }
    });
    ['registroNombreError', 'registroDocumentoError', 'registroEmailError', 'registroPasswordError', 'registroConfirmarError'].forEach(id => {
        const errorEl = $(id);
        if (errorEl) { errorEl.textContent = ''; }
    });
}

export function limpiarFormularioLogin() {
    ['loginEmail', 'loginPassword'].forEach(id => {
        const el = $(id);
        if (el) { el.value = ''; el.classList.remove('error'); }
    });
}