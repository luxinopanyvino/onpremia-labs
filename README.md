# onpremIA Labs

## Descripción del proyecto
onpremIA Labs es una aplicación web ligera para mostrar y comparar benchmarks de hardware on-premise orientado a modelos de IA local. Está diseñada como una demo estática con un servidor Node.js de desarrollo que entrega datos JSON y archivos estáticos.

## Lógica de negocio
- El frontend se ejecuta desde `public_html/index.html` y utiliza React cargado desde CDN en el navegador.
- `public_html/app.js` gestiona la lógica de la aplicación:
  - consulta el archivo `public_html/data/benchmarks.json` mediante `fetch` para obtener los datos de benchmark.
  - si no logra cargar el JSON, usa datos de ejemplo definidos en `HARDCODED_BENCHMARKS`.
  - normaliza y valida el formato de benchmark antes de mostrarlo.
  - presenta tarjetas de configuraciones, rankings y métricas clave en la UI.
- Los datos se almacenan en `public_html/data/benchmarks.json` y contienen información de hardware, inferencia, performance, costos y puntuaciones.
- El servidor de desarrollo (`server.js`) sirve el sitio estático y ofrece un endpoint `/benchmarks` compatible si se desea una ruta de alias.
- El endpoint `POST /contact.php` devuelve una respuesta simulada cuando no hay PHP disponible localmente.
- En un despliegue real, `public_html/contact.php` puede usarse para procesar formularios de contacto y enviar correo si se configura SMTP fuera del directorio público.

## Estructura principal
- `public_html/index.html`: punto de entrada web.
- `public_html/style.css`: estilos globales.
- `public_html/app.js`: lógica de la aplicación y consumo de datos.
- `public_html/data/benchmarks.json`: datos de benchmark consumidos por la app.
- `public_html/contact.php`: endpoint de contacto PHP para hosting con PHP.
- `server.js`: servidor Node.js local que sirve archivos estáticos y el endpoint `/benchmarks`.
- `DESIGN.md`: guardrails y reglas de diseño del proyecto.

## Endpoints disponibles
- `GET /data-files`: devuelve la lista de archivos JSON disponibles en `public_html/data/`.
- `GET /benchmarks`: devuelve el contenido de `public_html/data/benchmarks.json` como JSON.
- `POST /contact.php`: devuelve un JSON simulado con `{ success: true, message: 'Contact form submitted (mock)' }` en el servidor de desarrollo.

## Carga de benchmarks desde JSON
- La aplicación puede cargar múltiples archivos JSON desde `public_html/data/`.
- Cada archivo JSON puede representarse como una configuración de hardware y su nombre puede usar la nomenclatura de hardware.
- La app usa un selector para elegir el archivo JSON configurado y cargar sus benchmarks.
- Para actualizar o agregar benchmarks, crea o edita archivos `*.json` en `public_html/data/` y recarga la página.

## Requisitos
- Node.js instalado.
- No se requiere un entorno de compilación frontend adicional.

## Pasos para levantar el servidor JS
1. Abrir terminal en la raíz del proyecto:
   ```bash
   cd c:\projects\onpremialabs
   ```
2. Iniciar el servidor Node.js:
   ```bash
   node server.js
   ```
3. Abrir el navegador en:
   ```
   http://localhost:8000
   ```
4. La aplicación cargará datos desde `/benchmarks` y mostrará los benchmarks disponibles.

## Notas adicionales
- Si desea usar PHP para el contacto, coloque `smtp-config.php` fuera de `public_html` siguiendo las indicaciones en `public_html/contact.php`.
- Para actualizar los benchmarks, modifique `public_html/data/benchmarks.json` y vuelva a recargar la página.
- El servidor Node.js es ideal para desarrollo local; el despliegue final puede usar un servidor web estático y PHP en el hosting.
