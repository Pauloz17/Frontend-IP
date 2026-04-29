# Parte 4: Informe de Validación Técnica y Reflexión

**Autores:** Karol Nicolle Torres Fuentes, Juan Sebastian Patiño Hernandez  
**Institución:** SENA – Técnico en Programación de Software  
**Fecha:** 19-02-2026

---

## 1. ¿Qué archivo actúa como punto de entrada del sistema?

El archivo `script.js`, ubicado en la raíz del proyecto, es el único punto de entrada de la aplicación y el único referenciado directamente desde `index.html`. Su misión es orquestar el arranque: registra los event listeners llamando a `registrarEventListeners()` desde `services/tareasService.js`, inicializa el estado visual con `mostrarEstadoVacio()` desde `ui/tareasUI.js`, y confirma la configuración imprimiendo en consola la `API_BASE_URL` importada de `utils/config.js`.

Todo esto ocurre dentro del evento `DOMContentLoaded`, lo que garantiza que el árbol del DOM esté completamente construido antes de ejecutar cualquier lógica. El archivo es deliberadamente corto: no contiene lógica de negocio, no realiza peticiones HTTP ni manipula el DOM directamente. Su única responsabilidad es dar la señal de inicio a los demás módulos.

---

## 2. ¿Puede el módulo UI comunicarse directamente con la API? ¿Por qué?

No puede ni debe hacerlo. Esta restricción está declarada explícitamente en el encabezado de `tareasService.js`: la UI nunca llama directamente a la API, todo pasa por el service. El flujo obligatorio va del usuario al evento, del evento al service, del service a la API, y la respuesta regresa por el mismo camino hasta llegar a la UI y finalmente al DOM.

La razón de fondo es la separación de responsabilidades. La capa UI tiene una única misión: transformar datos en elementos visuales del DOM. Si también realizara peticiones HTTP estaría asumiendo responsabilidades ajenas, lo que generaría acoplamiento fuerte entre capas, dificultaría las pruebas y haría el sistema más difícil de mantener. El service es el único módulo que conoce tanto a la API como a la UI; ninguna de las dos se conoce entre sí.

---

## 3. ¿Qué ocurriría si cambia la URL de la API?

Gracias a `utils/config.js`, solo habría que modificar un único valor en un único archivo. La constante `API_BASE_URL` está centralizada ahí y todos los módulos que la necesitan la importan desde ese lugar. Si el servidor cambiara de puerto o pasara a un dominio de producción, el cambio se propagaría automáticamente a `tareasApi.js` y a `script.js` sin tocar ningún otro archivo.

Sin esta centralización, la URL estaría duplicada en varios módulos y cualquier cambio de servidor exigiría buscar y reemplazar manualmente en múltiples lugares, con alto riesgo de omisiones y errores difíciles de rastrear.

---

## 4. ¿La estructura actual facilita agregar nuevas funcionalidades?

Sí, de manera significativa. La arquitectura por capas hace que agregar una nueva funcionalidad sea un proceso ordenado y predecible. Por ejemplo, para implementar un RF-05 de filtrado de tareas por estado, el equipo agregaría la función de petición en `tareasApi.js`, el manejador de lógica en `tareasService.js` y la función de renderizado en `tareasUI.js`, sin necesidad de modificar `script.js` ni alterar las funcionalidades ya existentes.

Cada módulo tiene una responsabilidad acotada, lo que permite extender el sistema en paralelo sin que los cambios de un desarrollador interfieran con el trabajo del otro. Esta es una de las ventajas más concretas de respetar la separación de capas desde el inicio del proyecto.

---

## 5. ¿Se redujo la complejidad del archivo principal?

Sí, de forma notable. El archivo `script.js` contiene únicamente tres llamadas funcionales dentro del `DOMContentLoaded`: delegar el registro de eventos al service, delegar la inicialización visual a la UI, y un mensaje de diagnóstico en consola. Toda la complejidad real —validaciones, peticiones HTTP, actualización del DOM, manejo de errores y estado de la aplicación— vive en los módulos que le corresponden.

Esto contrasta con el antipatrón habitual de proyectos sin arquitectura definida, donde el archivo principal termina siendo un bloque de cientos de líneas con lógica mezclada. En este sistema, `script.js` es tan simple que puede leerse y entenderse en menos de un minuto, lo cual es un indicador claro de que la separación de responsabilidades se aplicó correctamente a lo largo de todo el proyecto.

---

## Conclusión

El proyecto demuestra una implementación coherente de la arquitectura en capas para aplicaciones frontend. La combinación de un punto de entrada limpio, una capa de servicios como orquestador central, comunicación HTTP encapsulada, presentación desacoplada y utilidades reutilizables produce un sistema fácil de leer, mantener y extender, cumpliendo los principios fundamentales de diseño de software del programa técnico del SENA.