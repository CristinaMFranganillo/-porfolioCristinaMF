import { Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CobrosStore } from './cobros.store';
import { ESTADOS, Estado, TIPOS_ACTUACION, eur, estadoClass } from './cobros.data';
import { ModalComponent } from '../../shared/ui/modal.component';
import { ToastService } from '../../shared/ui/toast.service';

type Pestana = 'seguimiento' | 'facturas' | 'logs';

@Component({
  selector: 'app-ficha',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, ModalComponent],
  templateUrl: './ficha.component.html',
  styleUrl: './ficha.component.scss',
})
export class FichaComponent {
  /** Viene del parámetro de ruta :id gracias a withComponentInputBinding(). */
  readonly id = input.required<string>();
  private readonly s = inject(CobrosStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly eur = eur; readonly estadoClass = estadoClass; readonly estados = ESTADOS; readonly tipos = TIPOS_ACTUACION;
  readonly exp = computed(() => this.s.byId(+this.id()));
  readonly pestana = signal<Pestana>('seguimiento');
  readonly modalAlta = signal(false);
  readonly borrarId = signal<number | null>(null);
  enviado = false;

  /** Navegación anterior/siguiente dentro del listado filtrado actual. */
  readonly vecinos = computed(() => {
    const ids = this.s.filtrados().map((e) => e.id);
    const i = ids.indexOf(+this.id());
    return { prev: i > 0 ? ids[i - 1] : null, next: i >= 0 && i < ids.length - 1 ? ids[i + 1] : null, pos: i + 1, total: ids.length };
  });

  readonly recobrado = computed(() => (this.exp()?.actuaciones ?? []).reduce((s, a) => s + (a.recobrado ?? 0), 0));

  readonly form = this.fb.nonNullable.group({
    tipo: ['', Validators.required],
    fecha: [new Date().toISOString().slice(0, 10), Validators.required],
    descripcion: ['', [Validators.required, Validators.minLength(5)]],
    recobrado: [''],
  });

  invalid(c: 'tipo' | 'fecha' | 'descripcion'): boolean {
    const ctrl = this.form.controls[c];
    return ctrl.invalid && (ctrl.touched || this.enviado);
  }

  ir(id: number | null): void { if (id) this.router.navigate(['/demos/cobros/expediente', id]); }

  cambiarEstado(v: string): void {
    const e = this.exp(); if (!e) return;
    this.s.cambiarEstado(e.id, v as Estado);
    this.toast.show('ok', 'Guardado', `Estado cambiado a ${v}`);
  }

  abrirAlta(): void {
    this.enviado = false;
    this.form.reset({ tipo: '', fecha: new Date().toISOString().slice(0, 10), descripcion: '', recobrado: '' });
    this.modalAlta.set(true);
  }

  guardar(): void {
    this.enviado = true;
    if (this.form.invalid) {
      const first = (['tipo', 'fecha', 'descripcion'] as const).find((c) => this.form.controls[c].invalid);
      document.getElementById('a-' + first)?.focus();
      return;
    }
    const v = this.form.getRawValue();
    const imp = parseFloat(v.recobrado.replace(',', '.'));
    this.s.addActuacion(this.exp()!.id, { tipo: v.tipo, fecha: v.fecha, descripcion: v.descripcion, recobrado: isNaN(imp) ? null : imp });
    this.modalAlta.set(false);
    this.pestana.set('seguimiento');
    this.toast.show('ok', 'Guardado', 'La actuación se ha creado correctamente');
  }

  confirmarBorrado(): void {
    const id = this.borrarId(); if (id === null) return;
    this.s.deleteActuacion(this.exp()!.id, id);
    this.borrarId.set(null);
    this.toast.show('info', 'Eliminada', 'La actuación se ha borrado');
  }

  teclaPestana(e: KeyboardEvent): void {
    const orden: Pestana[] = ['seguimiento', 'facturas', 'logs'];
    const i = orden.indexOf(this.pestana());
    const mapa: Record<string, number> = { ArrowRight: (i + 1) % 3, ArrowLeft: (i + 2) % 3, Home: 0, End: 2 };
    if (!(e.key in mapa)) return;
    e.preventDefault();
    this.pestana.set(orden[mapa[e.key]]);
    setTimeout(() => (document.querySelector('[role=tab][aria-selected=true]') as HTMLElement | null)?.focus());
  }

  fecha(iso: string): string { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; }
}
