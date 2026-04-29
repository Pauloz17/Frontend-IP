// MÓDULO: utils/exportacion.js
// CAPA:   Utils

export function exportarTareasJSON(tareas) {
    if (!tareas || tareas.length === 0) {
        console.warn('No hay tareas visibles para exportar');
        return false;
    }

    const contenidoJSON = JSON.stringify(tareas, null, 2);
    const blob          = new Blob([contenidoJSON], { type: 'application/json' });
    const urlDescarga   = URL.createObjectURL(blob);

    const fechaHora = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const enlace    = document.createElement('a');
    enlace.href     = urlDescarga;
    enlace.download = `tareas_${fechaHora}.json`;

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    setTimeout(() => URL.revokeObjectURL(urlDescarga), 1000);
    return true;
}
