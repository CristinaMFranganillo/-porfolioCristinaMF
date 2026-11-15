/*
 * Motor simulado del asistente de planificación.
 *
 * En el producto real la interpretación la hace un LLM y la disponibilidad sale de la agenda.
 * Aquí todo es local, determinista y con datos ficticios, pero el contrato es el mismo:
 * texto + contexto previo → intención + contexto actualizado → huecos puntuados y explicados.
 */

/* ——— Datos ficticios ——— */

export interface Trabajador { id: string; nombre: string; puesto: string; vence: Date; }
export interface Cliente { nombre: string; alias: string[]; centroHabitual: string; trabajadores: Trabajador[]; }
export interface Profesional { nombre: string; genero: 'f' | 'm'; centros: string[]; }

export const CENTROS = ['Sede Norte', 'Sede Sur', 'Sede Centro', 'Sede Oeste'];

export const PROFESIONALES: Profesional[] = [
  { nombre: 'Lucía Prieto', genero: 'f', centros: ['Sede Norte', 'Sede Sur'] },
  { nombre: 'Andrés Gil', genero: 'm', centros: ['Sede Norte', 'Sede Centro'] },
  { nombre: 'Marta Calvo', genero: 'f', centros: ['Sede Centro', 'Sede Oeste'] },
  { nombre: 'Javier Soto', genero: 'm', centros: ['Sede Sur', 'Sede Oeste'] },
];

const NOMBRES = ['Ana Ruiz', 'Pedro Molina', 'Lucía Fernández', 'Javier Sanz', 'Marta Gil', 'Carlos Rey', 'Elena Pozo', 'Raúl Vega',
  'Sara Núñez', 'Diego Mora', 'Irene Cano', 'Óscar León', 'Nuria Peña', 'Hugo Ramos', 'Clara Ortiz', 'Pablo Rubio', 'Rosa Lara', 'Iván Cruz'];
const PUESTOS = ['Soldador', 'Operario de planta', 'Carretillero', 'Administración', 'Mantenimiento', 'Conductor'];

function hash(s: string): number { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return Math.abs(h); }

function plantilla(cliente: string, n: number): Trabajador[] {
  const hoy = new Date();
  return Array.from({ length: n }, (_, i) => {
    const h = hash(cliente + i);
    return { id: `${cliente.slice(0, 3)}-${i}`, nombre: NOMBRES[(hash(cliente) + i) % NOMBRES.length], puesto: PUESTOS[h % PUESTOS.length], vence: addDays(hoy, 5 + (h % 40)) };
  }).sort((a, b) => a.vence.getTime() - b.vence.getTime());
}

export const CLIENTES: Cliente[] = [
  { nombre: 'Metalúrgica Guadiana', alias: ['metalurgica', 'guadiana'], centroHabitual: 'Sede Norte', trabajadores: plantilla('Metalúrgica Guadiana', 18) },
  { nombre: 'Frutas Vegas Altas', alias: ['frutas', 'vegas altas'], centroHabitual: 'Sede Sur', trabajadores: plantilla('Frutas Vegas Altas', 12) },
  { nombre: 'Transportes Sierra Sur', alias: ['transportes', 'sierra sur'], centroHabitual: 'Sede Centro', trabajadores: plantilla('Transportes Sierra Sur', 4) },
  { nombre: 'Cerámicas del Zújar', alias: ['ceramicas', 'zujar'], centroHabitual: 'Sede Oeste', trabajadores: plantilla('Cerámicas del Zújar', 7) },
  { nombre: 'Talleres Ribera', alias: ['talleres', 'ribera'], centroHabitual: 'Sede Norte', trabajadores: plantilla('Talleres Ribera', 5) },
];

/* ——— Contexto e intención ——— */

export type Franja = 'mañana' | 'tarde';
export interface Contexto {
  cliente: string | null;
  centro: string | null;
  fecha: Date | null;
  franja: Franja | null;
  profesional: string | null;      // nombre concreto
  genero: 'f' | 'm' | null;        // «con una profesional»
  personas: number;                // nº de citas a buscar
  trabajador: string | null;       // una persona concreta
}
export const CONTEXTO_VACIO: Contexto = { cliente: null, centro: null, fecha: null, franja: null, profesional: null, genero: null, personas: 1, trabajador: null };

