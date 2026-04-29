// MÓDULO: utils/validaciones.js
// CAPA:   Utils

// ACTUALIZACIÓN [FEAT #57]:
//   Se eliminan window.alert() y mensajes genéricos.
//   Ahora todas las validaciones usan mostrarNotificacion() de notificaciones.js
//   con mensajes iguales a los que devuelve el backend (Zod) cuando falla.

import { mostrarNotificacion } from './notificaciones.js';

export function entradaEsValida(value) {
    return value.trim().length > 0;
}

// Muestra un error en el span de error (si existe) y añade clase visual al input.
export function mostrarError(elementoError, elementoInput, mensaje) {
    if (elementoError) elementoError.textContent = mensaje;
    if (elementoInput) elementoInput.classList.add('error');
}

// Limpia el error del span y la clase visual del input.
export function limpiarError(elementoError, elementoInput) {
    if (elementoError) elementoError.textContent = '';
    if (elementoInput) elementoInput.classList.remove('error');
}

// ── VALIDACIÓN FORMULARIO BÚSQUEDA (modo usuario) ─────────────────────────────
// Retorna true si el campo es válido. Muestra toast de error.
export async function validarFormularioBusqueda(documentoInput, documentoError) {
    const valorDocumento = documentoInput ? documentoInput.value : '';
    let esValido = true;

    if (!entradaEsValida(valorDocumento)) {
        const msg = 'El documento del usuario es obligatorio';
        mostrarError(documentoError, documentoInput, msg);
        await mostrarNotificacion(msg, 'error');
        esValido = false;
    } else {
        limpiarError(documentoError, documentoInput);
    }

    return esValido;
}

