# Portfolio · Cristina Martínez Franganillo

Frontend UX/UI & Design Systems Engineer. Este repositorio es a la vez mi portfolio y una muestra de cómo programo: Angular 19 con componentes standalone, signals, formularios reactivos y accesibilidad WCAG 2.2 AA.

## Qué incluye

| Ruta | Contenido |
| --- | --- |
| `/` | Portfolio: casos de estudio, proceso, trayectoria y un colofón que calcula en vivo el contraste de sus propios tokens. |
| `/demos/asistente` | **Caso 01.** Asistente IA de planificación: conversación con memoria de contexto («más tarde», «otro centro», «con una doctora»), opciones con porcentaje de ajuste y motivos, panel editable «Lo que he entendido», bloques de citas para grupos con selección de trabajadores, deshacer, valoración de respuestas, historial y reservas temporales con cuenta atrás. |
| `/demos/cobros` | **Caso 02.** Intranet de gestión de cobros: bandeja con filtros, orden, selección múltiple, reasignación, exportación CSV, paginación y ficha de expediente con pestañas, modales y validación. |
| `/demos/web-publica` | **Caso 03.** Web corporativa: catálogo de áreas filtrable y presupuesto en tres pasos con validación y resumen. |

Todos los datos son ficticios y las marcas de las demos son inventadas. Los proyectos reales se han anonimizado: no aparecen clientes, nombres de producto ni datos personales.

## Stack

- Angular 19 · standalone components · signals · control flow (`@if`, `@for`, `@switch`)
- Rutas con carga diferida por demo y `withComponentInputBinding()`
- SCSS con design tokens en custom properties, tema claro y oscuro
- Geist y Geist Mono servidas desde el propio proyecto (`@fontsource-variable`)
- Sin librerías de componentes: modal sobre `<dialog>` nativo, patrón ARIA tabs, avisos con `aria-live`

## Accesibilidad

- Landmarks, enlace de salto y foco visible en todos los controles
- Pestañas navegables con flechas, Inicio y Fin
- Modales con foco atrapado, Escape y retorno del foco
- Errores de formulario asociados con `aria-describedby` y foco en el primer campo con error
- Respeta `prefers-reduced-motion` y `prefers-color-scheme`

## Desarrollo

```bash
npm install
npm start          # http://localhost:4200
npm run build      # salida en dist/portfolio-cmf/browser
```

## Despliegue en Vercel

1. Sube esta carpeta a un repositorio de GitHub.
2. En Vercel: **Add New → Project** e importa el repositorio.
3. Vercel detecta Angular y lee `vercel.json` (build `npm run build`, salida `dist/portfolio-cmf/browser`, y reescritura a `index.html` para que funcionen las rutas de las demos).
4. Pulsa **Deploy**.

## Estructura

```
src/
  styles/                 tokens, base, estilos de la home y kit de controles de las demos
  app/
    core/                 tema y utilidades de contraste WCAG
    shared/               directiva de pestañas, modal, avisos y barra de demo
    pages/home/           portfolio
    demos/asistente/      caso 01
    demos/cobros/         caso 02
    demos/web/            caso 03
```
