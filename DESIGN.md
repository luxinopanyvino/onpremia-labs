# Diseño y guardrails de onpremIA Labs

## Objetivo
Establecer reglas claras para mantener el proyecto simple, mantenible y consistente, especialmente en el frontend estático y el backend ligero.

## Principios generales
- Mantener el código simple y fácil de leer.
- Priorizar compatibilidad con navegadores modernos sin necesidad de herramientas de compilación complejas.
- Utilizar solo dependencias necesarias; evitar frameworks y paquetes innecesarios.
- Documentar el propósito de los archivos clave y las decisiones de diseño.

## Estructura del proyecto
- `public_html/` : contenido estático servido al cliente.
- `public_html/index.html` : punto de entrada principal.
- `public_html/style.css` : estilos globales del sitio.
- `public_html/app.js` : lógica del frontend con React en el navegador.
- `public_html/data/` : carpeta que contiene archivos JSON de benchmarks.
- `public_html/data/benchmarks.json` : archivo JSON de benchmark por defecto.
- `public_html/contact.php` : endpoint de contacto en PHP (cuando está disponible en el hosting).
- `server.js` : servidor Node.js de desarrollo/local que sirve archivos estáticos y los endpoints `/data-files` y `/benchmarks`.

## Frontend
- Usar HTML semántico en `index.html`.
- Mantener CSS modular y legible en `style.css`.
- Reservar `app.js` para la lógica interactiva y manejo de estado.
- Evitar dependencias pesadas en el frontend; se permite React vía CDN para prototipos ligeros.
- Cargar datos de `public_html/data/benchmarks.json` usando `fetch` en el frontend.
- Manejar un fallback local cuando la carga del JSON falle.
- No mezclar lógica de servidor en el frontend.

## Backend / servidor local
- `server.js` debe ser un servidor ligero y fácil de ejecutar con Node.js.
- `server.js` sirve el sitio estático y expone los endpoints `/data-files` y `/benchmarks`.
- `/data-files` devuelve la lista de JSON disponibles en `public_html/data/`.
- `/benchmarks` puede seguir devolviendo `public_html/data/benchmarks.json` como alias.
- El endpoint `/contact.php` en el servidor de desarrollo puede devolver una respuesta mock si no hay PHP disponible.
- Mantener el comportamiento de CORS básico si se accede desde otros orígenes.
- No almacenar credenciales de SMTP ni datos sensibles en el repositorio.

## Datos y formatos
- Los archivos JSON de benchmark en `public_html/data/` deben mantener una estructura clara y extensible.
- Cada archivo puede representar una configuración de hardware distinta; la nomenclatura del archivo debe reflejar la configuración.
- Usar campos descriptivos y consistentes: `benchmark_id`, `timestamp`, `config`, `performance`, `cost`, `scores`.
- Evitar datos redundantes y mantener el JSON válido.
- Cualquier cambio en el esquema debe reflejarse en la normalización/validación del frontend.

## Diseño de la UI
- Priorizar una experiencia clara y profesional.
- Mostrar mensajes de estado útiles: carga, error, fallback demo.
- Mantener botones y acciones intuitivas.
- Usar textos en español coherentes con el público objetivo.

## Guardrails de mantenimiento
- Documentar cambios importantes en este archivo antes de modificar la arquitectura.
- Revisar que `server.js` no agregue dependencias innecesarias.
- No convertir este repositorio en un sistema complejo de build si el objetivo es una demo estática.
- Pasear el contenido en `public_html/` para evitar archivos obsoletos.

## Convenciones de nombres
- Archivos: minúsculas, sin espacios, con guiones o guiones bajos cuando sea necesario.
- Variables y constantes JavaScript: `camelCase` para variables, `SCREAMING_SNAKE_CASE` para valores constantes.
- Clases CSS: nombres legibles y prefijos simples si es necesario.

## Addendum
- Si se necesita expandir la app, prefiera separar más la lógica en archivos nuevos dentro de `public_html/`.
- Mantener `DESIGN.md` actualizado con cualquier regla nueva o decisión de arquitectura.