export type Intencion = 'buscar' | 'mas' | 'deshacer' | 'ayuda' | 'saludo' | 'gracias' | 'reservar-primera';

export interface Interpretacion { intencion: Intencion; ctx: Contexto; cambios: string[]; }

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Interpreta un mensaje teniendo en cuenta lo ya hablado (relleno de huecos o «slot filling»). */
export function interpretar(texto: string, previo: Contexto, hoy = new Date()): Interpretacion {
  const t = norm(texto);
  let ctx: Contexto = { ...previo };
  const cambios: string[] = [];
  const set = <K extends keyof Contexto>(k: K, v: Contexto[K], etiqueta: string) => {
    if (v !== ctx[k]) { ctx[k] = v; cambios.push(etiqueta); }
  };

  if (/^(hola|buenas|buenos dias|buenas tardes)\b/.test(t) && t.length < 25) return { intencion: 'saludo', ctx, cambios };
  if (/^(gracias|genial|perfecto|vale)\b/.test(t) && t.length < 20) return { intencion: 'gracias', ctx, cambios };
  if (/(que puedes hacer|ayuda|como funciona|que sabes)/.test(t)) return { intencion: 'ayuda', ctx, cambios };
  if (/(deshaz|deshacer|cancela|anula)/.test(t)) return { intencion: 'deshacer', ctx, cambios };
  if (/(reserva la primera|reservala|la primera)/.test(t)) return { intencion: 'reservar-primera', ctx, cambios };

  // Cliente
  const cliente = CLIENTES.find((c) => c.alias.some((a) => t.includes(a)));
  if (cliente && cliente.nombre !== ctx.cliente) {
    // Petición nueva para otro cliente: se empieza de cero salvo lo que diga este mensaje
    if (previo.cliente) ctx = { ...CONTEXTO_VACIO };
    set('cliente', cliente.nombre, `cliente: ${cliente.nombre}`);
  }

  // Trabajador concreto («para Ana Ruiz»)
  const cli = CLIENTES.find((c) => c.nombre === ctx.cliente);
  const persona = cli?.trabajadores.find((w) => t.includes(norm(w.nombre)) || new RegExp(`\\bpara ${norm(w.nombre.split(' ')[0])}\\b`).test(t));
  if (persona) { set('trabajador', persona.nombre, `trabajador: ${persona.nombre}`); set('personas', 1, '1 cita'); }

  // Número de personas
  const n = t.match(/(\d{1,2})\s*(trabajadores|personas|citas|empleados|revisiones)/);
  if (n) { set('personas', Math.min(+n[1], 30), `${n[1]} citas`); ctx.trabajador = null; }
  else if (/(toda la plantilla|todos los (trabajadores|pendientes))/.test(t) && cli) { set('personas', cli.trabajadores.length, `${cli.trabajadores.length} citas`); }

  // Centro
  const ALIAS_CENTRO: [RegExp, string][] = [[/sede norte/, 'Sede Norte'], [/sede sur/, 'Sede Sur'], [/sede centro/, 'Sede Centro'], [/sede oeste/, 'Sede Oeste']];
  const centro = ALIAS_CENTRO.find(([re]) => re.test(t))?.[1];
  if (centro) set('centro', centro, `centro: ${centro}`);
  else if (/otro centro|en otro sitio|otra sede/.test(t)) {
    const actual = ctx.centro ?? cli?.centroHabitual ?? CENTROS[0];
    set('centro', CENTROS[(CENTROS.indexOf(actual) + 1) % CENTROS.length], 'otro centro');
  }

  // Fecha
  const m = t.match(/(\d{1,2})\s+de\s+([a-z]+)/);
  const dia = DIAS.findIndex((d) => new RegExp(`\\b(el |este |proximo )?${d}\\b`).test(t));
  if (m && MESES.includes(m[2])) {
    const f = new Date(hoy.getFullYear(), MESES.indexOf(m[2]), +m[1]);
    if (f < startOfDay(hoy)) f.setFullYear(f.getFullYear() + 1);
    set('fecha', f, `fecha: ${fmtFecha(f)}`);
  } else if (/pasado manana/.test(t)) set('fecha', addDays(hoy, 2), 'pasado mañana');
  else if (/\bhoy\b/.test(t)) set('fecha', startOfDay(hoy), 'hoy');
  else if (/\bmanana\b/.test(t) && !/por la manana|de manana|mas temprano/.test(t)) set('fecha', addDays(startOfDay(hoy), 1), 'mañana');
  else if (/(proxima semana|semana que viene)/.test(t)) set('fecha', addDays(startOfDay(hoy), ((8 - hoy.getDay()) % 7) || 7), 'la semana que viene');
  else if (dia >= 0) set('fecha', proximo(dia, hoy), `el ${DIAS[dia].replace('miercoles', 'miércoles').replace('sabado', 'sábado')}`);
  else if (/otro dia|otra fecha|mas adelante/.test(t) && ctx.fecha) set('fecha', siguienteLaborable(addDays(ctx.fecha, 1)), 'otro día');

  // Franja
  if (/(por la tarde|\btarde\b|mas tarde)/.test(t)) set('franja', 'tarde', 'por la tarde');
  else if (/(por la manana|de manana|primera hora|mas temprano|temprano)/.test(t)) set('franja', 'mañana', 'por la mañana');
  else if (/(cualquier hora|me da igual la hora)/.test(t)) set('franja', null, 'cualquier hora');

  // Profesional
  const prof = PROFESIONALES.find((p) => t.includes(norm(p.nombre.split(' ').slice(-1)[0])));
  if (prof) set('profesional', prof.nombre, `con ${prof.nombre}`);
  else if (/(una profesional|una doctora|con doctora|medica mujer|una mujer)/.test(t)) set('genero', 'f', 'con una profesional');
  else if (/(un doctor|con doctor|medico hombre|un hombre)/.test(t)) set('genero', 'm', 'con un profesional');
  else if (/(cualquier (medico|profesional)|me da igual (el|la) (medico|doctor))/.test(t)) { set('profesional', null, 'cualquier profesional'); set('genero', null, ''); }

  if (/(mas opciones|otras opciones|ver mas|alguna mas|mas huecos)/.test(t) && !cambios.length) return { intencion: 'mas', ctx, cambios };
  return { intencion: 'buscar', ctx, cambios: cambios.filter(Boolean) };
}

