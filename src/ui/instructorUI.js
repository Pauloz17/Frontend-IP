import { obtenerDashboard, obtenerTodasLasTareas, registrarTarea, eliminarTarea } from '../api/tareasApi.js';
import { obtenerTodosLosUsuarios } from '../api/usuariosApi.js';
import { renderizarDashboard, crearFilaTareaAdmin } from './tareasUI.js';
import { mostrarConfirmacion, mostrarNotificacion } from '../utils/notificaciones.js';
import { recargarCheckboxesDropdown, actualizarTextoDropdown } from './adminUI.js';
import { ocultarTodo } from './modoUI.js';

const $ = id => document.getElementById(id);
const limpiar = n => { while (n?.firstChild) n.removeChild(n.firstChild); };

// Muestra la pantalla verde del Instructor
export async function activarModoInstructor() {
    ocultarTodo();
    $('vistaInstructor').classList.remove('hidden');
    document.body.dataset.modo = 'instructor';
    
    actualizarNumeritosInstr();
    dibujarTablaUsuariosInstr();
    dibujarTablaTareasInstr();
    cargarListaAlumnosInstr();
}

// Pide los números al servidor y los pone en las tarjetas
async function actualizarNumeritosInstr() {
    const datos = await obtenerDashboard();
    if (datos) renderizarDashboard(datos, 'instrDash');
}

// Dibuja la lista de alumnos en la pantalla del instructor
async function dibujarTablaUsuariosInstr() {
    const tbody = $('instrUsersTableBody');
    if (!tbody) return;
    limpiar(tbody);

    let alumnos = await obtenerTodosLosUsuarios(); const inputBusqueda = document.getElementById("instrUserDocument"); if (inputBusqueda && inputBusqueda.value.trim() !== "") { const t = inputBusqueda.value.trim().toLowerCase(); alumnos = alumnos.filter(u => u.name.toLowerCase().includes(t) || u.documento.toLowerCase().includes(t) || (u.email && u.email.toLowerCase().includes(t)) || u.id.toString() === t); }
    if (!alumnos) return;

    alumnos.forEach((alumno, i) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${i + 1}</td>
            <td>${alumno.documento}</td>
            <td>${alumno.name}</td>
            <td>${alumno.email}</td>
        `;
        tbody.appendChild(fila);
    });
}

// Dibuja todas las tareas que existen
async function dibujarTablaTareasInstr() {
    const tbody = $('instrTasksTableBody');
    if (!tbody) return;
    limpiar(tbody);

    const tareas = await obtenerTodasLasTareas();
    tareas.forEach((t, i) => {
        const fila = crearFilaTareaAdmin(t, i, {
            onEdit: (t) => console.log('Editando...', t),
            onDelete: async (t) => {
                if (await mostrarConfirmacion('¿Borrar?', t.title)) {
                    await eliminarTarea(t.id);
                    dibujarTablaTareasInstr();
                }
            }
        });
        tbody.appendChild(fila);
    });
}

// Carga los nombres de los alumnos en el menú desplegable
async function cargarListaAlumnosInstr() {
    const panel = $('instrUsuariosDropdownPanel');
    if (!panel) return;
    limpiar(panel);

    let alumnos = await obtenerTodosLosUsuarios(); const inputBusqueda = document.getElementById("instrUserDocument"); if (inputBusqueda && inputBusqueda.value.trim() !== "") { const t = inputBusqueda.value.trim().toLowerCase(); alumnos = alumnos.filter(u => u.name.toLowerCase().includes(t) || u.documento.toLowerCase().includes(t) || (u.email && u.email.toLowerCase().includes(t)) || u.id.toString() === t); }
    alumnos.forEach(a => {
        const item = document.createElement('label');
        item.className = 'usuarios-dropdown__opcion';
        item.innerHTML = `<input type="checkbox" value="${a.id}"> <span>${a.name}</span>`;
        panel.appendChild(item);
    });
}

// Prepara los botones del instructor
// Prepara el panel del profesor
export async function inicializarInstructorUI() { const searchFormInstr = document.getElementById("instrSearchUserForm"); if (searchFormInstr) { searchFormInstr.onsubmit = (e) => { e.preventDefault(); dibujarTablaUsuariosInstr(); }; }
    const btnMenu = $('instrUsuariosDropdownBtn');
    const panel = $('instrUsuariosDropdownPanel');
    const texto = $('instrUsuariosDropdownTexto');

    if (btnMenu) btnMenu.onclick = () => panel.classList.toggle('hidden');

    const form = $('instrCreateTaskForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const IDs = Array.from(panel.querySelectorAll('input:checked')).map(i => i.value);
            
            const nueva = {
                title: $('instrNewTaskTitle').value,
                status: $('instrNewTaskStatus').value,
                assignedUsers: IDs
            };

            if (await registrarTarea(nueva)) {
                mostrarNotificacion('¡Tarea creada!', 'exito');
                form.reset();
                dibujarTablaTareasInstr();
                actualizarNumeritosInstr();
            }
        };
    }
}

