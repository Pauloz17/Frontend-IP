// MÓDULO: utils/notificaciones.js
// CAPA:   Utils

import Swal from 'sweetalert2';

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    customClass: {
        popup: 'swal-popup',
        title: 'swal-title',
    },
});

export async function mostrarNotificacion(mensaje, tipo = 'info') {
    const tipoSwal = {
        exito:       'success',
        error:       'error',
        info:        'info',
        advertencia: 'warning',
    }[tipo] ?? 'info';

    await Toast.fire({ icon: tipoSwal, title: mensaje });
}

export async function mostrarConfirmacion(titulo, texto, textoBoton = 'Sí, eliminar') {
    const resultado = await Swal.fire({
        title: titulo,
        text: texto,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: textoBoton,
        cancelButtonText: 'Cancelar',
        buttonsStyling: false,
        customClass: {
            popup:         'swal-popup swal-eliminar',
            title:         'swal-title',
            htmlContainer: 'swal-text',
            confirmButton: 'swal-btn-confirmar',
            cancelButton:  'swal-btn-cancelar',
        },
    });
    return resultado.isConfirmed;
}
