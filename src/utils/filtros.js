// MÓDULO: utils/filtros.js
// CAPA:   Utils

// Filtra un arreglo de tareas según estado y/o término de búsqueda de usuario.
// El backend MySQL guarda los usuarios en assignedUsers (array de IDs)
// y resuelve los nombres en assignedUsersDisplay (string separado por coma).
// Esta función trabaja sobre ambos campos para que el filtro funcione
// tanto si se busca por nombre como por ID de usuario.

// Normaliza un valor de estado para comparación insensible a mayúsculas y
// pequeños desajustes de formato. Acepta strings, números o null/undefined.
// Antes el filtro comparaba con === estricto, lo que rompía si el backend
// devolvía "Pendiente" (con mayúscula) o " pendiente" (con espacio).
function _normalizarEstado(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor).trim().toLowerCase();
}

// Devuelve true si el término aparece en cualquier representación textual de
// los usuarios asignados a la tarea. El backend puede devolver esos datos en
// formas distintas según la versión / endpoint:
//   - assignedUsersDisplay: string "Ana, Paulo"
//   - assignedDocumentos:   ["1234", "5678"]
//   - assignedUsers:        [12, 13]                    (solo IDs)
//   - assignedUsers:        [{ id, name, documento }]   (objetos completos)
//   - users / asignados:    otros nombres en otras versiones
// Probamos todas las variantes para que el filtro funcione sin depender de
// un nombre exacto.
function _coincideUsuario(tarea, termino) {
    if (!termino) return true;

    // 1) String pre-resuelto con los nombres
    if (typeof tarea.assignedUsersDisplay === 'string' &&
        tarea.assignedUsersDisplay.toLowerCase().includes(termino)) return true;

    // 2) Array de documentos en texto
    if (Array.isArray(tarea.assignedDocumentos) &&
        tarea.assignedDocumentos.some(d => String(d).toLowerCase().includes(termino))) return true;

    // 3) assignedUsers — puede ser array de IDs o array de objetos
    const arrCandidatos = tarea.assignedUsers || tarea.users || tarea.asignados;
    if (Array.isArray(arrCandidatos)) {
        const hayCoincidencia = arrCandidatos.some(u => {
            if (u === null || u === undefined) return false;
            // Caso ID suelto (número o string)
            if (typeof u !== 'object') return String(u).toLowerCase().includes(termino);
            // Caso objeto: revisamos los campos típicos
            const textos = [u.name, u.nombre, u.fullName, u.documento, u.email, u.id]
                .filter(Boolean)
                .map(v => String(v).toLowerCase());
            return textos.some(t => t.includes(termino));
        });
        if (hayCoincidencia) return true;
    }

    return false;
}

export function filtrarTareas(tareas, filtroEstado, filtroUsuario) {
    const estadoActivo  = _normalizarEstado(filtroEstado);
    const usuarioActivo = (filtroUsuario || '').trim().toLowerCase();

    if (!estadoActivo && !usuarioActivo) return [...tareas];

    return tareas.filter(tarea => {
        const cumpleEstado  = !estadoActivo  || _normalizarEstado(tarea.status) === estadoActivo;
        const cumpleUsuario = !usuarioActivo || _coincideUsuario(tarea, usuarioActivo);
        return cumpleEstado && cumpleUsuario;
    });
}