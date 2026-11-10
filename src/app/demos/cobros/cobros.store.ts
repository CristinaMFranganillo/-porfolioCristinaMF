import { Injectable, computed, signal } from '@angular/core';
import {
  Actuacion, Aplazamiento, Estado, Expediente, FacturaSinCliente, IngresoPendiente, Marcador,
  generarExpedientes, generarFacturasSinCliente, iso, leerIngresos,
} from './cobros.data';

export interface Filtros {
  gestor: string; campana: string; estado: string; motivo: string; deuda: '' | 'lt1000' | '1000-5000' | 'gt5000';
  formaPago: string; provincia: string; entidad: string; grupo: string;
  marcadores: Marcador[]; modoMarcadores: 'todos' | 'alguno';
  asignadoDesde: string; asignadoHasta: string; importeDesde: number | null; importeHasta: number | null;
  cliente: string; sinAsignar30: boolean;
}
export type SortKey = 'id' | 'campana' | 'numCliente' | 'entidad' | 'gestor' | 'provincia' | 'cliente' | 'estado' | 'deuda' | 'negativo';

export const FILTROS_VACIOS: Filtros = {
  gestor: '', campana: '', estado: '', motivo: '', deuda: '', formaPago: '', provincia: '', entidad: '', grupo: '',
  marcadores: [], modoMarcadores: 'todos', asignadoDesde: '', asignadoHasta: '', importeDesde: null, importeHasta: null,
  cliente: '', sinAsignar30: false,
};

const hoy = () => iso(new Date());

/**
 * Estado de la demo de cobros con signals. Los filtros se editan como borrador y se aplican
 * al pulsar «Filtrar», igual que en la aplicación real, para no relanzar consultas pesadas en cada tecla.
 */
@Injectable({ providedIn: 'root' })
export class CobrosStore {
  readonly expedientes = signal<Expediente[]>(generarExpedientes());
  readonly facturasSinCliente = signal<FacturaSinCliente[]>(generarFacturasSinCliente());
  readonly ingresos = signal<IngresoPendiente[]>([]);
  readonly ficheroIngresos = signal<string | null>(null);

  readonly filtros = signal<Filtros>({ ...FILTROS_VACIOS });
  readonly busqueda = signal('');
  readonly sort = signal<{ key: SortKey; dir: 1 | -1 }>({ key: 'deuda', dir: -1 });
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly seleccion = signal<Set<number>>(new Set());

  readonly filtrosActivos = computed(() => {
    const f = this.filtros();
    return Object.entries(f).filter(([k, v]) => k !== 'modoMarcadores' && (Array.isArray(v) ? v.length : v !== '' && v !== null && v !== false)).length;
  });

  /** Predicado de filtrado compartido por el listado y por el contador previo de la hoja de filtros. */
  private coincide(f: Filtros, q: string): (e: Expediente) => boolean {
    const cli = f.cliente.trim().toLowerCase();
    const limite30 = new Date(); limite30.setDate(limite30.getDate() - 30);
    return (e) =>
      (!f.gestor || e.gestor === f.gestor) && (!f.campana || e.campana === f.campana) && (!f.estado || e.estado === f.estado) &&
      (!f.motivo || e.motivoAplazamiento === f.motivo) && (!f.formaPago || e.formaPago === f.formaPago) &&
      (!f.provincia || e.provincia === f.provincia) && (!f.entidad || e.entidad === f.entidad) &&
      (!f.grupo || (e.grupo ?? '').toLowerCase().includes(f.grupo.toLowerCase())) &&
      (f.deuda === '' || (f.deuda === 'lt1000' ? e.deuda < 1000 : f.deuda === 'gt5000' ? e.deuda > 5000 : e.deuda >= 1000 && e.deuda <= 5000)) &&
      (!f.marcadores.length || (f.modoMarcadores === 'todos' ? f.marcadores.every((m) => !!e[m]) : f.marcadores.some((m) => !!e[m]))) &&
      (!f.asignadoDesde || e.asignado >= f.asignadoDesde) && (!f.asignadoHasta || e.asignado <= f.asignadoHasta) &&
      (f.importeDesde === null || e.deuda >= f.importeDesde) && (f.importeHasta === null || e.deuda <= f.importeHasta) &&
      (!cli || e.cliente.toLowerCase().includes(cli) || e.nif.toLowerCase().includes(cli) || String(e.numCliente).includes(cli)) &&
      (!f.sinAsignar30 || new Date(e.asignado) < limite30) &&
      (!q || [e.id, e.cliente, e.gestor, e.provincia, e.campana, e.observaciones ?? ''].join(' ').toLowerCase().includes(q));
  }

