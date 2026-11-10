import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScrollShadowDirective } from '../../shared/scroll-shadow.directive';
import { IcoComponent } from './ui';
import { eur } from './cobros.data';

/*
 * Índice de recaptación: informe muy ancho (servicio × total/negativa/positiva × nº/€/%).
 * Detalle de usabilidad: la columna Delegación, la cabecera de dos niveles y la fila de
 * totales quedan fijas; al desplazar aparece una sombra que indica contenido oculto.
 */
interface Celda { total: number; totalEur: number; neg: number; negEur: number; pos: number; posEur: number; }
interface Fila { delegacion: string; datos: Record<string, Celda>; }

const SERVICIOS = ['Servicio A', 'Servicio B', 'Servicio C', 'Servicio D', 'Servicio E'];
const DELEGACIONES = ['Delegación Centro', 'Delegación Norte', 'Delegación Noroeste', 'Delegación Este', 'Delegación Costa', 'Delegación Sur', 'Delegación Interior', 'Delegación Islas'];

function rng(seed: number) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280); }

function generar(desde: string, hasta: string): Fila[] {
  const r = rng([...desde + hasta].reduce((a, c) => a + c.charCodeAt(0), 0));
  return DELEGACIONES.map((delegacion, i) => ({
    delegacion,
    datos: Object.fromEntries(SERVICIOS.map((s) => {
      const total = i === 2 && s === 'Servicio A' ? 0 : Math.floor(r() * 16);
      const pos = Math.round(total * (0.25 + r() * 0.55));
      const medio = 700 + r() * 900;
      const posEur = Math.round(pos * medio * (0.8 + r() * 0.4));
      const negEur = Math.round((total - pos) * medio);
      return [s, { total, totalEur: posEur + negEur, neg: total - pos, negEur, pos, posEur }];
    })),
  }));
}

