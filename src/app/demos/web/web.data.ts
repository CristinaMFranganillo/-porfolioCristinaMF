/* Marca y contenidos ficticios para la demo de web corporativa. */
export type Categoria = 'Privacidad y ética' | 'Personas e igualdad' | 'Sostenibilidad' | 'Gestión y calidad';
export interface Area { id: string; nombre: string; categoria: Categoria; desc: string; puntos: string[]; icono: string; }

export const CATEGORIAS: Categoria[] = ['Privacidad y ética', 'Personas e igualdad', 'Sostenibilidad', 'Gestión y calidad'];

export const AREAS: Area[] = [
  { id: 'datos', nombre: 'Protección de datos', categoria: 'Privacidad y ética', desc: 'Adecuación y mantenimiento continuo al RGPD y la LOPDGDD.', puntos: ['Registro de actividades', 'Gestión de derechos'], icono: 'M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z' },
  { id: 'etico', nombre: 'Canal ético', categoria: 'Privacidad y ética', desc: 'Sistema interno de información conforme a la Ley 2/2023.', puntos: ['Denuncias anónimas', 'Gestión de expedientes'], icono: 'M4 5h16v11H8l-4 4z' },
  { id: 'compliance', nombre: 'Compliance penal', categoria: 'Privacidad y ética', desc: 'Modelo de prevención de delitos y mapa de riesgos.', puntos: ['Mapa de riesgos', 'Formación'], icono: 'M12 3v18M5 7h14M7 7l-3 7h6zM17 7l-3 7h6z' },
  { id: 'igualdad', nombre: 'Plan de igualdad', categoria: 'Personas e igualdad', desc: 'Diagnóstico, negociación y registro del plan.', puntos: ['Registro retributivo', 'Seguimiento de medidas'], icono: 'M8 8a3 3 0 106 0 3 3 0 00-6 0M5 20c0-4 3-6 6-6s6 2 6 6' },
  { id: 'acoso', nombre: 'Protocolo de acoso', categoria: 'Personas e igualdad', desc: 'Prevención y actuación frente al acoso laboral y sexual.', puntos: ['Protocolo adaptado', 'Comisión instructora'], icono: 'M12 21a9 9 0 110-18 9 9 0 010 18zM12 8v5M12 16h.01' },
  { id: 'horario', nombre: 'Registro horario', categoria: 'Personas e igualdad', desc: 'Control de jornada desde web y móvil.', puntos: ['Fichaje con geolocalización', 'Informes para inspección'], icono: 'M12 21a9 9 0 110-18 9 9 0 010 18zM12 7v5l3 3' },
  { id: 'huella', nombre: 'Huella de carbono', categoria: 'Sostenibilidad', desc: 'Cálculo, reducción e inscripción en el registro oficial.', puntos: ['Alcances 1, 2 y 3', 'Plan de reducción'], icono: 'M5 19c8 0 14-6 14-14C11 5 5 11 5 19zM5 19l7-7' },
  { id: 'informes', nombre: 'Informes no financieros', categoria: 'Sostenibilidad', desc: 'Estado de información no financiera y sostenibilidad.', puntos: ['Indicadores ESG', 'Verificación'], icono: 'M5 20V10M12 20V4M19 20v-7' },
  { id: 'iso', nombre: 'Sistemas ISO', categoria: 'Gestión y calidad', desc: 'Implantación y mantenimiento de ISO 9001, 14001 y 45001.', puntos: ['Auditorías internas', 'Acompañamiento a certificación'], icono: 'M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.5-.8z' },
];

export const SECTORES = ['Industria', 'Alimentación', 'Sector público', 'Servicios profesionales', 'Comercio y retail', 'Salud', 'Otro'];
export const PLANTILLAS = ['1–9', '10–49', '50–249', '250–999', '1.000+'];
export const IMPLANTADO = [
  { v: 'no', t: 'No, empezamos de cero', d: 'Implantación completa' },
  { v: 'parcial', t: 'Parcialmente', d: 'Hay documentación previa' },
  { v: 'revisar', t: 'Sí, quiero revisarlo', d: 'Auditoría y mejora' },
];
export const PLAZOS = [
  { v: 'sin-prisa', t: 'Sin prisa', d: 'Planificación' },
  { v: '3-meses', t: 'Próximos 3 meses', d: 'Queremos empezar pronto' },
  { v: 'urgente', t: 'Urgente', d: 'Inspección o plazo legal' },
];
