import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemoBarComponent } from '../../shared/ui/demo-bar.component';
import { ToastService, ToastsComponent } from '../../shared/ui/toast.service';
import { OpcionCardComponent } from './opcion-card.component';
import {
  Bloque, CENTROS, CLIENTES, CONTEXTO_VACIO, Contexto, Hueco, PROFESIONALES,
  addDays, buscar, buscarBloque, fmtFecha, fmtFechaLarga, fmtHora, interpretar, siguienteLaborable, startOfDay,
} from './asistente.engine';

type Vista = 'chat' | 'recomendadas' | 'reservas';
type EstadoReserva = 'temporal' | 'confirmada' | 'liberada' | 'caducada';

interface Chip { label: string; texto?: string; accion?: 'ver-reservas'; }
interface BloqueMsg extends Bloque { seleccion: string[]; reservado: boolean; restantes: number; }
interface Mensaje {
  id: number;
  de: 'yo' | 'bot' | 'nota';
  texto: string;
  visible: number;                 // caracteres mostrados (efecto de escritura)
  huecos?: Hueco[];
  pagina?: number;
  elegida?: string;
  bloque?: BloqueMsg;
  reservas?: string[];             // ids creadas desde este mensaje (para deshacer)
  deshecho?: boolean;
  chips?: Chip[];
  ayuda?: boolean;
  feedback?: 'up' | 'down' | null;
}
interface Reserva { id: string; cliente: string; trabajador: string | null; tipo: string; fecha: Date; centro: string; profesional: string; expira: Date; estado: EstadoReserva; }
interface Recomendacion { cliente: string; prioridad: 'Alta' | 'Media' | 'Baja'; origen: string; contexto: string; detalle: string; propuesta: string; prompt: string; }
interface Historial { titulo: string; cuando: string; prompts: string[]; tipo: string; }

const TIPOS = ['Reconocimiento', 'Actividad técnica', 'Reconocimiento VIP', 'Extracción previa'];
const MIN = 60_000;
const POR_PAGINA = 3;

@Component({
  selector: 'app-asistente',
  standalone: true,
  imports: [FormsModule, DemoBarComponent, ToastsComponent, OpcionCardComponent],
  templateUrl: './asistente.component.html',
  styleUrl: './asistente.component.scss',
})
export class AsistenteComponent {
  private readonly toast = inject(ToastService);
  private readonly log = viewChild<ElementRef<HTMLElement>>('log');
  private readonly input = viewChild<ElementRef<HTMLTextAreaElement>>('entrada');
  private readonly reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private seq = 0;
  private nReserva = 3042;
  private instantaneo = false;
  private historialEnviado: string[] = [];
  private cursorHistorial = -1;

  readonly tipos = TIPOS; readonly centros = CENTROS; readonly profesionales = PROFESIONALES; readonly clientes = CLIENTES;
  readonly fmtFecha = fmtFecha; readonly fmtHora = fmtHora; readonly fmtFechaLarga = fmtFechaLarga;

  readonly vista = signal<Vista>('chat');
  readonly tipo = signal<string | null>(null);
  readonly ctx = signal<Contexto>({ ...CONTEXTO_VACIO });
  readonly mensajes = signal<Mensaje[]>([]);
  readonly escribiendo = signal(false);
  readonly anuncio = signal('');
  readonly ahora = signal(Date.now());
  readonly panelAbierto = signal(true);
  texto = '';

  readonly reservas = signal<Reserva[]>([
    this.reservaSemilla('R-3039', 'Frutas Vegas Altas', 4, 'Mérida Sur', 6),
    this.reservaSemilla('R-3040', 'Transportes Sierra Sur', 6, 'Cáceres Centro', 38),
    this.reservaSemilla('R-3041', 'Cerámicas del Zújar', 9, 'Badajoz Oeste', 190),
  ]);
  readonly filtroReservas = signal<'15' | '60' | 'todas'>('todas');

