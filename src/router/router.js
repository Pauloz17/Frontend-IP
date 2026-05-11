// MÓDULO: router.js
// Enrutador SPA (Single Page Application)
// Maneja la navegación entre rutas y renderización de vistas

const routes = {
  '/': () => import('../views/home.js'),
  '/login': () => import('../views/login.js'),
  '/admin': () => import('../views/admin.js'),
  '/usuario': () => import('../views/usuario.js'),
};

/**
 * Navega a una ruta especificada y renderiza la vista correspondiente
 * @param {string} path - La ruta a navegar (ej: '/admin', '/login')
 */
export function navigate(path) {
  window.history.pushState({}, '', path);
  renderRoute(path);
}

/**
 * Renderiza la vista correspondiente a la ruta actual
 * @param {string} path - La ruta a renderizar
 */
export function renderRoute(path) {
  const routeLoader = routes[path] || routes['/'];
  routeLoader()
    .then(module => module.default())
    .catch(err => console.error('Error al cargar la ruta:', err));
}

// Escuchar el evento popstate para el botón atrás del navegador
window.addEventListener('popstate', () => renderRoute(window.location.pathname));

// Renderizar la ruta actual al cargar la página
renderRoute(window.location.pathname);
