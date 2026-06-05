import { loginUsuario, registrarUsuario, forgotPassword, verifyResetCode, resetPassword } from '../api/authApi.js';
import { guardarSesion, guardarRefreshToken, cerrarSesion } from '../utils/sesion.js';
import { mostrarNotificacion } from '../utils/notificaciones.js';
import { validarFormularioLogin, validarFormularioRegistro, validarComplejidadPassword } from '../utils/validaciones.js';
import { navigate, tomarRutaPendiente } from '../router/router.js';

const $ = id => document.getElementById(id);

export function inicializarAuthEvents() {
    const formLogin = $('loginForm');
    if (formLogin) {
        formLogin.addEventListener('submit', manejarLogin);
    }

    const formRegistro = $('registroForm');
    if (formRegistro) {
        formRegistro.addEventListener('submit', manejarRegistro);
    }

    registrarListenerOlvidoPassword();
}

async function manejarLogin(e) {
    e.preventDefault();
    const inputEmail = $('loginEmail');
    const inputPass  = $('loginPassword');
    
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
    // Lógica de registro extraída de modoUI...
    // (Implementación simplificada para el ejemplo)
}

function registrarListenerOlvidoPassword() {
    const btnAbrir = $('btnOlvidoPassword');
    if (!btnAbrir) return;
    
    btnAbrir.addEventListener('click', () => {
        $('olvidoPasswordModal').classList.remove('hidden');
        // Resto de la lógica de pasos 1, 2, 3...
    });
}

export function limpiarFormularioLogin() {
    ['loginEmail', 'loginPassword'].forEach(id => {
        const el = $(id);
        if (el) { el.value = ''; el.classList.remove('error'); }
    });
}