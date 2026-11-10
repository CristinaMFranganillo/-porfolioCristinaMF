import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CobrosStore } from './cobros.store';
import { eur } from './cobros.data';
import { ToastService } from '../../shared/ui/toast.service';
import { IcoComponent } from './ui';

/** Importación del Excel diario de ingresos del banco y aplicación a los expedientes. */
@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [RouterLink, IcoComponent],
  template: `
    <h1>Ingresos diarios</h1>
    <section class="dk-card imp" aria-labelledby="imp-t">
      <h2 id="imp-t"><app-ico name="upload" /> Importar ingresos</h2>
      <label class="drop" [class.over]="arrastrando()" (dragover)="$event.preventDefault(); arrastrando.set(true)" (dragleave)="arrastrando.set(false)" (drop)="soltar($event)">
        <input type="file" class="sr" accept=".xls,.xlsx,.csv" (change)="elegir($event)">
        <app-ico name="folder" [size]="26" />
        <span class="cta">Arrastra el archivo aquí o haz clic para seleccionar</span>
        <small>Fichero de ingresos en Excel (.xls, .xlsx). En la demo vale cualquier archivo: se leen datos ficticios.</small>
      </label>
      <div class="row">
        <span class="muted">{{ s.ficheroIngresos() ?? 'Ningún fichero seleccionado' }}</span>
        <div class="row-r">
          <button type="button" class="dk-btn ghost sm" (click)="ejemplo()">Usar fichero de ejemplo</button>
          <button type="button" class="dk-btn primary" [disabled]="!pendiente() || leyendo()" (click)="subir()">
            @if (leyendo()) { <span class="spin" aria-hidden="true"></span> Leyendo… } @else { <app-ico name="upload" /> Subir }</button>
        </div>
      </div>
    </section>

    <div class="ph">
      <h2>Pendientes <span class="badge">{{ s.ingresos().length }} pendientes</span></h2>
      <div class="acts">
        <button type="button" class="dk-btn" (click)="toggleTodos()" [disabled]="!s.ingresos().length">Marcar/Desmarcar todo</button>
        <button type="button" class="dk-btn primary" [disabled]="!sel().size" (click)="ejecutarSeleccion()"><app-ico name="check" /> Ejecutar {{ sel().size ? '(' + sel().size + ')' : 'seleccionados' }}</button>
      </div>
    </div>
    <div class="dk-table-wrap">
      <table class="dk-table dense">
        <caption class="sr">Ingresos pendientes de aplicar</caption>
        <thead><tr><th scope="col">Acciones</th><th scope="col">CIF cliente</th><th scope="col">Entidad</th><th scope="col">Nº cliente</th><th scope="col">Concepto</th><th scope="col">Expediente</th><th scope="col" class="r">Importe</th></tr></thead>
        <tbody>
          @for (i of s.ingresos(); track i.id) {
            <tr [class.is-selected]="sel().has(i.id)">
              <td class="acc"><input type="checkbox" [checked]="sel().has(i.id)" (change)="toggle(i.id)" [attr.aria-label]="'Seleccionar ingreso ' + i.concepto">
                <button type="button" (click)="ejecutar([i.id])" [attr.aria-label]="'Ejecutar ingreso ' + i.concepto" title="Ejecutar"><app-ico name="play" [size]="14" /></button></td>
              <td class="mono">{{ i.cif }}</td><td>{{ i.entidad }}</td><td class="mono">{{ i.numCliente }}</td><td class="concept">{{ i.concepto }}</td>
              <td>@if (i.expediente) { <a [routerLink]="['/demos/cobros/expediente', i.expediente]" class="mono">{{ i.expediente }}</a> } @else { <span class="nomatch">Sin coincidencia</span> }</td>
              <td class="r">{{ eur(i.importe) }}</td>
            </tr>
          } @empty {
            <tr><td colspan="7"><div class="dk-empty"><b>No hay ingresos pendientes</b><span>Importa el fichero del banco para empezar.</span></div></td></tr>
          }
        </tbody>
      </table>
    </div>
    @if (s.ingresos().length) { <p class="total">Total pendiente: <b>{{ eur(total()) }}</b></p> }
  `,
  styles: `
    :host{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
    .imp{padding:14px 16px;display:grid;gap:10px}
    h2{font-size:.9375rem;margin:0;display:flex;align-items:center;gap:8px}
    .drop{border:1.5px dashed var(--rule);border-radius:8px;padding:22px;display:grid;justify-items:center;gap:6px;text-align:center;cursor:pointer;color:var(--ink-soft);background:var(--paper)}
    .drop .cta{background:var(--sheet);border:1px solid var(--rule);border-radius:999px;padding:4px 12px;color:var(--ink)}
    .drop small{font-size:.6875rem}
    .drop.over,.drop:hover{border-color:var(--ultra);color:var(--ultra)}
    .drop:focus-within{outline:2px solid var(--ultra);outline-offset:2px}
    .row{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
    .row-r,.acts{display:flex;gap:8px;flex-wrap:wrap}
    .muted{color:var(--ink-soft);font-size:.75rem}
    .ph{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
    .badge{font:600 .625rem var(--f-mono);text-transform:uppercase;background:color-mix(in srgb,#C77700 18%,transparent);color:var(--ink);border-radius:999px;padding:2px 8px}
    .dense th,.dense td{padding:8px 10px}
    .acc{display:flex;gap:6px;align-items:center}
    .acc input{accent-color:var(--ultra);width:15px;height:15px}
    .acc button{border:0;background:transparent;color:var(--ultra);cursor:pointer;border-radius:50%;width:24px;height:24px;display:grid;place-items:center;border:1px solid currentColor}
    .acc button:hover{background:var(--ultra-soft)}
    .mono{font-family:var(--f-mono);font-size:.75rem}
    a.mono{color:var(--ultra)}
    .concept{font-weight:600;font-size:.75rem}
    .nomatch{font:600 .625rem var(--f-mono);text-transform:uppercase;color:var(--spec);background:var(--spec-soft);border-radius:999px;padding:2px 8px}
    .total{margin:0;text-align:right}
    .spin{width:14px;height:14px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:r .7s linear infinite}
    @keyframes r{to{transform:rotate(360deg)}}
    .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  `,
})
export class IngresosComponent {
  readonly s = inject(CobrosStore);
  private readonly toast = inject(ToastService);
  readonly eur = eur;
  readonly sel = signal<Set<number>>(new Set());
  readonly pendiente = signal<string | null>(null);
  readonly leyendo = signal(false);
  readonly arrastrando = signal(false);
  readonly total = computed(() => this.s.ingresos().reduce((t, i) => t + i.importe, 0));

