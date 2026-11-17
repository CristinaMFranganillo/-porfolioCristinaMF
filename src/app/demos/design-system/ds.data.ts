/* Design system multiempresa · datos de la demo.
   Tres capas: primitivos (valores) → semánticos (función) → componentes (solo consumen semánticos).
   Las marcas son ficticias. */

export type MarcaId = 'atalaya' | 'ribera' | 'jara';
export type Tema = 'claro' | 'oscuro';
export type Densidad = 'comoda' | 'compacta';

/** Capa 1 · primitivos: escalas de color con nombre de valor, nunca de función. */
export const PRIMITIVOS: Record<string, string> = {
  'neutral-0': '#FFFFFF', 'neutral-50': '#F6F7F9', 'neutral-100': '#EEF0F3', 'neutral-200': '#DDE1E7',
  'neutral-400': '#9AA3B2', 'neutral-600': '#556070', 'neutral-700': '#3A4352', 'neutral-800': '#252C38',
  'neutral-900': '#161B24', 'neutral-950': '#0D1117',
  'indigo-50': '#EEF0FE', 'indigo-300': '#A5B0FA', 'indigo-600': '#3341D1', 'indigo-700': '#2A34AB', 'indigo-900': '#1E2363',
  'teal-50': '#E8F6F4', 'teal-300': '#6FD3C3', 'teal-600': '#0F7668', 'teal-700': '#0C5E53', 'teal-900': '#0A3A34',
  'magenta-50': '#FCEEF5', 'magenta-300': '#F49AC4', 'magenta-600': '#B0215F', 'magenta-700': '#8E1A4C', 'magenta-900': '#4F0F2B',
  'red-50': '#FDECEC', 'red-300': '#FCA5A5', 'red-700': '#B42318', 'red-950': '#3B0D0C',
  'amber-50': '#FEF6E7', 'amber-300': '#FCD34D', 'amber-800': '#8A4B08', 'amber-950': '#3A2205',
  'green-50': '#E9F7EF', 'green-300': '#7EDCA6', 'green-700': '#18794E', 'green-950': '#0B2E1E',
};

export interface Marca {
  id: MarcaId;
  nombre: string;
  sector: string;
  escala: 'indigo' | 'teal' | 'magenta';
  radio: number;
}

export const MARCAS: Marca[] = [
  { id: 'atalaya', nombre: 'Atalaya', sector: 'Prevención', escala: 'indigo', radio: 8 },
  { id: 'ribera', nombre: 'Ribera', sector: 'Salud laboral', escala: 'teal', radio: 4 },
  { id: 'jara', nombre: 'Jara', sector: 'Formación', escala: 'magenta', radio: 14 },
];

export interface TokenSemantico {
  token: string;
  /** primitivo al que apunta, p. ej. «indigo-600» */
  ref: string;
  valor: string;
  uso: string;
}

/** Pares que deben cumplir contraste: [texto, fondo, mínimo, descripción] */
export const PARES: [string, string, number, string][] = [
  ['color-text', 'color-surface', 4.5, 'Texto sobre superficie'],
  ['color-text-muted', 'color-surface', 4.5, 'Texto secundario sobre superficie'],
  ['color-on-action', 'color-action-primary', 4.5, 'Texto del botón primario'],
  ['color-action-primary', 'color-surface', 4.5, 'Enlaces y botón secundario'],
  ['color-action-primary', 'color-action-subtle', 4.5, 'Chip activo'],
  ['color-danger', 'color-danger-subtle', 4.5, 'Mensaje de error'],
  ['color-warning', 'color-warning-subtle', 4.5, 'Aviso'],
  ['color-success', 'color-success-subtle', 4.5, 'Confirmación'],
  ['color-focus', 'color-surface', 3, 'Anillo de foco (no textual)'],
];

/** Capa 2 · semánticos: cada token nombra una función y apunta a un primitivo según marca y tema. */
export function semanticos(marca: Marca, tema: Tema): TokenSemantico[] {
  const b = marca.escala;
  const claro = tema === 'claro';
  const filas: [string, string, string][] = claro
    ? [
        ['color-action-primary', `${b}-600`, 'Botón primario, enlaces, chip activo'],
        ['color-action-hover', `${b}-700`, 'Hover del botón primario'],
        ['color-on-action', 'neutral-0', 'Texto sobre el color de acción'],
        ['color-action-subtle', `${b}-50`, 'Fondo de chip activo y fila seleccionada'],
        ['color-text', 'neutral-900', 'Texto principal'],
        ['color-text-muted', 'neutral-600', 'Etiquetas y texto secundario'],
        ['color-surface', 'neutral-0', 'Fondo de tarjetas y campos'],
        ['color-surface-sunken', 'neutral-50', 'Fondo de la página'],
        ['color-border', 'neutral-200', 'Bordes y separadores'],
        ['color-danger', 'red-700', 'Errores de validación'],
        ['color-danger-subtle', 'red-50', 'Fondo de alerta de error'],
        ['color-warning', 'amber-800', 'Avisos'],
        ['color-warning-subtle', 'amber-50', 'Fondo de aviso'],
        ['color-success', 'green-700', 'Confirmaciones'],
        ['color-success-subtle', 'green-50', 'Fondo de confirmación'],
        ['color-focus', `${b}-600`, 'Anillo de foco'],
      ]
    : [
        ['color-action-primary', `${b}-300`, 'Botón primario, enlaces, chip activo'],
        ['color-action-hover', `${b}-50`, 'Hover del botón primario'],
        ['color-on-action', 'neutral-950', 'Texto sobre el color de acción'],
        ['color-action-subtle', `${b}-900`, 'Fondo de chip activo y fila seleccionada'],
        ['color-text', 'neutral-50', 'Texto principal'],
        ['color-text-muted', 'neutral-400', 'Etiquetas y texto secundario'],
        ['color-surface', 'neutral-900', 'Fondo de tarjetas y campos'],
        ['color-surface-sunken', 'neutral-950', 'Fondo de la página'],
        ['color-border', 'neutral-700', 'Bordes y separadores'],
        ['color-danger', 'red-300', 'Errores de validación'],
        ['color-danger-subtle', 'red-950', 'Fondo de alerta de error'],
        ['color-warning', 'amber-300', 'Avisos'],
        ['color-warning-subtle', 'amber-950', 'Fondo de aviso'],
        ['color-success', 'green-300', 'Confirmaciones'],
        ['color-success-subtle', 'green-950', 'Fondo de confirmación'],
        ['color-focus', `${b}-300`, 'Anillo de foco'],
      ];
  return filas.map(([token, ref, uso]) => ({ token, ref, valor: PRIMITIVOS[ref], uso }));
}

/** Tokens de densidad y forma: no son color, pero siguen la misma regla. */
export function dimensiones(marca: Marca, densidad: Densidad): TokenSemantico[] {
  const c = densidad === 'compacta';
  return [
    { token: 'size-control', ref: c ? 'size-8' : 'size-10', valor: c ? '32px' : '40px', uso: 'Altura de botones y campos' },
    { token: 'space-inline', ref: c ? 'space-3' : 'space-4', valor: c ? '12px' : '16px', uso: 'Relleno horizontal' },
    { token: 'space-stack', ref: c ? 'space-2' : 'space-3', valor: c ? '8px' : '12px', uso: 'Separación vertical' },
    { token: 'font-size-body', ref: c ? 'text-13' : 'text-15', valor: c ? '13px' : '15px', uso: 'Texto de interfaz' },
    { token: 'radius-control', ref: `radius-${marca.radio}`, valor: `${marca.radio}px`, uso: 'Esquinas (definidas por la marca)' },
  ];
}
