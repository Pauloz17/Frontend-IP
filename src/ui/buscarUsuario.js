// MÓDULO: ui/buscarUsuario.js
// CAPA: UI (manipulación visual de la interfaz)

// Responsabilidad única: montar la vista de búsqueda de usuario para el modo usuario.
// El usuario escribe su número de documento y ve sus tareas asignadas en una lista.
// Este módulo NO maneja edición ni eliminación de tareas — eso es responsabilidad
// de tareasService.js que usa la tabla fija del HTML con botones Editar y Eliminar.

// Todo el DOM se construye con createElement y appendChild.
// Ninguna línea de este archivo usa innerHTML ni atributos style en JS.

// Se importa la función de búsqueda de usuario por documento desde tareasApi.js
import {
    buscarUsuarioPorDocumento,
    obtenerTareasDeUsuario
} from '../api/tareasApi.js';

// FEAT #57: mostrarNotificacion para toasts de error descriptivos
import { mostrarNotificacion } from '../utils/notificaciones.js';

// Función principal que monta la vista de búsqueda en el contenedor recibido
// Parámetro: contenedor — el elemento HTML donde se renderiza la vista
export function montarBuscarUsuario(contenedor) {

    // Se vacía el contenedor con removeChild para no usar innerHTML
    while (contenedor.firstChild) contenedor.removeChild(contenedor.firstChild);

    // Tarjeta principal que envuelve toda la vista de búsqueda
    const card = document.createElement('div');
    card.className = 'card';

    // Título de la sección de búsqueda
    const titulo = document.createElement('h2');
    titulo.className   = 'card__title';
    titulo.textContent = 'Buscar mis tareas';
    card.appendChild(titulo);

    // Formulario de búsqueda: contiene el input de documento y el botón buscar
    const formulario = document.createElement('form');
    formulario.className = 'form';
    // noValidate desactiva la validación nativa del navegador para manejarla manualmente
    formulario.noValidate = true;

    // Grupo del campo de documento (label + input + span de error)
    const grupo = document.createElement('div');
    grupo.className = 'form__group';

    // Etiqueta del campo de documento
    const label = document.createElement('label');
    label.setAttribute('for', 'buscar-input-doc');
    label.className   = 'form__label';
    label.textContent = 'Numero de documento';
    grupo.appendChild(label);

    // Input de texto donde el usuario escribe su número de documento
    const input = document.createElement('input');
    input.type        = 'text';
    input.id          = 'buscar-input-doc';
    input.className   = 'form__input';
    input.placeholder = 'Ingresa tu numero de documento';
    grupo.appendChild(input);

    // Span donde se mostrará el mensaje de error si el campo queda vacío
    const errorSpan = document.createElement('span');
    errorSpan.className = 'form__error';
    errorSpan.id        = 'buscar-input-error';
    grupo.appendChild(errorSpan);

    formulario.appendChild(grupo);

    // Botón de submit del formulario de búsqueda
    const boton = document.createElement('button');
    boton.type      = 'submit';
    boton.className = 'btn btn--primary';

    // El span interior es requerido por la clase btn del proyecto (ver styles.css)
    const textoBoton = document.createElement('span');
    textoBoton.className   = 'btn__text';
    textoBoton.textContent = 'Buscar mis tareas';
    boton.appendChild(textoBoton);
    formulario.appendChild(boton);

    card.appendChild(formulario);

    // Área de resultado que empieza oculta con la clase 'hidden'
    // Se revela cuando hay un resultado de búsqueda para mostrar
    const areaResultado = document.createElement('div');
    areaResultado.id        = 'buscar-resultado';
    areaResultado.className = 'buscar-resultado hidden';
    card.appendChild(areaResultado);

    contenedor.appendChild(card);

    // Listener que limpia el error del campo mientras el usuario escribe
    // Mejora la UX: el error desaparece en cuanto el usuario empieza a corregir
    input.addEventListener('input', function() {
        errorSpan.textContent = '';
        input.classList.remove('error');
    });

    // Listener del submit del formulario de búsqueda
    formulario.addEventListener('submit', async function(event) {
        // Se previene el comportamiento nativo que recargaría la página
        event.preventDefault();

        const documento = input.value.trim();

        // Se valida que el campo no esté vacío antes de hacer la petición
        if (!documento) {
            const msg = 'El documento del usuario es obligatorio';
            errorSpan.textContent = msg;
            input.classList.add('error');
            // FEAT #57: toast descriptivo en lugar de dejar solo el span
            await mostrarNotificacion(msg, 'error');
            return;
        }

        // Se revela el área de resultado y se muestra un mensaje de carga
        areaResultado.classList.remove('hidden');
        // Se vacía el resultado anterior con removeChild para no usar innerHTML
        while (areaResultado.firstChild) areaResultado.removeChild(areaResultado.firstChild);

        // Párrafo de carga mientras espera la respuesta del servidor
        const cargando = document.createElement('p');
        cargando.textContent = 'Buscando...';
        areaResultado.appendChild(cargando);

        // Se busca el usuario en el servidor por su número de documento
        const usuario = await buscarUsuarioPorDocumento(documento);

        // Se vacía el mensaje de carga antes de mostrar el resultado
        while (areaResultado.firstChild) areaResultado.removeChild(areaResultado.firstChild);

        // Si no se encontró ningún usuario se muestra el mensaje correspondiente
        if (!usuario) {
            const noEncontrado = document.createElement('p');
            noEncontrado.className   = 'buscar-resultado__no-encontrado';
            noEncontrado.textContent = `No se encontro ningun usuario con el documento: ${documento}`;
            areaResultado.appendChild(noEncontrado);
            return;
        }

        // Se obtienen las tareas del usuario filtrando por su id interno
        // El campo userId en las tareas guarda el id numérico, no el documento
        let tareas = [];
        try {
            tareas = await obtenerTareasDeUsuario(usuario.id);
        } catch (error) {
            console.error('Error al obtener las tareas del usuario:', error);
        }

        // Se pinta el resultado con los datos del usuario y su lista de tareas
        renderizarResultadoBusqueda(areaResultado, usuario, tareas);
    });
}

