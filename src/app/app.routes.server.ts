import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * La home se genera como HTML estático en el build, para que buscadores, LinkedIn,
 * herramientas de selección y asistentes de IA lean el contenido sin ejecutar JavaScript.
 * Las demos interactivas siguen renderizándose en el navegador.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
