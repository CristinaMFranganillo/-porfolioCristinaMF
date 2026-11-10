import { Injectable, computed, signal } from '@angular/core';
import { Actuacion, Estado, Expediente, generarExpedientes } from './cobros.data';

export interface Filtros {
  gestor: string; campana: string; estado: string; provincia: string;
  texto: string; desde: number | null; hasta: number | null; soloBaja: boolean;
}
export type SortKey = 'id' | 'cliente' | 'gestor' | 'provincia' | 'estado' | 'deuda';

const FILTROS_VACIOS: Filtros = { gestor: '', campana: '', estado: '', provincia: '', texto: '', desde: null, hasta: null, soloBaja: false };

/** Estado de la demo de cobros: datos, filtros, orden, paginación y selección con signals. */
@Injectable({ providedIn: 'root' })
export class CobrosStore {
  readonly expedientes = signal<Expediente[]>(generarExpedientes());
  readonly filtros = signal<Filtros>({ ...FILTROS_VACIOS });
  readonly sort = signal<{ key: SortKey; dir: 1 | -1 }>({ key: 'deuda', dir: -1 });
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly seleccion = signal<Set<number>>(new Set());

  readonly filtrosActivos = computed(() => {
    const f = this.filtros();
    return [f.gestor, f.campana, f.estado, f.provincia, f.texto, f.desde, f.hasta, f.soloBaja || null].filter((v) => v !== '' && v !== null).length;
  });

  readonly filtrados = computed(() => {
    const f = this.filtros();
    const q = f.texto.trim().toLowerCase();
    const { key, dir } = this.sort();
    return this.expedientes()
      .filter((e) =>
        (!f.gestor || e.gestor === f.gestor) &&
        (!f.campana || e.campana === f.campana) &&
        (!f.estado || e.estado === f.estado) &&
        (!f.provincia || e.provincia === f.provincia) &&
        (!q || e.cliente.toLowerCase().includes(q) || String(e.id).includes(q) || e.nif.toLowerCase().includes(q)) &&
        (f.desde === null || e.deuda >= f.desde) &&
        (f.hasta === null || e.deuda <= f.hasta) &&
        (!f.soloBaja || e.bajaEnCurso))
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
    const sel = this.seleccion();
    const ids = this.pagina().map((e) => e.id);
    const n = ids.filter((id) => sel.has(id)).length;
    return n === 0 ? 'none' : n === ids.length ? 'all' : 'some';
  });

  setFiltro<K extends keyof Filtros>(k: K, v: Filtros[K]): void {
    this.filtros.update((f) => ({ ...f, [k]: v }));
    this.page.set(1);
  }
  limpiarFiltros(): void { this.filtros.set({ ...FILTROS_VACIOS }); this.page.set(1); }

  ordenar(key: SortKey): void {
    this.sort.update((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }));
  }

  toggle(id: number): void {
    this.seleccion.update((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  togglePagina(): void {
    const ids = this.pagina().map((e) => e.id);
    const marcar = this.paginaSeleccionada() !== 'all';
    this.seleccion.update((s) => { const n = new Set(s); ids.forEach((id) => (marcar ? n.add(id) : n.delete(id))); return n; });
  }
  limpiarSeleccion(): void { this.seleccion.set(new Set()); }

  byId(id: number): Expediente | undefined { return this.expedientes().find((e) => e.id === id); }

  private patch(id: number, fn: (e: Expediente) => Expediente): void {
    this.expedientes.update((xs) => xs.map((e) => (e.id === id ? fn(e) : e)));
  }
  private log(texto: string) { return { fecha: new Date().toISOString().slice(0, 10), texto }; }

  reasignar(ids: number[], gestor: string): void {
    const set = new Set(ids);
    this.expedientes.update((xs) => xs.map((e) => set.has(e.id) ? { ...e, gestor, logs: [this.log(`Reasignado a ${gestor}`), ...e.logs] } : e));
    this.limpiarSeleccion();
  }
  cambiarEstado(id: number, estado: Estado): void {
    this.patch(id, (e) => ({ ...e, estado, logs: [this.log(`Estado: ${e.estado} → ${estado}`), ...e.logs] }));
  }
  addActuacion(id: number, a: Omit<Actuacion, 'id'>): void {
    this.patch(id, (e) => ({
      ...e,
      deuda: a.recobrado ? Math.max(0, Math.round((e.deuda - a.recobrado) * 100) / 100) : e.deuda,
      actuaciones: [{ ...a, id: Date.now() }, ...e.actuaciones],
      logs: [this.log(`Nueva actuación: ${a.tipo}`), ...e.logs],
    }));
  }
  deleteActuacion(id: number, actId: number): void {
    this.patch(id, (e) => ({ ...e, actuaciones: e.actuaciones.filter((a) => a.id !== actId), logs: [this.log('Actuación eliminada'), ...e.logs] }));
  }
}