  readonly recomendaciones = signal<Recomendacion[]>([
    { cliente: 'Metalúrgica Guadiana', prioridad: 'Alta', origen: 'Proactivo', contexto: 'Reconocimientos periódicos a punto de vencer', detalle: '18 trabajadores', propuesta: 'Agrupar en un bloque de 6 citas la semana que viene.', prompt: 'Cita para 6 trabajadores de Metalúrgica Guadiana la semana que viene por la mañana' },
    { cliente: 'Frutas Vegas Altas', prioridad: 'Media', origen: 'Reactivo', contexto: 'Bolsa de reconocimientos contratada', detalle: '12 sin planificar', propuesta: 'Repartir en dos mañanas antes de fin de mes.', prompt: 'Necesito huecos para Frutas Vegas Altas en Mérida Sur por la mañana la semana que viene' },
    { cliente: 'Transportes Sierra Sur', prioridad: 'Baja', origen: 'Proactivo', contexto: 'Altas recientes sin reconocimiento inicial', detalle: '4 conductores', propuesta: 'Proponer citas en el centro más cercano.', prompt: 'Cita para Transportes Sierra Sur en Cáceres mañana por la tarde' },
  ]);

  readonly historial: Historial[] = [
    { titulo: 'Frutas Vegas Altas', cuando: 'Ayer', tipo: 'Reconocimiento', prompts: ['Huecos para Frutas Vegas Altas el jueves', 'mejor por la tarde', 'con una doctora'] },
    { titulo: 'Cerámicas del Zújar', cuando: 'Lunes', tipo: 'Extracción previa', prompts: ['Cerámicas del Zújar en Badajoz por la tarde'] },
    { titulo: 'Talleres Ribera · 5 citas', cuando: 'Semana pasada', tipo: 'Reconocimiento', prompts: ['5 trabajadores de Talleres Ribera en Mérida Norte'] },
  ];

  readonly sugerencias = [
    'Busca cita para Metalúrgica Guadiana en Mérida Norte el próximo martes por la mañana',
    'Cita para 6 trabajadores de Frutas Vegas Altas la semana que viene',
    'Necesito un hueco para Transportes Sierra Sur mañana por la tarde con una doctora',
    '¿Qué puedes hacer?',
  ];

  /** Solo el último bloque de resultados es accionable; los anteriores quedan como histórico. */
  readonly ultimoResultado = computed(() => [...this.mensajes()].reverse().find((m) => m.huecos || m.bloque)?.id ?? -1);

  readonly clienteActual = computed(() => CLIENTES.find((c) => c.nombre === this.ctx().cliente) ?? null);
  readonly fechaInput = computed(() => { const f = this.ctx().fecha; return f ? toInput(f) : ''; });
  readonly hoyInput = toInput(new Date());
  readonly temporales = computed(() => this.reservas().filter((r) => r.estado === 'temporal'));
  readonly confirmadas = computed(() => this.reservas().filter((r) => r.estado === 'confirmada').length);
  readonly reservasVisibles = computed(() => {
    const f = this.filtroReservas(); const now = this.ahora();
    return this.reservas().filter((r) => f === 'todas' || (r.estado === 'temporal' && r.expira.getTime() - now <= +f * MIN));
  });

  constructor() {
    const t = setInterval(() => this.tick(), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(t));
  }

  /* ——— entrada ——— */

  elegirTipo(t: string): void {
    this.tipo.set(t);
    setTimeout(() => this.input()?.nativeElement.focus());
  }

  enviar(texto = this.texto): void {
    const limpio = texto.trim();
    if (!limpio || !this.tipo() || this.escribiendo()) return;
    this.push({ de: 'yo', texto: limpio });
    this.historialEnviado.push(limpio);
    this.cursorHistorial = -1;
    this.texto = '';
    if (this.instantaneo) { this.responder(limpio); return; }
    this.escribiendo.set(true);
    setTimeout(() => { this.escribiendo.set(false); this.responder(limpio); }, 700 + Math.min(limpio.length * 8, 600));
  }

  pulsarChip(c: Chip): void {
    if (c.accion === 'ver-reservas') { this.vista.set('reservas'); return; }
    if (c.texto) this.enviar(c.texto);
  }

