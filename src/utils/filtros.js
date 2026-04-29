// MÓDULO: utils/filtros.js
// CAPA:   Utils

// Filtra un arreglo de tareas según estado y/o término de búsqueda de usuario.
// El backend MySQL guarda los usuarios en assignedUsers (array de IDs)
// y resuelve los nombres en assignedUsersDisplay (string separado por coma).
// Esta función trabaja sobre ambos campos para que el filtro funcione
// tanto si se busca por nombre como por ID de usuario.

export function filtrarTareas(tareas, filtroEstado, filtroUsuario) {
    const estadoActivo  = (filtroEstado  || '').trim();
    const usuarioActivo = (filtroUsuario || '').trim().toLowerCase();

    if (!estadoActivo && !usuarioActivo) return [...tareas];

    return tareas.filter(tarea => {
        const cumpleEstado = !estadoActivo || tarea.status === estadoActivo;

        // Busca coincidencia en el nombre resuelto (assignedUsersDisplay),
        // en los documentos (assignedDocumentos) o en los IDs internos
        const cumpleUsuario = !usuarioActivo || (
            (tarea.assignedUsersDisplay &&
             tarea.assignedUsersDisplay.toLowerCase().includes(usuarioActivo)) ||
            (Array.isArray(tarea.assignedDocumentos) &&
             tarea.assignedDocumentos.some(doc => doc.includes(usuarioActivo))) ||
            (Array.isArray(tarea.assignedUsers) &&
             tarea.assignedUsers.some(id => id.toString().includes(usuarioActivo)))
        );

        return cumpleEstado && cumpleUsuario;
    });
}