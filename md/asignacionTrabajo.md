# Asignacion de Trabajo — Punto D: Transferencia del Conocimiento
## Sistema de Gestion de Tareas

- Autores: Karol Nicolle Torres Fuentes, Juan Sebastian Patiño Hernandez
- Institucion: SENA - Tecnico en Programacion de Software
- Instructor: John Freddy Becerra Castellanos
- Fecha: 23-02-2026

---

## Contexto

El sistema CRUD modularizado fue aprobado en su version actual con los cuatro requisitos base funcionando. En esta fase se implementan cuatro nuevos requisitos funcionales sobre la arquitectura modular ya existente, respetando la separacion de capas establecida.

El equipo esta compuesto por dos integrantes. Karol actua como lider del repositorio y es quien creo el repositorio principal en GitHub. Es responsable de la rama main, la rama release y su propia rama de trabajo llamada desarrolladora. Juan trabaja desde un fork del repositorio con su rama developer.

---

## Estructura de ramas

- main es la rama del repositorio original donde queda la version final validada. Solo recibe merges desde release mediante un TAG al finalizar todo el trabajo.

- release es la rama de integracion del repositorio original. Aqui llegan los Pull Request de ambos integrantes. Karol revisa, valida y aprueba o rechaza los cambios antes de que queden en esta rama.

- desarrolladora es la rama personal de trabajo de Karol dentro del repositorio original. Desde aqui hace sus commits y sube sus cambios para luego abrir un PR hacia release.

- developer es la rama de trabajo de Juan dentro de su fork del repositorio. Desde aqui hace sus commits y abre PR hacia release del repositorio original de Karol.

---

## Rol de lider — Karol

Karol creo el repositorio original en GitHub y tiene control total sobre el. Sus responsabilidades como lider son las siguientes.

1. Crear y mantener la rama release donde se integra todo el trabajo antes de subir a main.
2. Revisar cada Pull Request que Juan suba desde su fork. Si hay errores los rechaza con comentarios explicando que debe corregir. Si esta correcto lo aprueba y hace el merge hacia release.
3. Verificar antes del merge final que no existan dependencias circulares entre los modulos nuevos y los existentes.
4. Crear el TAG v1.0.0 y hacer el merge final de release hacia main cuando todo este validado y funcionando.

---

## Asignacion de requisitos funcionales

### Karol

RF03 — Sistema de notificaciones estructurado

Karol implementa el modulo de notificaciones visuales que reemplaza los alert() que existen actualmente en tareasService.js. Es un modulo independiente que no depende de la API ni de otros servicios.

Archivos que crea o modifica:

- utils/notificaciones.js es el archivo nuevo con la funcion mostrarNotificacion.
- services/tareasService.js lo modifica unicamente para reemplazar cada alert() por la funcion del modulo de notificaciones.
- styles.css lo modifica para agregar los estilos del componente toast.
- index.html lo modifica para agregar los controles visuales necesarios para los requisitos de Juan como el selector de orden, los filtros y el boton de exportar.

Adicionalmente Karol actualiza o crea los archivos de documentacion en la carpeta documentacion/ que sean necesarios para esta fase.

---

### Juan

RF01 — Filtro avanzado de tareas

Juan implementa la funcionalidad de filtrar las tareas visibles por estado, por ID de usuario, o con ambos criterios al mismo tiempo. La tabla se actualiza sin recargar la pagina.

Archivos que crea o modifica:

- utils/filtros.js es el archivo nuevo con la funcion pura de filtrado.
- services/tareasService.js lo modifica para integrar la funcion manejarFiltro y sus listeners.

---

RF02 — Ordenamiento dinamico

Juan implementa la funcionalidad de ordenar las tareas por titulo, por estado o por fecha de creacion.

Archivos que crea o modifica:

- utils/ordenamiento.js es el archivo nuevo con la funcion pura de ordenamiento.
- services/tareasService.js lo modifica para integrar la funcion manejarOrdenamiento y su listener.

---

RF04 — Exportacion de tareas

Juan implementa la funcionalidad de exportar las tareas visibles a un archivo JSON descargable.

Archivos que crea o modifica:

- utils/exportacion.js es el archivo nuevo con la funcion de exportacion.
- services/tareasService.js lo modifica para integrar la funcion manejarExportacion y su listener.

---

## Asignacion de requisitos no funcionales

### Karol

- RNF01 — Garantiza que cada modulo nuevo vaya en la carpeta correcta y no rompa la arquitectura de capas existente. Lo verifica al revisar cada PR de Juan.
- RNF05 — Antes del merge final verifica que no existan dependencias circulares entre los modulos. Si encuentra alguna la reporta para que se corrija antes del TAG.
- RNF03 y RNF04 — Tambien cumple estos en sus propios PR: documenta cada uno correctamente y usa commits descriptivos con el formato feat:, refactor: o style:.

### Juan

- RNF02 — Usa correctamente export e import en todos sus modulos nuevos. No usa variables globales.
- RNF03 — Cada PR que suba debe incluir descripcion del requisito, modulos creados o modificados, justificacion de decisiones tecnicas y evidencia de pruebas.
- RNF04 — Los commits siguen el formato establecido, por ejemplo: feat: crea modulo de filtrado utils/filtros.js o refactor: integra manejarFiltro en tareasService.

---

## Orden de implementacion

1. Karol implementa RF03 porque modifica tareasService.js y ese archivo tambien lo toca Juan. Hacerlo primero evita conflictos.
2. Al mismo tiempo Juan puede empezar RF02 porque los archivos que toca no se pisan con los de Karol en esta primera ronda.
3. Cuando ambos terminen hacen git pull desde release para sincronizarse antes de continuar.
4. Karol modifica index.html y styles.css con los controles visuales que necesitan los requisitos de Juan.
5. Juan implementa RF01 y RF04 con la seguridad de que el HTML ya tiene los elementos que necesita.
6. Karol revisa todo en release, valida que funcione, crea el TAG v1.0.0 y hace el merge hacia main.

---

## Nueva estructura de archivos

transferencia_dom_parejas/
- api/
    - tareasApi.js
- documentacion/
    - asignacionTrabajo.md
    - doctecnica.md
    - doctecnicaModularizacion.md
    - documentacion_crud.md
    - informeAnalisis.md
    - informeValidacion.md
- services/
    - tareasService.js
- ui/
    - tareasUI.js
- utils/
    - config.js
    - exportacion.js
    - filtros.js
    - notificaciones.js
    - ordenamiento.js
    - validaciones.js
- index.html
- script.js
- styles.css