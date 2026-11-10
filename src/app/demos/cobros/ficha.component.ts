import { Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { CobrosStore } from './cobros.store';
import {
  Actuacion, Aplazamiento, CAMPANAS, ESTADOS, Estado, GESTORES, MOTIVOS_APLAZAMIENTO, MOTIVOS_CIERRE, TIPOS_ACTUACION, TIPOS_DOCUMENTO,
  eur, estadoClass, fecha, iso,
} from './cobros.data';
import { ModalComponent } from '../../shared/ui/modal.component';
import { ToastService } from '../../shared/ui/toast.service';
import { IcoComponent } from './ui';
import { SheetComponent } from '../../shared/ui/sheet.component';

type Pestana = 'seguimiento' | 'facturas' | 'movimientos' | 'aplazamientos' | 'bajas' | 'reclamaciones' | 'logs';
type Modal = 'actuacion' | 'aplazamiento' | 'reasignar' | 'campana' | 'cerrar' | 'contacto' | 'documento' | 'compromiso' | 'borrar' | null;

@Component({
  selector: 'app-ficha',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet, FormsModule, ReactiveFormsModule, ModalComponent, SheetComponent, IcoComponent],
  templateUrl: './ficha.component.html',
  styleUrl: './ficha.component.scss',
})
export class FichaComponent {
  /** Parámetro de ruta :id (withComponentInputBinding). */
  readonly id = input.required<string>();
  private readonly s = inject(CobrosStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly eur = eur; readonly estadoClass = estadoClass; readonly fecha = fecha;
  readonly estados = ESTADOS; readonly tipos = TIPOS_ACTUACION; readonly gestores = GESTORES; readonly campanas = CAMPANAS;
  readonly motivosAplaz = MOTIVOS_APLAZAMIENTO; readonly motivosCierre = MOTIVOS_CIERRE; readonly tiposDoc = TIPOS_DOCUMENTO;

  readonly exp = computed(() => this.s.byId(+this.id()));
  readonly pestana = signal<Pestana>('seguimiento');
  readonly modal = signal<Modal>(null);
  readonly hojaAcciones = signal(false);
  readonly editando = signal<number | null>(null);
  readonly borrarId = signal<number | null>(null);
  readonly facturasSel = signal<Set<string>>(new Set());
  enviado = false;
  archivo: string | null = null;
  arrastrando = false;

  readonly pestanas = computed(() => {
    const e = this.exp();
    return [
      { k: 'seguimiento' as Pestana, l: 'Seguimiento', n: e?.actuaciones.length ?? 0, w: false },
      { k: 'facturas' as Pestana, l: 'Fact. pendientes', n: e?.facturas.length ?? 0, w: false },
      { k: 'movimientos' as Pestana, l: 'Movimientos', n: e?.movimientos.length ?? 0, w: false },
      { k: 'aplazamientos' as Pestana, l: 'Aplazamientos', n: e?.aplazamientos.length ?? 0, w: false },
      { k: 'bajas' as Pestana, l: 'Bajas', n: e?.bajas.length ?? 0, w: !!e?.bajas.length },
      { k: 'reclamaciones' as Pestana, l: 'Reclamaciones', n: e?.reclamaciones.length ?? 0, w: !!e?.reclamaciones.length },
      { k: 'logs' as Pestana, l: 'Logs', n: e?.logs.length ?? 0, w: false },
    ];
  });

  /** Navegación entre expedientes respetando los filtros y el orden de la bandeja. */
  readonly vecinos = computed(() => {
    const ids = this.s.filtrados().map((e) => e.id);
    const i = ids.indexOf(+this.id());
    return { first: ids[0], prev: i > 0 ? ids[i - 1] : null, next: i >= 0 && i < ids.length - 1 ? ids[i + 1] : null, last: ids[ids.length - 1], pos: i + 1, total: ids.length };
  });
  readonly deudaNeta = computed(() => (this.exp()?.deuda ?? 0) + (this.exp()?.negativo ?? 0));

  /* ——— formularios ——— */
  readonly fAct = this.fb.nonNullable.group({
    gestor: ['', Validators.required], tipo: ['', Validators.required], fecha: [iso(new Date()), Validators.required],
    descripcion: ['', [Validators.required, Validators.minLength(5)]], recupera: ['no'], importe: [''],
    aplazamiento: ['no'], vencimiento: [''], grupo: [false],
  });
  readonly fAp = this.fb.nonNullable.group({ vencimiento: ['', Validators.required], motivo: ['', Validators.required], descripcion: ['', Validators.required] });
  simple = { gestor: '', campana: '', motivo: '', descripcion: '', contacto: '', telefono: '', email: '', tipoDoc: '', destinatario: '', asunto: '', vencimiento: '', tipoCompromiso: '' };

  ir(id: number | null | undefined): void { if (id) this.router.navigate(['/demos/cobros/expediente', id]); }

  abrir(m: Exclude<Modal, null>, act?: Actuacion): void {
    const e = this.exp()!;
    this.enviado = false; this.archivo = null;
    if (m === 'actuacion') {
      this.editando.set(act?.id ?? null);
      this.fAct.reset({
        gestor: act?.gestor ?? e.gestor, tipo: act?.tipo ?? '', fecha: act?.fecha ?? iso(new Date()), descripcion: act?.descripcion ?? '',
        recupera: act?.recobrado ? 'si' : 'no', importe: act?.recobrado ? String(act.recobrado) : '', aplazamiento: 'no', vencimiento: '', grupo: false,
      });
      this.archivo = act?.adjunto ?? null;
    }
    if (m === 'aplazamiento') { this.editando.set(null); this.fAp.reset({ vencimiento: '', motivo: '', descripcion: '' }); }
    this.simple = { gestor: '', campana: '', motivo: '', descripcion: '', contacto: e.contacto, telefono: e.telefono, email: e.emailCobro, tipoDoc: '', destinatario: e.contacto, asunto: '', vencimiento: '', tipoCompromiso: '' };
    this.modal.set(m);
  }
  editarAplazamiento(a: Aplazamiento): void {
    this.abrir('aplazamiento'); this.editando.set(a.id);
    this.fAp.reset({ vencimiento: a.vencimiento, motivo: a.motivo, descripcion: a.descripcion });
  }
  desdeHoja(m: Exclude<Modal, null>): void { this.hojaAcciones.set(false); setTimeout(() => this.abrir(m), 120); }
  cerrarModal(): void { this.modal.set(null); }

  err(form: 'act' | 'ap', c: string): boolean {
    const ctrl = form === 'act' ? this.fAct.get(c)! : this.fAp.get(c)!;
    return ctrl.invalid && (ctrl.touched || this.enviado);
  }
  private focoError(ids: string[], invalid: (k: string) => boolean): void {
    const k = ids.find(invalid); if (k) document.getElementById('m-' + k)?.focus();
  }

  importeValido(): boolean { return parseFloat((this.fAct.value.importe ?? '').replace(',', '.')) > 0; }

  guardarActuacion(): void {
    this.enviado = true;
    const v = this.fAct.getRawValue();
    const importe = parseFloat(v.importe.replace(',', '.'));
    const importeMal = v.recupera === 'si' && (isNaN(importe) || importe <= 0);
    const vencMal = v.aplazamiento === 'add' && !v.vencimiento;
    if (this.fAct.invalid || importeMal || vencMal) {
      this.focoError(['gestor', 'tipo', 'fecha', 'descripcion'], (k) => this.fAct.get(k)!.invalid);
      if (!this.fAct.invalid) document.getElementById(importeMal ? 'm-importe' : 'm-venc')?.focus();
      return;
    }
    const e = this.exp()!;
    this.s.guardarActuacion(e.id, {
      fecha: v.fecha, tipo: v.tipo, descripcion: v.descripcion, gestor: v.gestor,
      recobrado: v.recupera === 'si' ? importe : null, devuelto: null, adjunto: this.archivo, ejecucion: null,
    }, this.editando());
    if (v.aplazamiento === 'add') this.s.guardarAplazamiento(e.id, { vencimiento: v.vencimiento, motivo: 'Compromiso de pago', descripcion: v.descripcion }, null);
    this.modal.set(null); this.pestana.set('seguimiento');
    this.toast.show('ok', 'Guardado', this.editando() ? 'La actuación se ha modificado' : `La actuación se ha creado${v.grupo ? ' para todo el grupo de clientes' : ''}`);
  }

  guardarAplazamiento(): void {
    this.enviado = true;
    if (this.fAp.invalid) { this.focoError(['vencimiento', 'motivo', 'descripcion'], (k) => this.fAp.get(k)!.invalid); return; }
    this.s.guardarAplazamiento(this.exp()!.id, this.fAp.getRawValue(), this.editando());
    this.modal.set(null); this.pestana.set('aplazamientos');
    this.toast.show('ok', 'Guardado', 'Aplazamiento registrado');
  }

  guardarSimple(): void {
    this.enviado = true;
    const e = this.exp()!; const v = this.simple;
    switch (this.modal()) {
      case 'reasignar': if (!v.gestor) return; this.s.reasignar([e.id], v.gestor); this.toast.show('ok', 'Guardado', `Expediente reasignado a ${v.gestor}`); break;
      case 'campana': if (!v.campana) return; this.s.reasignarCampana(e.id, v.campana); this.toast.show('ok', 'Guardado', `Campaña cambiada a ${v.campana}`); break;
      case 'cerrar': if (!v.motivo || !v.descripcion.trim()) return; this.s.cerrar(e.id, v.motivo, v.descripcion); this.toast.show('ok', 'Expediente cerrado', v.motivo); break;
      case 'contacto': if (!v.contacto.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return; this.s.actualizarContacto(e.id, v.contacto, v.telefono, v.email); this.toast.show('ok', 'Guardado', 'Contacto de cobro actualizado'); break;
      case 'documento': if (!v.tipoDoc || !v.asunto.trim()) return; this.toast.show('ok', 'Documento generado', `${v.tipoDoc} para ${e.cliente}`); break;
      case 'compromiso': if (!v.vencimiento || !v.tipoCompromiso || !this.facturasSel().size) return;
        this.s.compromisoPago(e.id, [...this.facturasSel()], v.vencimiento, v.tipoCompromiso); this.facturasSel.set(new Set()); this.pestana.set('seguimiento');
        this.toast.show('ok', 'Compromiso registrado', 'Se ha añadido al seguimiento'); break;
    }
    this.modal.set(null);
  }

  confirmarBorrado(): void {
    const id = this.borrarId(); if (id === null) return;
    this.s.borrarActuacion(this.exp()!.id, id); this.borrarId.set(null); this.modal.set(null);
    this.toast.show('info', 'Eliminada', 'La actuación se ha borrado');
  }

  cambiarEstado(v: string): void { this.s.cambiarEstado(this.exp()!.id, v as Estado); this.toast.show('ok', 'Guardado', `Estado cambiado a ${v}`); }
  recalcular(): void { this.s.recalcularScoring(this.exp()!.id); this.toast.show('info', 'Scoring recalculado', `Nuevo valor: ${this.exp()!.scoring}`); }
  aviso(t: string, d: string): void { this.toast.show('info', t, d); }

  toggleFactura(n: string): void { this.facturasSel.update((s) => { const x = new Set(s); x.has(n) ? x.delete(n) : x.add(n); return x; }); }
  toggleTodasFacturas(): void { const all = this.exp()!.facturas.map((f) => f.numero); this.facturasSel.set(this.facturasSel().size === all.length ? new Set() : new Set(all)); }

  /* ——— adjunto (arrastrar o seleccionar) ——— */
  soltar(ev: DragEvent): void { ev.preventDefault(); this.arrastrando = false; const f = ev.dataTransfer?.files?.[0]; if (f) this.archivo = f.name; }
  elegirArchivo(ev: Event): void { const f = (ev.target as HTMLInputElement).files?.[0]; if (f) this.archivo = f.name; }

  teclaPestana(e: KeyboardEvent): void {
    const orden = this.pestanas().map((p) => p.k);
    const i = orden.indexOf(this.pestana());
    const mapa: Record<string, number> = { ArrowRight: (i + 1) % orden.length, ArrowLeft: (i - 1 + orden.length) % orden.length, Home: 0, End: orden.length - 1 };
    if (!(e.key in mapa)) return;
    e.preventDefault();
    this.pestana.set(orden[mapa[e.key]]);
    setTimeout(() => (document.querySelector('.ftabs [aria-selected=true]') as HTMLElement | null)?.focus());
  }

  estrellas(n: number): boolean[] { return Array.from({ length: 5 }, (_, i) => i < n); }
  readonly tituloModal: Record<Exclude<Modal, null>, string> = {
    actuacion: 'Añadir actuación', aplazamiento: 'Añadir aplazamiento', reasignar: 'Reasignar expediente', campana: 'Reasignar campaña',
    cerrar: 'Cerrar expediente', contacto: 'Actualizar contacto de cobros', documento: 'Generar documentación', compromiso: 'Compromiso de pago', borrar: '¿Borrar la actuación?',
  };
  heading(): string {
    const m = this.modal(); if (!m) return '';
    if (m === 'actuacion' && this.editando() !== null) return 'Modificar actuación';
    if (m === 'aplazamiento' && this.editando() !== null) return 'Modificar aplazamiento';
    return this.tituloModal[m];
  }
}
