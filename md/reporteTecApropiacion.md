# REPORTE TÉCNICO
## Ejecución y Análisis de Scripts Vite

**Proyecto:** Sistema de Gestión de Tareas — TRANSFERENCIA_DOM

**Autores:** Karol Nicolle Torres Fuentes | Juan Sebastián Patiño Hernández

**SENA — Técnico en Programación de Software | Febrero 2026**

---

## 1. Introducción

Este reporte documenta la ejecución de los tres scripts configurados en el proyecto tras su migración a Vite: `npm run dev`, `npm run build` y `npm run preview`. Para cada uno se registra qué acción ejecuta, qué archivos genera, las diferencias frente a la ejecución tradicional y los mensajes que muestra la terminal. Al final se responden los puntos de reflexión sobre la interacción con el DOM.

---

## 2. Análisis de Scripts

### 2.1 npm run dev

Este comando inicia el servidor de desarrollo de Vite en `localhost:5173`. Su propósito es facilitar la programación activa: detecta cambios en los archivos automáticamente y actualiza el navegador sin necesidad de recargarlo manualmente gracias al **Hot Module Replacement (HMR)**.

No genera ningún archivo permanente en el disco, trabaja completamente en memoria. Frente a la ejecución tradicional, antes se abría `index.html` directamente en el navegador con doble clic o Live Server, y cualquier cambio exigía presionar F5. Ahora la aplicación corre sobre un servidor HTTP real y los cambios se reflejan de inmediato. La terminal muestra lo siguiente al iniciarse:

```
VITE v7.3.1 ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Cada vez que se modifica un archivo, la terminal también registra:

```
[vite] hmr update /src/main.js
```

### 2.2 npm run build

Este comando ejecuta el proceso de construcción para producción. Vite analiza el grafo completo de módulos desde `/src/main.js`, resuelve todas las importaciones, combina los archivos y aplica minificación, generando la carpeta `/dist` con el resultado final.

Dentro de `/dist` queda un `index.html` procesado y una carpeta `assets/` con el JavaScript y el CSS minificados, cada archivo con un hash único en el nombre para garantizar que el navegador siempre cargue la versión más reciente. Frente a la ejecución tradicional, antes no existía ninguna versión optimizada: se entregaban los archivos fuente tal como estaban escritos y el navegador debía cargar cada módulo por separado. Ahora el código queda comprimido y combinado en pocos archivos. La terminal muestra:

```
vite v7.3.1 building client environment for production...
✓ 13 modules transformed.
dist/index.html                 22.85 kB │ gzip: 4.35 kB
dist/assets/index-CfGuFO6k.css  10.74 kB │ gzip: 2.69 kB
dist/assets/index-Djjy832J.js   11.62 kB │ gzip: 3.58 kB
✓ built in 378ms

```

### 2.3 npm run preview

Este comando levanta un servidor local en `localhost:4173` que sirve el contenido de `/dist` tal como está. Su único propósito es simular el entorno de producción antes de subir la aplicación a un servidor real, permitiendo verificar que el build funciona correctamente. No genera ni modifica ningún archivo; la carpeta `/dist` debe existir previamente.

A diferencia de `npm run dev`, aquí no hay HMR ni herramientas de depuración, y el código que se ejecuta es el minificado. Si algo funciona en desarrollo pero falla en preview, el problema está en el proceso de build. La terminal muestra:

```
➜  Local: http://localhost:4173/
➜  press h + enter to show help
```

---

## 3. Puntos de Reflexión sobre el DOM

### 3.1 ¿Qué elemento del DOM se selecciona?

La aplicación selecciona elementos mediante `document.getElementById()`. Los principales son el input del documento del usuario, los campos del formulario de tareas (título, descripción y estado), el `tbody` de la tabla principal, los controles de filtro y ordenamiento, y el botón de exportación JSON.

### 3.2 ¿Qué evento provoca el cambio en la página?

Los cambios son desencadenados por eventos `click` en los botones de buscar, registrar, editar y eliminar, y por el evento `change` en los selectores de filtro y ordenamiento. Cada evento está conectado a su manejador desde `tareasService.js` mediante `addEventListener`.

### 3.3 ¿Qué nuevo elemento se crea?

Al registrar una tarea se crea dinámicamente una fila `<tr>` con celdas para el ID de usuario, título, descripción, estado y dos botones de acción (Editar y Eliminar). Paralelamente se crea un elemento `<div>` tipo toast que notifica visualmente al usuario el resultado de la operación.

### 3.4 ¿Dónde se inserta ese elemento?

La fila `<tr>` se inserta como hijo del `<tbody>` de la tabla principal. Las notificaciones toast se insertan dentro del contenedor `#notificaciones-contenedor`, que es hijo directo del `<body>` y se crea dinámicamente la primera vez que se necesita.

### 3.5 ¿Qué ocurre al repetir la acción?

Cada vez que se registra una tarea aparece una nueva fila en la tabla y una notificación de éxito. Al eliminar, la fila desaparece y se confirma con otra notificación. Al aplicar un filtro, el `tbody` se vacía y se repinta solo con las tareas que cumplen el criterio. Al cambiar el ordenamiento, las filas se reorganizan sin realizar nuevas peticiones al servidor.

---

## 4. Desarrollo vs Producción

El entorno de desarrollo prioriza la experiencia del programador: el código es legible, los errores se muestran con detalle en consola, los cambios se reflejan al instante y no se genera ningún archivo adicional. El entorno de producción prioriza la experiencia del usuario final: el código se minifica y combina para reducir tiempos de carga, los mensajes de error son mínimos y los archivos se organizan en `/dist` listos para ser desplegados en cualquier servidor.

La diferencia más visible está en el tamaño y legibilidad del código: un archivo que en desarrollo ocupa varias líneas comentadas y con nombres descriptivos, en producción queda en una sola línea con variables de una letra. La lógica es idéntica; solo cambia la forma en que se entrega al navegador.

---

## 5. Conclusiones

- La migración a Vite no alteró la lógica del proyecto. Todos los módulos, la API y la manipulación del DOM continúan funcionando exactamente igual.
- `npm run dev` elimina la necesidad de recargar el navegador manualmente y mejora la productividad del equipo de forma inmediata.
- `npm run build` demuestra que Vite optimiza el proyecto de forma real: reduce archivos, resuelve dependencias y genera una versión lista para despliegue.
- `npm run preview` es el paso de validación antes de publicar, garantizando que el build no introdujo errores invisibles durante el desarrollo.
- La separación entre `/src` y `/dist` establece un estándar profesional claro que facilita el trabajo colaborativo y el mantenimiento del proyecto.

---