# Informe Técnico de Cambios — Frontend
**Proyecto:** transferencia_dom_parejas  
**Autores:** Karol Nicolle Torres Fuentes | Juan Sebastián Patiño Hernández  
**Institución:** SENA — Técnico en Programación de Software  
**Fecha:** Marzo 2026  
**Versión:** 2.0

---

## Bugs Corregidos en el Frontend

| Bug | Archivo | Causa | Solución |
|-----|---------|-------|----------|
| Filtro por usuario no funcionaba | `tareasService.js` | `userId` guardaba el id interno en lugar del documento | Cambiar `usuarioActual.id` por `usuarioActual.documento` |
| `buscarUsuario` no encontraba tareas | `buscarUsuario.js` | El filtro usaba `assignedUsers` (campo inexistente) en lugar de `userId` | Cambiar el filtro para comparar `tarea.userId === usuario.id` (este cambio no se hizo, porque no es necesario en el localhost, solo en el servidor backend que estamos desarrollando, pero igual se deja anotado)|

---

## 5. Estructura Final del Frontend

```
transferencia_dom/
├── src/
│   ├── api/
│   │   ├── tareasApi.js
│   │   └── usuariosApi.js        
│   ├── services/
│   │   └── tareasService.js      ← modificado
│   ├── ui/
│   │   ├── adminPanel.js         ← se puede modificar por practicas (no es obligatorio con el sevidor localhost simulado)
│   │   ├── buscarUsuario.js      
│   │   └── tareasUI.js
│   └── utils/
│       ├── config.js
│       ├── exportacion.js
│       ├── filtros.js
│       ├── notificaciones.js
│       ├── ordenamiento.js
│       └── validaciones.js
├── main.js                       
├── index.html
├── styles.css
└── package.json
```

---

## 6. Notas Finales

- **Compatibilidad con el backend futuro:** `usuariosApi.js` y `adminPanel.js` ya usan las rutas `/api/users` y `/api/tasks` que expondrá el backend definitivo. Cuando esté listo, solo se necesita actualizar `API_BASE_URL` en `utils/config.js`.
- **Cómo iniciar el frontend:** `npm run dev` desde la carpeta del proyecto (requiere el servidor corriendo en `localhost:3000`).

---