  teclado(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.enviar(); return; }
    if (e.key === 'Escape') { this.texto = ''; return; }
    const h = this.historialEnviado;
    if (e.key === 'ArrowUp' && (!this.texto || this.cursorHistorial >= 0) && h.length) {
      e.preventDefault();
      this.cursorHistorial = this.cursorHistorial < 0 ? h.length - 1 : Math.max(0, this.cursorHistorial - 1);
      this.texto = h[this.cursorHistorial];
    } else if (e.key === 'ArrowDown' && this.cursorHistorial >= 0) {
      e.preventDefault();
      this.cursorHistorial = this.cursorHistorial + 1 < h.length ? this.cursorHistorial + 1 : -1;
      this.texto = this.cursorHistorial < 0 ? '' : h[this.cursorHistorial];
    }
  }

  /* ——— cerebro de la conversación ——— */

  private responder(texto: string): void {
    const r = interpretar(texto, this.ctx());
    switch (r.intencion) {
      case 'saludo':
        return this.bot('¡Hola! Dime para qué cliente necesitas cita y, si quieres, centro, día, franja o profesional.', { chips: this.sugerencias.slice(0, 3).map((s) => ({ label: s, texto: s })) });
      case 'gracias':
        return this.bot('A ti. ¿Busco algo más?', { chips: [{ label: 'Otra cita para este cliente', texto: 'otro día' }, { label: 'Ver reservas temporales', accion: 'ver-reservas' }] });
      case 'ayuda':
        return this.bot('Puedo buscar huecos y reservarlos sin salir de la conversación. Prueba alguna de estas peticiones:', { ayuda: true, chips: [
          { label: 'Cita para Talleres Ribera el viernes', texto: 'Cita para Talleres Ribera el viernes' },
          { label: '6 trabajadores de Metalúrgica Guadiana', texto: 'Cita para 6 trabajadores de Metalúrgica Guadiana' },
          { label: 'Cerámicas del Zújar por la tarde', texto: 'Cerámicas del Zújar en Badajoz por la tarde' },
        ] });
      case 'deshacer':
        return this.deshacerUltima();
      case 'reservar-primera': {
        const m = [...this.mensajes()].reverse().find((x) => x.huecos && !x.elegida);
        if (!m) return this.bot('No tengo opciones pendientes de reservar. Pídeme una búsqueda primero.');
        return this.reservarHueco(m, this.paginaDe(m)[0]);
      }
      case 'mas': {
        const m = [...this.mensajes()].reverse().find((x) => x.huecos);
        if (!m) return this.bot('Todavía no he buscado nada. ¿Para qué cliente?', { chips: this.chipsClientes(texto) });
        return this.verMas(m);
      }
    }

    this.ctx.set(r.ctx);
    if (!r.ctx.cliente) {
      return this.bot('Entendido. ¿Para qué cliente busco disponibilidad?', { chips: this.chipsClientes(texto) });
    }
    this.buscarYResponder(r.cambios, false);
  }

  /** Lanza la búsqueda con el contexto actual y redacta una respuesta que explica lo que ha hecho. */
  private buscarYResponder(cambios: string[], desdePanel: boolean): void {
    const c = this.ctx();
    const cli = this.clienteActual()!;
    const yaHabiaResultados = this.mensajes().some((m) => m.huecos || m.bloque);
    const frases: string[] = [];

    if (cambios.length && yaHabiaResultados) frases.push(`${desdePanel ? 'He ajustado' : 'Actualizo'} la búsqueda: ${cambios.join(', ')}.`);
    const supuestos: string[] = [];
    if (!c.centro) supuestos.push(`su centro habitual, ${cli.centroHabitual}`);
    if (!c.fecha) supuestos.push('el primer día laborable');
    if (supuestos.length && !yaHabiaResultados) frases.push(`Como no lo has indicado, he usado ${supuestos.join(' y ')}.`);

    if (c.personas > 1) {
      const bloque = buscarBloque(c, c.personas);
      if (!bloque) return this.bot(frases.concat('No encuentro un bloque disponible en los próximos días. Prueba con otro centro.').join(' '), { chips: this.chipsSeguimiento() });
      const n = bloque.citas.length;
      const seleccion = cli.trabajadores.slice(0, n).map((w) => w.id);
      frases.push(`Para ${c.personas} personas de ${cli.nombre} te propongo un bloque de ${n} citas seguidas el ${fmtFechaLarga(bloque.fecha)} en ${bloque.centro}. He preseleccionado a quienes antes les vence el reconocimiento; puedes cambiarlos.`);
      return this.bot(frases.join(' '), {
        bloque: { ...bloque, seleccion, reservado: false, restantes: Math.max(0, c.personas - n) },
        chips: [{ label: 'Otro día', texto: 'otro día' }, { label: 'Otro centro', texto: 'otro centro' }, { label: 'Por la tarde', texto: 'por la tarde' }],
      });
    }

    const res = buscar(c);
    if (res.centroCerradoTarde) frases.push('Badajoz Oeste no abre por la tarde, así que te propongo alternativas.');
    else if (res.sinHuecoEnFecha) frases.push(`No queda hueco el ${fmtFechaLarga(c.fecha!)} en ${c.centro ?? cli.centroHabitual}; te enseño lo más cercano.`);
    const para = c.trabajador ? `${c.trabajador} (${cli.nombre})` : cli.nombre;
    frases.push(`Estas son las mejores opciones para ${para}, ordenadas por ajuste a tu petición:`);
    this.bot(frases.join(' '), { huecos: res.huecos, pagina: 0, chips: this.chipsSeguimiento() });
  }

  private chipsSeguimiento(): Chip[] {
    const c = this.ctx();
    const chips: Chip[] = [{ label: 'Más opciones', texto: 'más opciones' }];
    chips.push(c.franja === 'tarde' ? { label: 'Por la mañana', texto: 'por la mañana' } : { label: 'Por la tarde', texto: 'por la tarde' });
    chips.push({ label: 'Otro centro', texto: 'otro centro' }, { label: 'Otro día', texto: 'otro día' });
    if (!c.genero && !c.profesional) chips.push({ label: 'Con una doctora', texto: 'con una doctora' });
    return chips;
  }

  private chipsClientes(texto: string): Chip[] {
    return CLIENTES.slice(0, 4).map((c) => ({ label: c.nombre, texto: `${texto} para ${c.nombre}` }));
  }

  /* ——— acciones sobre resultados ——— */

  paginaDe(m: Mensaje): Hueco[] {
    const p = m.pagina ?? 0;
    return (m.huecos ?? []).slice(p * POR_PAGINA, (p + 1) * POR_PAGINA);
  }

  verMas(m: Mensaje): void {
    const total = m.huecos?.length ?? 0;
    const sig = (m.pagina ?? 0) + 1;
    if (sig * POR_PAGINA >= total) return this.bot('No hay más huecos en los próximos 8 días con estos criterios. Prueba con otro centro.', { chips: [{ label: 'Otro centro', texto: 'otro centro' }] });
    this.bot(`Aquí tienes ${Math.min(POR_PAGINA, total - sig * POR_PAGINA)} opciones más:`, { huecos: m.huecos, pagina: sig, chips: this.chipsSeguimiento() });
  }

  reservarHueco(m: Mensaje, h: Hueco): void {
    if (m.elegida) return;
    const c = this.ctx();
    const id = this.nuevaReserva(c.cliente ?? 'Cliente', c.trabajador, h.fecha, h.centro, h.profesional);
    this.patch(m.id, { elegida: h.id });
    const para = c.trabajador ? ` para ${c.trabajador}` : '';
    this.bot(`Hecho: reserva temporal ${id}${para}, ${fmtFecha(h.fecha)} a las ${fmtHora(h.fecha)} en ${h.centro} con ${h.profesional}. La mantengo 15 minutos; confírmala en Reservas temporales.`,
      { reservas: [id], chips: [{ label: 'Ver reservas temporales', accion: 'ver-reservas' }, { label: 'Otra cita para este cliente', texto: 'otro día' }] });
    this.toast.show('ok', 'Reserva temporal', `${id} bloqueada durante 15 min`);
  }

  toggleTrabajador(m: Mensaje, id: string): void {
    const b = m.bloque!; if (b.reservado) return;
    const sel = b.seleccion.includes(id) ? b.seleccion.filter((x) => x !== id) : [...b.seleccion, id];
    if (sel.length > b.citas.length) { this.toast.show('warn', 'Bloque completo', `El bloque tiene ${b.citas.length} citas. Quita a alguien antes.`); return; }
    this.patch(m.id, { bloque: { ...b, seleccion: sel } });
  }

  reservarBloque(m: Mensaje): void {
    const b = m.bloque!; const c = this.ctx(); const cli = this.clienteActual()!;
    if (!b.seleccion.length || b.reservado) return;
    const personas = cli.trabajadores.filter((w) => b.seleccion.includes(w.id));
    const ids = personas.map((w, i) => this.nuevaReserva(cli.nombre, w.nombre, b.citas[i].hora, b.centro, b.citas[i].profesional));
    this.patch(m.id, { bloque: { ...b, reservado: true } });
    const resto = cli.trabajadores.length - personas.length;
    this.bot(`Bloque reservado: ${ids.length} citas el ${fmtFechaLarga(b.fecha)} en ${b.centro} (${ids[0]} a ${ids[ids.length - 1]}). Quedan como temporales 15 minutos.`, {
      reservas: ids,
      chips: [{ label: 'Ver reservas temporales', accion: 'ver-reservas' }, ...(c.personas > ids.length || resto ? [{ label: 'Siguiente bloque', texto: 'otro día' }] : [])],
    });
    this.toast.show('ok', 'Bloque reservado', `${ids.length} citas para ${cli.nombre}`);
  }

  /** Nombre del trabajador asignado a la cita i del bloque (por orden de vencimiento). */
  nombreSel(b: BloqueMsg, i: number): string | null {
    const sel = (this.clienteActual()?.trabajadores ?? []).filter((w) => b.seleccion.includes(w.id));
    return sel[i]?.nombre ?? null;
  }

  deshacer(m: Mensaje): void {
    if (m.deshecho || !m.reservas) return;
    this.reservas.update((rs) => rs.map((r) => (m.reservas!.includes(r.id) && r.estado === 'temporal' ? { ...r, estado: 'liberada' } : r)));
    this.patch(m.id, { deshecho: true });
    // Reactiva las opciones del mensaje de origen para poder elegir otra
    const origen = [...this.mensajes()].reverse().find((x) => x.id < m.id && (x.elegida || x.bloque?.reservado));
    if (origen) this.patch(origen.id, { elegida: undefined, bloque: origen.bloque ? { ...origen.bloque, reservado: false } : undefined });
    this.push({ de: 'nota', texto: `Reserva deshecha: ${m.reservas.join(', ')} ${m.reservas.length > 1 ? 'liberadas' : 'liberada'}. Puedes elegir otra opción.` });
    this.toast.show('info', 'Deshecho', 'El hueco vuelve a estar libre');
  }

  private deshacerUltima(): void {
    const m = [...this.mensajes()].reverse().find((x) => x.reservas && !x.deshecho);
    if (!m) return this.bot('No hay ninguna reserva reciente que deshacer.');
    this.deshacer(m);
  }

  valorar(m: Mensaje, v: 'up' | 'down'): void {
    const nuevo = m.feedback === v ? null : v;
    this.patch(m.id, { feedback: nuevo });
    if (nuevo) this.toast.show('info', 'Gracias', nuevo === 'up' ? 'Tu valoración ayuda a mejorar las respuestas' : 'Lo revisaremos. Puedes ajustar los criterios en el panel');
    if (nuevo === 'down') this.panelAbierto.set(true);
  }

  /* ——— panel «Lo que he entendido» ——— */

  ajustar<K extends keyof Contexto>(k: K, v: Contexto[K], etiqueta: string): void {
    if (this.ctx()[k] === v) return;
    this.ctx.update((c) => ({ ...c, [k]: v, ...(k === 'cliente' ? { trabajador: null } : {}) }));
    this.push({ de: 'nota', texto: `Has cambiado ${etiqueta}.` });
    if (this.ctx().cliente) this.buscarYResponder([etiqueta], true);
  }
  ajustarFecha(v: string): void {
    const f = v ? siguienteLaborable(new Date(v + 'T00:00')) : null;
    this.ajustar('fecha', f, f ? `la fecha a ${fmtFecha(f)}` : 'la fecha a «primer día libre»');
  }
  ajustarProfesional(v: string): void {
    if (v === 'f' || v === 'm') { this.ctx.update((c) => ({ ...c, profesional: null })); this.ajustar('genero', v, v === 'f' ? 'el profesional a «una doctora»' : 'el profesional a «un doctor»'); }
    else { this.ctx.update((c) => ({ ...c, genero: null })); this.ajustar('profesional', v || null, v ? `el profesional a ${v}` : 'el profesional a «cualquiera»'); }
  }
  valorProfesional(): string { const c = this.ctx(); return c.profesional ?? c.genero ?? ''; }

  /* ——— conversación, historial y recomendaciones ——— */

  nuevaConversacion(): void {
    this.mensajes.set([]); this.tipo.set(null); this.ctx.set({ ...CONTEXTO_VACIO }); this.texto = ''; this.vista.set('chat');
  }

  abrirHistorial(h: Historial): void {
    this.nuevaConversacion();
    this.tipo.set(h.tipo);
    this.instantaneo = true;
    h.prompts.forEach((p) => this.enviar(p));
    this.instantaneo = false;
    this.toast.show('info', 'Conversación recuperada', h.titulo);
  }

  generar(r: Recomendacion): void {
    this.nuevaConversacion();
    this.tipo.set('Reconocimiento');
    this.recomendaciones.update((rs) => rs.filter((x) => x !== r));
    setTimeout(() => this.enviar(r.prompt), 50);
  }

  /* ——— reservas ——— */

  restante(r: Reserva): string {
    const ms = Math.max(0, r.expira.getTime() - this.ahora());
    const h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / MIN), s = Math.floor((ms % MIN) / 1000);
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
  }
  urgente(r: Reserva): boolean { return r.estado === 'temporal' && r.expira.getTime() - this.ahora() < 15 * MIN; }

  resolver(r: Reserva, estado: 'confirmada' | 'liberada'): void {
    this.reservas.update((rs) => rs.map((x) => (x.id === r.id ? { ...x, estado } : x)));
    this.toast.show(estado === 'confirmada' ? 'ok' : 'info', estado === 'confirmada' ? 'Cita confirmada' : 'Hueco liberado', `${r.id} · ${r.cliente}`);
  }
  confirmarTodas(): void {
    const n = this.temporales().length;
    this.reservas.update((rs) => rs.map((r) => (r.estado === 'temporal' ? { ...r, estado: 'confirmada' } : r)));
    this.toast.show('ok', 'Citas confirmadas', `${n} reservas confirmadas`);
  }

  /* ——— internos ——— */

  private bot(texto: string, extra: Partial<Mensaje> = {}): void {
    const id = this.push({ de: 'bot', texto, feedback: null, ...extra }, !this.instantaneo && !this.reduceMotion);
    if (this.instantaneo || this.reduceMotion) this.anuncio.set(texto);
    else this.escribir(id, texto);
  }

  /** Muestra el texto palabra a palabra; el lector de pantalla recibe la frase completa al final. */
  private escribir(id: number, texto: string): void {
    const palabras = texto.split(' ');
    let i = 0;
    const t = setInterval(() => {
      i += 2;
      const visible = palabras.slice(0, i).join(' ').length;
      this.patch(id, { visible: Math.min(visible, texto.length) });
      this.scrollAbajo();
      if (i >= palabras.length) { clearInterval(t); this.patch(id, { visible: texto.length }); this.anuncio.set(texto); this.scrollAbajo(); }
    }, 35);
  }

  private push(m: Omit<Mensaje, 'id' | 'visible'>, stream = false): number {
    const id = ++this.seq;
    this.mensajes.update((ms) => [...ms, { ...m, id, visible: stream ? 0 : m.texto.length }]);
    this.scrollAbajo();
    return id;
  }

  private patch(id: number, p: Partial<Mensaje>): void {
    this.mensajes.update((ms) => ms.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }

  private scrollAbajo(): void {
    setTimeout(() => { const el = this.log()?.nativeElement; if (el) el.scrollTo({ top: el.scrollHeight, behavior: this.reduceMotion ? 'auto' : 'smooth' }); });
  }

  private nuevaReserva(cliente: string, trabajador: string | null, fecha: Date, centro: string, profesional: string): string {
    const id = `R-${this.nReserva++}`;
    this.reservas.update((rs) => [{ id, cliente, trabajador, tipo: this.tipo() ?? 'Reconocimiento', fecha, centro, profesional, expira: new Date(Date.now() + 15 * MIN), estado: 'temporal' }, ...rs]);
    return id;
  }

  private tick(): void {
    const now = Date.now();
    this.ahora.set(now);
    if (this.reservas().some((r) => r.estado === 'temporal' && r.expira.getTime() <= now)) {
      this.reservas.update((rs) => rs.map((r) => (r.estado === 'temporal' && r.expira.getTime() <= now ? { ...r, estado: 'caducada' } : r)));
      this.toast.show('warn', 'Reserva caducada', 'Se ha liberado un hueco sin confirmar');
    }
  }

  private reservaSemilla(id: string, cliente: string, dias: number, centro: string, minutos: number): Reserva {
    const f = siguienteLaborable(addDays(startOfDay(new Date()), dias)); f.setHours(8 + (minutos % 3), 30, 0, 0);
    return { id, cliente, trabajador: null, tipo: 'Reconocimiento', fecha: f, centro, profesional: 'Dra. Lucía Prieto', expira: new Date(Date.now() + minutos * MIN), estado: 'temporal' };
  }
}

function toInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