/* ——— Disponibilidad y puntuación ——— */

export interface Hueco { id: string; fecha: Date; centro: string; profesional: string; ajuste: number; motivos: string[]; }

/** Huecos libres de un centro en un día: mañanas 8:00–13:30 y tardes 16:00–18:30, con ocupación pseudoaleatoria. */
function huecosDelDia(centro: string, dia: Date): Hueco[] {
  if (dia.getDay() === 0 || dia.getDay() === 6) return [];
  const horas: [number, number][] = [];
  for (let h = 8; h < 14; h++) horas.push([h, 0], [h, 30]);
  if (centro !== 'Sede Oeste') for (let h = 16; h < 19; h++) horas.push([h, 0], [h, 30]); // Sede Oeste cierra por la tarde
  const profs = PROFESIONALES.filter((p) => p.centros.includes(centro));
  return horas.flatMap(([h, m]) => profs.map((p) => {
    const f = new Date(dia); f.setHours(h, m, 0, 0);
    return { id: `${centro}|${f.toISOString()}|${p.nombre}`, fecha: f, centro, profesional: p.nombre, ajuste: 0, motivos: [] };
  })).filter((x) => hash(x.id) % 100 > 62); // ≈ 37 % libres
}

export interface Busqueda { huecos: Hueco[]; sinHuecoEnFecha: boolean; centroCerradoTarde: boolean; }

