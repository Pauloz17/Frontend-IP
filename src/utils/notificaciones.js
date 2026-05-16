// MÓDULO: utils/notificaciones.js
// CAPA:   Utils

// SweetAlert2 se carga desde CDN en index.html, no con import ES module
// <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

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