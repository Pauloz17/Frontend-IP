// MÓDULO: utils/apiErrors.js
// CAPA:   Utils
//
// Helper compartido para extraer los detalles de validación que Zod (el
// validador del backend) devuelve cuando rechaza un body. El backend envuelve
// el mensaje genérico ("Error de validación en los datos enviados") junto a
// un array de issues por campo, en alguna de estas claves:
//   { errors:  [...] }   ← lo más común
//   { details: [...] }
//   { issues:  [...] }
//
// Cada issue suele tener al menos `path` (qué campo) y `message` (qué falló).
// Esta función las acepta todas y devuelve un string corto listo para mostrar
// como notificación, ej: "password (mínimo 8 caracteres), email (formato)".

export function extraerDetallesValidacion(json) {
    if (!json) return null;
    const arr = json.errors || json.details || json.issues;
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr
        .map(e => {
            if (typeof e === 'string') return e;
            const campo = e.path ? (Array.isArray(e.path) ? e.path.join('.') : e.path) : e.field;
            const msg   = e.message || e.msg || '';
            return campo ? `${campo} (${msg})` : msg;
        })
        .filter(Boolean)
        .join(', ');
}