// ── VALIDACIÓN FORMULARIO USUARIO (crear / editar en panel admin) ─────────────
// Mensajes alineados exactamente con los del backend (user.schema.js / Zod).
// Retorna true si todos los campos son válidos.
// Muestra el primer error como toast usando mostrarNotificacion().
export async function validarFormularioUsuario({ docInput, nameInput, emailInput, docError, nameError, emailError }) {
    let esValido = true;
    let primerMensaje = null;

    // Limpiar errores previos
    [docError, nameError, emailError].forEach(el => { if (el) el.textContent = ''; });
    [docInput, nameInput, emailInput].forEach(el => { if (el) el.classList.remove('error'); });

    // ── Validar documento ───────────────────────────────────────────────────
    const valorDoc = docInput ? docInput.value.trim() : '';

    if (!entradaEsValida(valorDoc)) {
        const msg = 'El número de documento es obligatorio';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorDoc.length < 5) {
        const msg = 'El documento debe tener al menos 5 caracteres';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorDoc.length > 20) {
        const msg = 'El documento no puede exceder los 20 caracteres';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (!/^\d+$/.test(valorDoc)) {
        const msg = 'El documento solo puede contener números';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar nombre ──────────────────────────────────────────────────────
    const valorName = nameInput ? nameInput.value.trim() : '';

    if (!entradaEsValida(valorName)) {
        const msg = 'El nombre es obligatorio';
        mostrarError(nameError, nameInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorName.length < 3) {
        const msg = 'El nombre debe tener al menos 3 caracteres';
        mostrarError(nameError, nameInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorName.length > 100) {
        const msg = 'El nombre no puede exceder los 100 caracteres';
        mostrarError(nameError, nameInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(valorName)) {
        const msg = 'El nombre solo puede contener letras y espacios';
        mostrarError(nameError, nameInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar email ───────────────────────────────────────────────────────
    // IMPORTANTE: el input email ya NO usa type="email" para evitar tooltip nativo del browser.
    // La validación se hace manualmente aquí con regex.
    const valorEmail = emailInput ? emailInput.value.trim() : '';

    if (!entradaEsValida(valorEmail)) {
        const msg = 'El correo electrónico es obligatorio';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valorEmail)) {
        const msg = 'El correo electrónico no tiene un formato válido';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorEmail.length > 100) {
        const msg = 'El correo no puede exceder los 100 caracteres';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // Mostrar el primer error como toast
    if (primerMensaje) {
        await mostrarNotificacion(primerMensaje, 'error');
    }

    return esValido;
}

// ── VALIDACIÓN FORMULARIO TAREA (crear tarea en panel admin) ──────────────────
// Mensajes alineados con task.schema.js del backend.
// Retorna true si los campos obligatorios son válidos.
export async function validarFormularioTarea({ titleInput, statusInput, titleError, statusError }) {
    let esValido = true;
    let primerMensaje = null;

    // Limpiar errores previos
    [titleError, statusError].forEach(el => { if (el) el.textContent = ''; });
    [titleInput, statusInput].forEach(el => { if (el) el.classList.remove('error'); });

    // ── Validar título ──────────────────────────────────────────────────────
    const valorTitulo = titleInput ? titleInput.value.trim() : '';

    if (!entradaEsValida(valorTitulo)) {
        const msg = 'El título de la tarea es obligatorio';
        mostrarError(titleError, titleInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorTitulo.length < 3) {
        const msg = 'El título debe tener al menos 3 caracteres';
        mostrarError(titleError, titleInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorTitulo.length > 200) {
        const msg = 'El título no puede exceder los 200 caracteres';
        mostrarError(titleError, titleInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar estado ──────────────────────────────────────────────────────
    const valorEstado = statusInput ? statusInput.value : '';

    if (!valorEstado) {
        const msg = 'El estado de la tarea es obligatorio';
        mostrarError(statusError, statusInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // Mostrar el primer error como toast
    if (primerMensaje) {
        await mostrarNotificacion(primerMensaje, 'error');
    }

    return esValido;
}

// ── VALIDACIÓN FORMULARIO LOGIN (ACTUALIZADA) ─────────────────────────────────
// Antes validaba documento (solo números, mínimo 5 caracteres).
// Ahora valida email (formato correo, máximo 100 caracteres).
//
// Los mensajes de error están en español y aparecen tanto en el span del campo
// como en un toast de SweetAlert2 (mostrarNotificacion).
// Retorna true si ambos campos son válidos, false si hay algún error.
export async function validarFormularioLogin({ emailInput, passwordInput, emailError, passwordError }) {
    let esValido      = true;
    let primerMensaje = null;

    // Limpiar errores previos en los dos campos para que no se acumulen
    [emailError, passwordError].forEach(el => { if (el) el.textContent = ''; });
    [emailInput, passwordInput].forEach(el => { if (el) el.classList.remove('error'); });

    // ── Validar email ────────────────────────────────────────────────────────
    // Se valida manualmente con regex en lugar de depender del type="email"
    // para controlar el mensaje y el estilo del error
    const valorEmail = emailInput ? emailInput.value.trim() : '';

    if (!entradaEsValida(valorEmail)) {
        const msg = 'El correo electrónico es obligatorio';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valorEmail)) {
        // El regex verifica que haya texto antes del @, el @ en sí, y texto con punto después
        const msg = 'El correo electrónico no tiene un formato válido';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorEmail.length > 100) {
        const msg = 'El correo no puede exceder los 100 caracteres';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar contraseña ───────────────────────────────────────────────────
    const valorPassword = passwordInput ? passwordInput.value : '';

    if (!valorPassword) {
        const msg = 'La contraseña es obligatoria';
        mostrarError(passwordError, passwordInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorPassword.length < 6) {
        const msg = 'La contraseña debe tener al menos 6 caracteres';
        mostrarError(passwordError, passwordInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // Mostrar el primer error como toast de SweetAlert2
    if (primerMensaje) await mostrarNotificacion(primerMensaje, 'error');

    return esValido;
}

// ── VALIDACIÓN FORMULARIO REGISTRO ────────────────────────────────────────────
// Valida los 5 campos del modal de registro (registroModal en index.html).
// IDs reales del HTML: registroNombre, registroDocumento, registroEmail,
//                      registroPassword, registroConfirmar
// Retorna true si todo es válido, false si hay algún error.
// Muestra el primer error como toast con mostrarNotificacion(), igual que
// las demás funciones de validación del módulo.
export async function validarFormularioRegistro({
    nombreInput, nombreError,
    docInput, docError,
    emailInput, emailError,
    passInput, passError,
    confirmarInput, confirmarError
}) {
    let esValido = true;
    let primerMensaje = null;

    // ── Limpiar errores anteriores ────────────────────────────────────────────
    [nombreError, docError, emailError, passError, confirmarError]
        .forEach(el => { if (el) el.textContent = ''; });
    [nombreInput, docInput, emailInput, passInput, confirmarInput]
        .forEach(el => { if (el) el.classList.remove('error'); });

    // ── Validar Nombre ────────────────────────────────────────────────────────
    const valorNombre = nombreInput ? nombreInput.value.trim() : '';

    if (!entradaEsValida(valorNombre)) {
        const msg = 'El nombre completo es obligatorio';
        mostrarError(nombreError, nombreInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorNombre.length < 3) {
        const msg = 'El nombre debe tener al menos 3 caracteres';
        mostrarError(nombreError, nombreInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorNombre.length > 100) {
        const msg = 'El nombre no puede exceder los 100 caracteres';
        mostrarError(nombreError, nombreInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(valorNombre)) {
        // Mismo regex que validarFormularioUsuario — solo letras y espacios
        const msg = 'El nombre solo puede contener letras y espacios';
        mostrarError(nombreError, nombreInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar Documento ─────────────────────────────────────────────────────
    const valorDoc = docInput ? docInput.value.trim() : '';

    if (!entradaEsValida(valorDoc)) {
        const msg = 'El número de documento es obligatorio';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorDoc.length < 5) {
        const msg = 'El documento debe tener al menos 5 dígitos';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorDoc.length > 20) {
        const msg = 'El documento no puede exceder los 20 dígitos';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (!/^\d+$/.test(valorDoc)) {
        const msg = 'El documento solo puede contener números';
        mostrarError(docError, docInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar Email ─────────────────────────────────────────────────────────
    const valorEmail = emailInput ? emailInput.value.trim() : '';

    if (!entradaEsValida(valorEmail)) {
        const msg = 'El correo electrónico es obligatorio';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valorEmail)) {
        // Mismo regex que usan validarFormularioUsuario y validarFormularioLogin
        const msg = 'El correo electrónico no tiene un formato válido';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorEmail.length > 100) {
        const msg = 'El correo no puede exceder los 100 caracteres';
        mostrarError(emailError, emailInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar Contraseña ────────────────────────────────────────────────────
    const valorPass = passInput ? passInput.value : '';

    if (!valorPass) {
        const msg = 'La contraseña es obligatoria';
        mostrarError(passError, passInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorPass.length < 6) {
        const msg = 'La contraseña debe tener al menos 6 caracteres';
        mostrarError(passError, passInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Validar Confirmar Contraseña ──────────────────────────────────────────
    const valorConfirmar = confirmarInput ? confirmarInput.value : '';

    if (!valorConfirmar) {
        const msg = 'Debes confirmar tu contraseña';
        mostrarError(confirmarError, confirmarInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    } else if (valorPass && valorConfirmar !== valorPass) {
        const msg = 'Las contraseñas no coinciden';
        mostrarError(confirmarError, confirmarInput, msg);
        if (!primerMensaje) primerMensaje = msg;
        esValido = false;
    }

    // ── Mostrar primer error como toast (igual que todas las funciones del módulo) ──
    if (primerMensaje) {
        await mostrarNotificacion(primerMensaje, 'error');
    }

    return esValido;
}