// Construye y muestra el resultado de búsqueda con los datos del usuario y sus tareas
// Parámetros:
//   area    — el div donde se inserta el resultado
//   usuario — objeto del usuario encontrado
//   tareas  — arreglo de tareas asignadas a ese usuario
function renderizarResultadoBusqueda(area, usuario, tareas) {

    // Se vacía el área antes de pintar el nuevo resultado
    while (area.firstChild) area.removeChild(area.firstChild);

    // Título con el nombre del usuario encontrado
    const tituloUsuario = document.createElement('h3');
    tituloUsuario.className   = 'buscar-resultado__titulo';
    tituloUsuario.textContent = `Usuario: ${usuario.name}`;
    area.appendChild(tituloUsuario);

    // Si no tiene tareas se muestra un mensaje informativo y se termina
    if (tareas.length === 0) {
        const sinTareas = document.createElement('p');
        sinTareas.className   = 'buscar-resultado__sin-tareas';
        sinTareas.textContent = 'No tienes tareas asignadas.';
        area.appendChild(sinTareas);
        return;
    }

    // Párrafo con el contador de tareas encontradas
    const contador = document.createElement('p');
    contador.className   = 'buscar-resultado__contador';
    contador.textContent = `Tareas asignadas: ${tareas.length}`;
    area.appendChild(contador);

    // Lista de tareas con título y badge de estado por cada una
    const lista = document.createElement('ul');
    lista.className = 'buscar-resultado__lista';

    tareas.forEach(function(tarea) {

        // Elemento de lista que contiene el título y el badge de estado
        const item = document.createElement('li');
        item.className = 'buscar-resultado__item';

        // Span con el título de la tarea
        const tituloTarea = document.createElement('span');
        tituloTarea.className   = 'buscar-resultado__tarea-titulo';
        tituloTarea.textContent = tarea.title;

        // Badge coloreado con el estado de la tarea
        // classList.add acepta múltiples clases: la base y la dinámica de color
        const badge = document.createElement('span');
        badge.classList.add('status-badge', `status-${tarea.status}`);
        badge.textContent = formatearEstado(tarea.status);

        item.appendChild(tituloTarea);
        item.appendChild(badge);
        lista.appendChild(item);
    });

    area.appendChild(lista);
}

// Convierte el valor técnico del estado a texto legible en español
// Se usa para los badges de la lista de tareas de este módulo
// Parámetro: estado — valor del campo status (pendiente, en_progreso, completada)
function formatearEstado(estado) {
    const mapa = {
        pendiente:   'Pendiente',
        en_progreso: 'En Progreso',
        completada:  'Completada'
    };
    // Si el estado no existe en el mapa se retorna el valor original como fallback
    return mapa[estado] || estado;
}