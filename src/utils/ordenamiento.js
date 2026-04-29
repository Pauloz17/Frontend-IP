// MÓDULO: utils/ordenamiento.js
// CAPA:   Utils

// Los criterios aceptados coinciden con los valores del <select id="adminOrdenSelect">
// del HTML: titulo_asc, titulo_desc, estado, usuario
// y del modo usuario (si se agrega filtro): titulo, estado

// Mapa de peso numérico para ordenar tareas por estado según el flujo de trabajo.
// Orden lógico del proceso: pendiente → en_progreso → pendiente_aprobacion → completada
// ACTUALIZACIÓN v3.4.0: se agrega pendiente_aprobacion en posición 2
const ORDEN_ESTADOS = {
    pendiente:            0,
    en_progreso:          1,
    // El usuario indica que terminó — está esperando revisión del admin
    pendiente_aprobacion: 2,
    completada:           3,
};

export function ordenarTareas(tareas, criterio) {
    if (!criterio) return [...tareas];

    return tareas.slice().sort((a, b) => {
        switch (criterio) {

            // criterios del panel admin
            case 'titulo_asc':
                return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });

            case 'titulo_desc':
                return b.title.localeCompare(a.title, 'es', { sensitivity: 'base' });

            case 'estado': {
                const pa = ORDEN_ESTADOS[a.status] ?? 99;
                const pb = ORDEN_ESTADOS[b.status] ?? 99;
                return pa - pb;
            }

            case 'usuario':
                return (a.assignedUsersDisplay || '').localeCompare(
                    b.assignedUsersDisplay || '', 'es', { sensitivity: 'base' }
                );

            // criterios del modo usuario (tabla de mis tareas)
            case 'titulo':
                return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });

            case 'fecha':
                return Number(a.id) - Number(b.id);

            default:
                return 0;
        }
    });
}