  /** Cuántos resultados daría un borrador de filtros, sin aplicarlo. */
  contar(f: Filtros): number { return this.expedientes().filter(this.coincide(f, this.busqueda().trim().toLowerCase())).length; }

  readonly filtrados = computed(() => {
    const { key, dir } = this.sort();
    return this.expedientes()
      .filter(this.coincide(this.filtros(), this.busqueda().trim().toLowerCase()))
      .sort((a, b) => {
        const va = a[key], vb = b[key];
        return (typeof va === 'number' ? va - (vb as number) : String(va).localeCompare(String(vb), 'es')) * dir;
      });
  });

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.pageSize())));
  readonly pagina = computed(() => {
    const p = Math.min(this.page(), this.totalPaginas());
    return this.filtrados().slice((p - 1) * this.pageSize(), p * this.pageSize());
  });
  readonly deudaTotal = computed(() => this.filtrados().reduce((s, e) => s + e.deuda, 0));
  readonly paginaSeleccionada = computed(() => {
    const sel = this.seleccion(); const ids = this.pagina().map((e) => e.id);
    const n = ids.filter((id) => sel.has(id)).length;
    return n === 0 ? 'none' : n === ids.length ? 'all' : 'some';
  });

  aplicarFiltros(f: Filtros): void { this.filtros.set({ ...f, marcadores: [...f.marcadores] }); this.page.set(1); this.seleccion.set(new Set()); }
  limpiarFiltros(): void { this.aplicarFiltros(FILTROS_VACIOS); this.busqueda.set(''); }
  ordenar(key: SortKey): void { this.sort.update((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 })); }

  toggle(id: number): void { this.seleccion.update((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  togglePagina(): void {
    const ids = this.pagina().map((e) => e.id); const marcar = this.paginaSeleccionada() !== 'all';
    this.seleccion.update((s) => { const n = new Set(s); ids.forEach((id) => (marcar ? n.add(id) : n.delete(id))); return n; });
  }
  toggleTodos(): void {
    const todos = this.filtrados().map((e) => e.id);
    this.seleccion.set(this.seleccion().size === todos.length ? new Set() : new Set(todos));
  }

  byId(id: number): Expediente | undefined { return this.expedientes().find((e) => e.id === id); }

  /* ——— acciones sobre expedientes (todas dejan rastro en el histórico) ——— */

  private patch(id: number, fn: (e: Expediente) => Partial<Expediente>, log?: string): void {
    this.expedientes.update((xs) => xs.map((e) => (e.id === id ? { ...e, ...fn(e), logs: log ? [{ fecha: hoy(), texto: log }, ...e.logs] : e.logs } : e)));
  }

  reasignar(ids: number[], gestor: string): void {
    const set = new Set(ids);
    this.expedientes.update((xs) => xs.map((e) => set.has(e.id) ? { ...e, gestor, logs: [{ fecha: hoy(), texto: `Reasignado de ${e.gestor} a ${gestor}` }, ...e.logs] } : e));
    this.seleccion.set(new Set());
  }
  cambiarEstado(id: number, estado: Estado): void { this.patch(id, () => ({ estado, juridico: estado === 'Jurídico' }), `Estado cambiado a ${estado}`); }
  reasignarCampana(id: number, campana: string): void { this.patch(id, () => ({ campana }), `Campaña cambiada a ${campana}`); }
  actualizarContacto(id: number, contacto: string, telefono: string, email: string): void {
    this.patch(id, () => ({ contacto, telefono, emailCobro: email }), 'Contacto de cobro actualizado');
  }
  cerrar(id: number, motivo: string, descripcion: string): void {
    this.patch(id, () => ({ estado: 'Cerrado' }), `Expediente cerrado: ${motivo}. ${descripcion}`);
  }
  recalcularScoring(id: number): void {
    this.patch(id, (e) => ({ scoring: Math.max(1, Math.min(5, e.scoring + (e.actuaciones.some((a) => a.recobrado) ? 1 : -1))), fechaScoring: hoy() }), 'Scoring recalculado');
  }

  guardarActuacion(id: number, a: Omit<Actuacion, 'id'>, actId: number | null): void {
    this.patch(id, (e) => {
      const previa = actId !== null ? e.actuaciones.find((x) => x.id === actId) : null;
      const delta = (a.recobrado ?? 0) - (previa?.recobrado ?? 0);
      return {
        deuda: Math.max(0, Math.round((e.deuda - delta) * 100) / 100),
        actuaciones: actId === null ? [{ ...a, id: Date.now() }, ...e.actuaciones] : e.actuaciones.map((x) => (x.id === actId ? { ...a, id: actId } : x)),
      };
    }, actId === null ? `Nueva actuación: ${a.tipo}` : `Actuación modificada: ${a.tipo}`);
  }
  borrarActuacion(id: number, actId: number): void {
    this.patch(id, (e) => {
      const a = e.actuaciones.find((x) => x.id === actId);
      return { deuda: e.deuda + (a?.recobrado ?? 0), actuaciones: e.actuaciones.filter((x) => x.id !== actId) };
    }, 'Actuación eliminada');
  }
  guardarAplazamiento(id: number, ap: Omit<Aplazamiento, 'id'>, apId: number | null): void {
    this.patch(id, (e) => ({
      estado: 'Aplazado', motivoAplazamiento: ap.motivo,
      aplazamientos: apId === null ? [{ ...ap, id: Date.now() }, ...e.aplazamientos] : e.aplazamientos.map((x) => (x.id === apId ? { ...ap, id: apId } : x)),
    }), apId === null ? `Aplazamiento hasta ${ap.vencimiento}` : 'Aplazamiento modificado');
  }
  compromisoPago(id: number, facturas: string[], vencimiento: string, tipo: string): void {
    this.patch(id, (e) => ({
      actuaciones: [{ id: Date.now(), fecha: hoy(), tipo: 'Compromiso de pago', gestor: e.gestor, descripcion: `${tipo} de ${facturas.length} factura(s) antes del ${vencimiento.split('-').reverse().join('/')}`, recobrado: null, devuelto: null, adjunto: null, ejecucion: vencimiento }, ...e.actuaciones],
    }), `Compromiso de pago sobre ${facturas.join(', ')}`);
  }
  registrarPago(id: number, importe: number, concepto: string): void {
    this.patch(id, (e) => {
      const deuda = Math.max(0, Math.round((e.deuda - importe) * 100) / 100);
      return {
        deuda, estado: deuda === 0 ? 'Cobrado' : e.estado,
        movimientos: [{ fecha: hoy(), concepto, importe }, ...e.movimientos],
        actuaciones: [{ id: Date.now() + id, fecha: hoy(), tipo: 'Cobro parcial', gestor: e.gestor, descripcion: 'Ingreso importado del banco', recobrado: importe, devuelto: null, adjunto: null, ejecucion: hoy() }, ...e.actuaciones],
      };
    }, `Ingreso aplicado: ${importe.toFixed(2)} €`);
  }

  /* ——— ingresos diarios ——— */
  importarIngresos(nombre: string): void { this.ficheroIngresos.set(nombre); this.ingresos.set(leerIngresos(this.expedientes())); }
  ejecutarIngresos(ids: number[]): { ok: number; sinExpediente: number } {
    let ok = 0, sinExpediente = 0;
    for (const ing of this.ingresos().filter((x) => ids.includes(x.id))) {
      if (ing.expediente) { this.registrarPago(ing.expediente, ing.importe, ing.concepto); ok++; } else sinExpediente++;
    }
    this.ingresos.update((xs) => xs.filter((x) => !ids.includes(x.id) || !x.expediente));
    return { ok, sinExpediente };
  }

  /* ——— facturas sin cliente ——— */
  asignarFactura(numero: string, expedienteId: number): void {
    const f = this.facturasSinCliente().find((x) => x.numero === numero);
    if (!f) return;
    this.patch(expedienteId, (e) => ({
      deuda: Math.round((e.deuda + f.importe) * 100) / 100,
      facturas: [{ numero: f.numero, fecha: f.fecha, vencimiento: f.fecha, importe: f.importe, concepto: 'Factura asignada manualmente' }, ...e.facturas],
    }), `Factura ${f.numero} asignada al cliente`);
    this.facturasSinCliente.update((xs) => xs.filter((x) => x.numero !== numero));
  }
}