@Component({
  selector: 'app-recaptacion',
  standalone: true,
  imports: [FormsModule, ScrollShadowDirective, IcoComponent],
  template: `
    <h1>Índice de recaptación</h1>
    <form class="dk-card band" (submit)="$event.preventDefault(); buscar()">
      <fieldset class="rango"><legend class="dk-label">Entre</legend>
        <input type="date" class="dk-input" [(ngModel)]="desde" name="d" aria-label="Desde">
        <span>y</span>
        <input type="date" class="dk-input" [(ngModel)]="hasta" name="h" aria-label="Hasta">
      </fieldset>
      <button type="button" class="dk-btn" (click)="restablecer()" aria-label="Restablecer fechas" title="Restablecer fechas"><app-ico name="refresh" /></button>
      <button type="submit" class="dk-btn primary"><app-ico name="search" /> Buscar</button>
    </form>

    <div class="bar">
      <div class="tabs" role="tablist" aria-label="Servicio">
        @for (t of tabs; track t) {
          <button role="tab" type="button" [attr.aria-selected]="servicio() === t" [tabIndex]="servicio() === t ? 0 : -1" (click)="servicio.set(t)" (keydown)="tecla($event)">{{ t }}</button>
        }
      </div>
      <p class="legend"><span>% positiva:</span><span class="pc hi">≥ 60 %</span><span class="pc md">40–60 %</span><span class="pc lo">&lt; 40 %</span></p>
    </div>

    <div class="sticky-wrap tall" appScrollShadow role="region" aria-label="Índice de recaptación por delegación y servicio; desplázate en horizontal para ver más servicios">
      <table class="dk-table idx">
        <caption class="sr">Índice de recaptación del {{ desde }} al {{ hasta }}. La columna Delegación, la cabecera y los totales quedan fijos al desplazar.</caption>
        <thead>
          <tr class="h1">
            <th scope="col" rowspan="3" class="fx fx-last c-del">Delegación</th>
            @for (s of visibles(); track s; let i = $index) { <th scope="colgroup" colspan="8" class="grp" [class.alt]="i % 2">{{ s }}</th> }
          </tr>
          <tr class="h2">
            @for (s of visibles(); track s; let i = $index) {
              <th scope="colgroup" colspan="2" class="sub start" [class.alt]="i % 2">Total</th>
              <th scope="colgroup" colspan="3" class="sub" [class.alt]="i % 2">Negativa</th>
              <th scope="colgroup" colspan="3" class="sub" [class.alt]="i % 2">Positiva</th>
            }
          </tr>
          <tr class="h3">
            @for (s of visibles(); track s; let i = $index) {
              <th scope="col" class="start" [class.alt]="i % 2">Nº</th><th scope="col" [class.alt]="i % 2">€</th>
              <th scope="col" [class.alt]="i % 2">Nº</th><th scope="col" [class.alt]="i % 2">€</th><th scope="col" [class.alt]="i % 2">%</th>
              <th scope="col" [class.alt]="i % 2">Nº</th><th scope="col" [class.alt]="i % 2">€</th><th scope="col" [class.alt]="i % 2">%</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (f of filas(); track f.delegacion) {
            <tr>
              <th scope="row" class="fx fx-last c-del">{{ f.delegacion }}</th>
              @for (s of visibles(); track s) {
                @let c = f.datos[s];
                <td class="start">{{ c.total }}</td><td>{{ eur0(c.totalEur) }}</td>
                <td>{{ c.neg }}</td><td>{{ eur0(c.negEur) }}</td><td class="pct">{{ pct(c.neg, c.total) }}</td>
                <td>{{ c.pos }}</td><td>{{ eur0(c.posEur) }}</td>
                <td><span [class]="'pc ' + nivel(c.pos, c.total)">{{ pct(c.pos, c.total) }}</span></td>
              }
            </tr>
          }
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" class="fx fx-last c-del">Total</th>
            @for (s of visibles(); track s) {
              @let t = totales()[s];
              <td class="start">{{ t.total }}</td><td>{{ eur0(t.totalEur) }}</td>
              <td>{{ t.neg }}</td><td>{{ eur0(t.negEur) }}</td><td class="pct">{{ pct(t.neg, t.total) }}</td>
              <td>{{ t.pos }}</td><td>{{ eur0(t.posEur) }}</td><td class="pct">{{ pct(t.pos, t.total) }}</td>
            }
          </tr>
        </tfoot>
      </table>
    </div>
    <p class="scroll-hint"><span>La columna <b>Delegación</b>, la cabecera de dos niveles y los <b>totales</b> quedan fijos; la sombra solo aparece cuando hay columnas debajo.</span><span>Enfoca la tabla y usa <span class="kbd">←</span> <span class="kbd">→</span></span></p>
  `,
  styles: `
    :host{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
    .band{display:flex;align-items:flex-end;gap:8px;padding:14px 16px;flex-wrap:wrap}
    .rango{border:0;padding:0;margin:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .rango legend{width:100%;margin-bottom:4px;padding:0}
    .rango .dk-input{width:160px}
    .bar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
    .tabs{display:flex;border:1px solid var(--rule);border-radius:6px;overflow:hidden;background:var(--sheet);flex-wrap:wrap}
    .tabs button{font:500 .8125rem var(--f-sans);border:0;border-left:1px solid var(--rule);background:transparent;color:var(--ink);padding:7px 14px;cursor:pointer}
    .tabs button:first-child{border-left:0}
    .tabs button[aria-selected="true"]{background:var(--ink);color:var(--paper)}
    .legend{margin:0;display:flex;align-items:center;gap:6px;font-size:.75rem;color:var(--ink-soft)}
    .pc{font:600 .6875rem var(--f-mono);border-radius:999px;padding:2px 8px;display:inline-block;min-width:54px;text-align:center;font-variant-numeric:tabular-nums}
    .pc.hi{background:color-mix(in srgb,var(--ok) 18%,transparent);color:color-mix(in srgb,var(--ok) 70%,var(--ink))}
    .pc.md{background:color-mix(in srgb,#C77700 20%,transparent);color:var(--ink)}
    .pc.lo{background:var(--spec-soft);color:var(--spec)}
    .pc.na{background:transparent;color:var(--ink-soft)}
    .tall{max-height:min(62vh,560px)}
    .idx{font-size:.8125rem;font-variant-numeric:tabular-nums}
    .idx th,.idx td{padding:0 12px;height:38px;text-align:right;white-space:nowrap}
    .idx thead th{text-align:center;font:600 .75rem var(--f-sans);text-transform:none;letter-spacing:0;color:var(--ink)}
    .idx thead .h1 th{top:0;height:36px}
    .idx thead .h2 th{top:36px;height:32px;color:var(--ink-soft)}
    .idx thead .h3 th{top:68px;height:30px;color:var(--ink-soft);font-weight:500}
    .idx thead .grp{background:var(--ultra-soft);color:var(--ultra);font-size:.8125rem}
    .idx thead .grp.alt{background:color-mix(in srgb,var(--ink) 7%,var(--sheet));color:var(--ink)}
    .idx .start{border-left:1px solid var(--rule)}
    .idx thead .h2 th,.idx thead .h3 th{border-left:0}
    .idx thead .h2 .start,.idx thead .h3 .start{border-left:1px solid var(--rule)}
    .c-del{left:0;min-width:210px;text-align:left!important;font-weight:600;font-size:.75rem;letter-spacing:.02em;text-transform:uppercase}
    thead .c-del{vertical-align:middle;text-align:left!important;background:var(--sheet)!important;color:var(--ink)}
    tbody .c-del{color:var(--ink)}
    .pct{color:var(--ink-soft)}
    @media (max-width:640px){.c-del{min-width:130px;max-width:130px;white-space:normal!important;line-height:1.2}}
    tfoot td,tfoot th{height:44px}
    tfoot .c-del{text-transform:none;font-size:.875rem;letter-spacing:0}
    .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  `,
})
export class RecaptacionComponent {
  readonly tabs = ['Todos', ...SERVICIOS];
  desde = '2026-01-01';
  hasta = '2026-10-31';
  private readonly periodo = signal({ d: this.desde, h: this.hasta });
  readonly servicio = signal('Todos');
  readonly filas = computed(() => generar(this.periodo().d, this.periodo().h));
  readonly visibles = computed(() => (this.servicio() === 'Todos' ? SERVICIOS : [this.servicio()]));
  readonly totales = computed(() => Object.fromEntries(SERVICIOS.map((s) => [s, this.filas().reduce((t, f) => {
    const c = f.datos[s];
    return { total: t.total + c.total, totalEur: t.totalEur + c.totalEur, neg: t.neg + c.neg, negEur: t.negEur + c.negEur, pos: t.pos + c.pos, posEur: t.posEur + c.posEur };
  }, { total: 0, totalEur: 0, neg: 0, negEur: 0, pos: 0, posEur: 0 })])) as Record<string, Celda>);

  buscar(): void { this.periodo.set({ d: this.desde, h: this.hasta }); }
  restablecer(): void { this.desde = '2026-01-01'; this.hasta = '2026-10-31'; this.buscar(); }

  eur0(n: number): string { return eur(n).replace(/,00\s€$/, ' €'); }
  pct(a: number, t: number): string { return t ? `${((a / t) * 100).toFixed(1).replace('.', ',')} %` : '—'; }
  nivel(a: number, t: number): string { if (!t) return 'na'; const p = (a / t) * 100; return p >= 60 ? 'hi' : p >= 40 ? 'md' : 'lo'; }

  tecla(e: KeyboardEvent): void {
    const i = this.tabs.indexOf(this.servicio());
    const m: Record<string, number> = { ArrowRight: (i + 1) % this.tabs.length, ArrowLeft: (i - 1 + this.tabs.length) % this.tabs.length, Home: 0, End: this.tabs.length - 1 };
    if (!(e.key in m)) return;
    e.preventDefault();
    this.servicio.set(this.tabs[m[e.key]]);
    setTimeout(() => (document.querySelector('.tabs [aria-selected=true]') as HTMLElement | null)?.focus());
  }
}
