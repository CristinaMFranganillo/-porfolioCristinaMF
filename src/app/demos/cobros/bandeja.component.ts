import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SheetComponent } from '../../shared/ui/sheet.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CobrosStore, FILTROS_VACIOS, Filtros, SortKey } from './cobros.store';
import { CAMPANAS, ENTIDADES, ESTADOS, FORMAS_PAGO, GESTORES, MARCADORES, MOTIVOS_APLAZAMIENTO, Marcador, PROVINCIAS, eur, estadoClass } from './cobros.data';
import { ModalComponent } from '../../shared/ui/modal.component';
import { ToastService } from '../../shared/ui/toast.service';
import { IcoComponent, PaginadorComponent } from './ui';
import { ScrollShadowDirective } from '../../shared/scroll-shadow.directive';

@Component({
  selector: 'app-bandeja',
  standalone: true,
  imports: [FormsModule, RouterLink, NgTemplateOutlet, ModalComponent, SheetComponent, IcoComponent, PaginadorComponent, ScrollShadowDirective],
  templateUrl: './bandeja.component.html',
  styleUrl: './bandeja.component.scss',
})
export class BandejaComponent {
  readonly s = inject(CobrosStore);
  private readonly toast = inject(ToastService);
  readonly gestores = GESTORES; readonly campanas = CAMPANAS; readonly estados = ESTADOS; readonly provincias = PROVINCIAS;
  readonly entidades = ENTIDADES; readonly motivos = MOTIVOS_APLAZAMIENTO; readonly formas = FORMAS_PAGO; readonly marcadores = MARCADORES;
  readonly eur = eur; readonly estadoClass = estadoClass;

  /** Borrador de filtros: se aplica al pulsar «Filtrar». */
  b: Filtros = { ...this.s.filtros(), marcadores: [...this.s.filtros().marcadores] };
  readonly negativoTotal = computed(() => this.s.filtrados().reduce((t, e) => t + e.negativo, 0));
  readonly masFiltros = signal(false);
  /** Tablet y móvil: lista de tarjetas, filtros en hoja y «Mostrar más» en lugar de paginación. */
  private readonly mq = matchMedia('(max-width: 1024px)');
  readonly compacto = signal(this.mq.matches);
  readonly hojaFiltros = signal(false);
  readonly visibles = signal(10);
  readonly listaCompacta = computed(() => this.s.filtrados().slice(0, this.visibles()));
  readonly seleccionVisibles = computed(() => {
    const ids = this.listaCompacta().map((e) => e.id); const sel = this.s.seleccion();
    const n = ids.filter((id) => sel.has(id)).length;
    return n === 0 ? 'none' : n === ids.length ? 'all' : 'some';
  });
  /** Contador en vivo del botón «Ver N resultados» de la hoja de filtros. */
  previa(): number { return this.s.contar(this.b); }
  readonly marcadoresAbierto = signal(false);
  readonly modalReasignar = signal(false);
  nuevoGestor = '';
  intento = false;

  readonly columnas: { key: SortKey; label: string; r?: boolean }[] = [
    { key: 'campana', label: 'Campaña' }, { key: 'numCliente', label: 'Nº cli.' }, { key: 'entidad', label: 'Entidad' },
    { key: 'gestor', label: 'Gestor' }, { key: 'provincia', label: 'Provincia' }, { key: 'estado', label: 'Estado' },
  ];

  get pendientes(): boolean { return JSON.stringify(this.b) !== JSON.stringify(this.s.filtros()); }

  constructor() {
    const cb = (e: MediaQueryListEvent) => this.compacto.set(e.matches);
    this.mq.addEventListener('change', cb);
    inject(DestroyRef).onDestroy(() => this.mq.removeEventListener('change', cb));
  }

  abrirFiltros(): void { this.b = { ...this.s.filtros(), marcadores: [...this.s.filtros().marcadores] }; this.masFiltros.set(true); this.hojaFiltros.set(true); }
  toggleVisibles(): void {
    const ids = this.listaCompacta().map((e) => e.id); const marcar = this.seleccionVisibles() !== 'all';
    this.s.seleccion.update((s) => { const n = new Set(s); ids.forEach((id) => (marcar ? n.add(id) : n.delete(id))); return n; });
  }

  ordenMovil(v: string): void { const [key, dir] = v.split(':'); this.s.sort.set({ key: key as SortKey, dir: +dir as 1 | -1 }); }

  filtrar(): void {
    this.hojaFiltros.set(false);
    this.visibles.set(10);
    this.s.aplicarFiltros(this.b);
    this.marcadoresAbierto.set(false);
    this.toast.show('info', 'Filtros aplicados', `${this.s.filtrados().length} expedientes encontrados`);
  }
  limpiar(): void { this.b = { ...FILTROS_VACIOS, marcadores: [] }; this.s.limpiarFiltros(); this.visibles.set(10); }

  toggleMarcador(k: Marcador): void {
    this.b.marcadores = this.b.marcadores.includes(k) ? this.b.marcadores.filter((x) => x !== k) : [...this.b.marcadores, k];
  }
  etiquetaMarcadores(): string {
    const n = this.b.marcadores.length;
    if (!n) return 'Sin marcadores';
    return n === 1 ? MARCADORES.find((m) => m.k === this.b.marcadores[0])!.label : `${n} marcadores · ${this.b.modoMarcadores}`;
  }

  @HostListener('document:click', ['$event'])
  cerrarPopover(e: MouseEvent): void { if (!(e.target as HTMLElement).closest('.mk')) this.marcadoresAbierto.set(false); }
  @HostListener('document:keydown.escape')
  esc(): void { this.marcadoresAbierto.set(false); }

  num(v: string | number | null): number | null { if (v === null || v === '') return null; const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; }

  ariaSort(k: SortKey): 'ascending' | 'descending' | 'none' {
    const s = this.s.sort(); return s.key !== k ? 'none' : s.dir === 1 ? 'ascending' : 'descending';
  }

  abrirReasignar(): void { this.nuevoGestor = ''; this.intento = false; this.modalReasignar.set(true); }
  confirmarReasignar(): void {
    this.intento = true;
    if (!this.nuevoGestor) return;
    const n = this.s.seleccion().size;
    this.s.reasignar([...this.s.seleccion()], this.nuevoGestor);
    this.modalReasignar.set(false);
    this.toast.show('ok', 'Guardado', `${n} expediente${n > 1 ? 's' : ''} reasignado${n > 1 ? 's' : ''} a ${this.nuevoGestor}`);
  }

  exportar(): void {
    const rows = this.s.filtrados();
    const csv = ['Expediente;Campaña;Nº cliente;Entidad;Gestor;Provincia;Cliente;Estado;Gran cuenta;Motivo aplazamiento;Observaciones;Deuda total;Importe negativo',
      ...rows.map((e) => [e.id, e.campana, e.numCliente, e.entidad, e.gestor, e.provincia, e.cliente, e.estado, e.granCuenta ? 'Sí' : 'No', e.motivoAplazamiento ?? '', e.observaciones ?? '', e.deuda.toFixed(2).replace('.', ','), e.negativo.toFixed(2).replace('.', ',')].join(';'))].join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    Object.assign(document.createElement('a'), { href: url, download: 'expedientes.csv' }).click();
    URL.revokeObjectURL(url);
    this.toast.show('info', 'Exportado', `${rows.length} expedientes en expedientes.csv`);
  }
}