export function buscar(ctx: Contexto, hoy = new Date()): Busqueda {
  const centroPref = ctx.centro ?? CLIENTES.find((c) => c.nombre === ctx.cliente)?.centroHabitual ?? CENTROS[0];
  const fechaPref = ctx.fecha && ctx.fecha >= startOfDay(hoy) ? ctx.fecha : siguienteLaborable(addDays(startOfDay(hoy), 1));
  const dias = Array.from({ length: 8 }, (_, i) => addDays(fechaPref, i));
  const candidatos = CENTROS.flatMap((c) => dias.flatMap((d) => huecosDelDia(c, d))).filter((h) => h.fecha > hoy);

  const puntuados = candidatos.map((h) => {
    const motivos: string[] = [];
    let s = 100;
    const dd = Math.round((startOfDay(h.fecha).getTime() - startOfDay(fechaPref).getTime()) / 864e5);
    if (dd > 0) { s -= 12 + dd * 6; if (ctx.fecha) motivos.push(dd === 1 ? 'Un día después' : `${dd} días después`); }
    if (h.centro !== centroPref) { s -= 30; motivos.push(ctx.centro ? 'Otro centro' : `Centro distinto al habitual (${centroPref})`); }
    const tarde = h.fecha.getHours() >= 15;
    if (ctx.franja && (ctx.franja === 'tarde') !== tarde) { s -= 22; motivos.push(`Fuera de la franja de ${ctx.franja}`); }
    if (ctx.profesional && h.profesional !== ctx.profesional) { s -= 15; motivos.push(`Con ${h.profesional}, no con ${ctx.profesional}`); }
    if (ctx.genero && PROFESIONALES.find((p) => p.nombre === h.profesional)?.genero !== ctx.genero) { s -= 15; motivos.push(ctx.genero === 'f' ? 'Le atiende un profesional' : 'Le atiende una profesional'); }
    s -= (h.fecha.getHours() * 60 + h.fecha.getMinutes()) / 600; // desempate: antes es mejor
    return { ...h, ajuste: Math.max(5, Math.min(99, Math.round(s))), motivos };
  }).sort((a, b) => b.ajuste - a.ajuste || a.fecha.getTime() - b.fecha.getTime());

  // Evita repetir el mismo hueco horario con varios profesionales en las primeras posiciones
  const vistos = new Set<string>();
  const unicos = puntuados.filter((h) => { const k = h.centro + h.fecha.getTime(); if (vistos.has(k)) return false; vistos.add(k); return true; });

  const enFecha = unicos.some((h) => sameDay(h.fecha, fechaPref) && h.centro === centroPref);
  return { huecos: unicos, sinHuecoEnFecha: !!ctx.fecha && !enFecha, centroCerradoTarde: centroPref === 'Sede Oeste' && ctx.franja === 'tarde' };
}

/** Bloque de citas consecutivas en un mismo centro y día para varias personas. */
export interface Bloque { centro: string; fecha: Date; citas: { hora: Date; profesional: string }[]; }
export function buscarBloque(ctx: Contexto, n: number, hoy = new Date()): Bloque | null {
  const { huecos } = buscar(ctx, hoy);
  const grupos = new Map<string, Hueco[]>();
  for (const h of buscar({ ...ctx, profesional: null, genero: null }, hoy).huecos.concat(huecos)) {
    const k = h.centro + '|' + startOfDay(h.fecha).toDateString();
    grupos.set(k, [...(grupos.get(k) ?? []), h]);
  }
  const enFranja = (h: Hueco) => !ctx.franja || (ctx.franja === 'tarde') === (h.fecha.getHours() >= 15);
  const ordenados = [...grupos.values()]
    .map((g) => { const f = g.filter(enFranja); return (f.length >= Math.min(n, 6) ? f : g).sort((a, b) => a.fecha.getTime() - b.fecha.getTime()); })
    .sort((a, b) => Math.max(...b.map((x) => x.ajuste)) - Math.max(...a.map((x) => x.ajuste)));
  const g = ordenados.find((x) => x.length >= Math.min(n, 6)) ?? ordenados[0];
  if (!g) return null;
  return { centro: g[0].centro, fecha: startOfDay(g[0].fecha), citas: g.slice(0, Math.min(n, 6)).map((h) => ({ hora: h.fecha, profesional: h.profesional })) };
}

/* ——— Utilidades de fecha ——— */

export function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
export function sameDay(a: Date, b: Date): boolean { return startOfDay(a).getTime() === startOfDay(b).getTime(); }
export function siguienteLaborable(d: Date): Date { const x = new Date(d); while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + 1); return x; }
function proximo(dia: number, hoy: Date): Date { const x = addDays(startOfDay(hoy), 1); while (x.getDay() !== dia) x.setDate(x.getDate() + 1); return x; }

export const fmtFecha = (d: Date) => d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
export const fmtFechaLarga = (d: Date) => d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtHora = (d: Date) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