  elegir(e: Event): void { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.preparar(f.name); }
  soltar(e: DragEvent): void { e.preventDefault(); this.arrastrando.set(false); const f = e.dataTransfer?.files?.[0]; if (f) this.preparar(f.name); }
  ejemplo(): void { this.preparar('ingresos_banco_ejemplo.xlsx'); }
  private preparar(nombre: string): void { this.pendiente.set(nombre); this.s.ficheroIngresos.set(nombre); }

  subir(): void {
    this.leyendo.set(true);
    setTimeout(() => {
      this.s.importarIngresos(this.pendiente()!);
      this.leyendo.set(false); this.pendiente.set(null); this.sel.set(new Set());
      this.toast.show('ok', 'Fichero importado', `${this.s.ingresos().length} ingresos pendientes de aplicar`);
    }, 900);
  }

  toggle(id: number): void { this.sel.update((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  toggleTodos(): void { const all = this.s.ingresos().map((i) => i.id); this.sel.set(this.sel().size === all.length ? new Set() : new Set(all)); }

  ejecutarSeleccion(): void { this.ejecutar([...this.sel()]); }

  ejecutar(ids: number[]): void {
    const r = this.s.ejecutarIngresos(ids);
    this.sel.update((s) => new Set([...s].filter((id) => this.s.ingresos().some((i) => i.id === id))));
    if (r.ok) this.toast.show('ok', 'Ingresos aplicados', `${r.ok} ingreso${r.ok > 1 ? 's' : ''} aplicado${r.ok > 1 ? 's' : ''} a su expediente`);
    if (r.sinExpediente) this.toast.show('warn', 'Atención', `${r.sinExpediente} ingreso sin expediente: revísalo manualmente`);
  }
}
