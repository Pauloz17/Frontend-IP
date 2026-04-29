# Justificación Técnica — Git Tag v2.1.0

**Proyecto:** Sistema de Gestión de Tareas — TRANSFERENCIA_DOM  
**Autores:** Karol Nicolle Torres Fuentes | Juan Sebastián Patiño Hernández  
**SENA — Febrero 2026**

---

## Qué es un Git Tag y por qué se usa

Un Git Tag es una referencia fija que apunta a un commit específico del historial y no se mueve aunque se sigan agregando commits. Se usa para marcar puntos importantes en el desarrollo del proyecto, como entregas, versiones estables o hitos funcionales. A diferencia de las ramas, que avanzan con cada commit, un tag permanece anclado al momento exacto en que fue creado.

En este proyecto se usa un tag **anotado** (`git tag -a`) en lugar de uno simple porque el tag anotado almacena el autor, la fecha y un mensaje descriptivo, lo que lo hace trazable y adecuado para documentar formalmente una versión.

---

## Qué es el versionado semántico

El versionado semántico organiza las versiones en tres números con el formato `vMAJOR.MINOR.PATCH`, donde cada número comunica el tipo de cambio que se realizó.

El **MAJOR** sube cuando los cambios rompen la compatibilidad con versiones anteriores. El **MINOR** sube cuando se agrega funcionalidad nueva sin romper nada existente. El **PATCH** sube cuando solo se corrigen errores o bugs sin agregar funcionalidad nueva.

---

## Por qué la versión es v2.1.0 y no otra

El proyecto llegó a `v2.0.0` después de la migración a Vite, que representó un cambio mayor en la forma de ejecutar y construir la aplicación. A partir de esa base estable se trabajó el Punto D.

El **MAJOR se mantiene en 2** porque la integración de SweetAlert2 no rompe ninguna funcionalidad existente. La aplicación sigue funcionando exactamente igual desde el punto de vista del usuario y de la API. Los módulos que ya existían no cambiaron su comportamiento ni su interfaz pública.

El **MINOR sube de 0 a 1** porque se incorporó funcionalidad nueva de forma aditiva. Se reescribió `notificaciones.js` exportando dos funciones nuevas (`mostrarNotificacion` y `mostrarConfirmacion`), se instaló una dependencia de producción (`sweetalert2`), se extendió `styles.css` con nuevas clases personalizadas y se actualizó `tareasService.js` para consumir la nueva función de confirmación. Todo esto sin modificar el comportamiento de ningún otro módulo del proyecto.

El **PATCH se mantiene en 0** porque no se corrigió ningún bug. El cambio fue una mejora funcional planificada, no una corrección de errores.

---

## Comando utilizado

```bash
git tag -a v2.1.0 -m "feat: integración SweetAlert2 — reemplazo de diálogos nativos del navegador"
git push origin v2.1.0
```