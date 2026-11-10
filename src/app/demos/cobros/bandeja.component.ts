import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CobrosStore, SortKey } from './cobros.store';
import { CAMPANAS, ESTADOS, GESTORES, PROVINCIAS, eur, estadoClass } from './cobros.data';
import { ModalComponent } from '../../shared/ui/modal.component';
import { ToastService } from '../../shared/ui/toast.service';

@Component({
  selector: 'app-bandeja',
  standalone: true,
  imports: [FormsModule, RouterLink, ModalComponent],
  templateUrl: './bandeja.component.html',
  styleUrl: './bandeja.component.scss',
})
export class BandejaComponent {
  readonly s = inject(CobrosStore);
  private readonly toast = inject(ToastService);
  readonly gestores = GESTORES; readonly campanas = CAMPANAS; readonly estados = ESTADOS; readonly provincias = PROVINCIAS;
  readonly eur = eur; readonly estadoClass = estadoClass;
  readonly filtrosAbiertos = signal(true);
  readonly modalReasignar = signal(false);
  nuevoGestor = '';
  intentoReasignar = false;

  readonly columnas: { key: SortKey; label: string; r?: boolean }[] = [
    { key: 'id', label: 'Exp.' }, { key: 'cliente', label: 'Cliente' }, { key: 'gestor', label: 'Gestor' },
    { key: 'provincia', label: 'Provincia' }, { key: 'estado', label: 'Estado' }, { key: 'deuda', label: 'Deuda', r: true },
  ];

  ariaSort(k: SortKey): 'ascending' | 'descending' | 'none' {
    const s = this.s.sort();
    return s.key !== k ? 'none' : s.dir === 1 ? 'ascending' : 'descending';
  }

  num(v: string): number | null { const n = parseFloat(v.replace(',', '.')); return isNaN(n) ? null : n; }

  paginas(): number[] { return Array.from({ length: this.s.totalPaginas() }, (_, i) => i + 1); }

  abrirReasignar(): void { this.nuevoGestor = ''; this.intentoReasignar = false; this.modalReasignar.set(true); }

  confirmarReasignar(): void {
    this.intentoReasignar = true;
    if (!this.nuevoGestor) return;
    const n = this.s.seleccion().size;
    this.s.reasignar([...this.s.seleccion()], this.nuevoGestor);
    this.modalReasignar.set(false);
    this.toast.show('ok', 'Guardado', `${n} expediente${n > 1 ? 's' : ''} reasignado${n > 1 ? 's' : ''} a ${this.nuevoGestor}`);
  }

  exportar(): void {
    const rows = this.s.filtrados();
    const csv = ['Expediente;Cliente;NIF;Gestor;Provincia;Estado;Deuda',
      ...rows.map((e) => [e.id, e.cliente, e.nif, e.gestor, e.provincia, e.estado, e.deuda.toFixed(2).replace('.', ',')].join(';'))].join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'expedientes.csv' });
    a.click();
    URL.revokeObjectURL(url);
    this.toast.show('info', 'Exportado', `${rows.length} expedientes en expedientes.csv`);
  }
}
