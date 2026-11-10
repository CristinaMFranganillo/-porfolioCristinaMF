import { Component, input, output } from '@angular/core';
import { Hueco, fmtFecha, fmtHora } from './asistente.engine';

/** Tarjeta de un hueco propuesto por el asistente: ajuste, motivos de no coincidencia y acción. */
@Component({
  selector: 'app-opcion-card',
  standalone: true,
  host: { role: 'listitem' },
  template: `
    <article class="opt" [class.best]="recomendada() && !bloqueada()" [class.chosen]="elegida()" [class.muted]="bloqueada() && !elegida()" [attr.aria-labelledby]="tid">
      <h2 [id]="tid">Opción {{ rank() }} @if (recomendada()) { <span class="tag">recomendada</span> }</h2>
      <ul>
        <li><b>{{ fmtFecha(hueco().fecha) }} · {{ fmtHora(hueco().fecha) }}</b></li>
        <li>{{ hueco().centro }}</li>
        <li>{{ hueco().profesional }}</li>
      </ul>
      <div class="fit">
        <span>Ajuste <b>{{ hueco().ajuste }} %</b></span>
        <meter min="0" max="100" low="50" high="80" optimum="100" [value]="hueco().ajuste" [attr.aria-label]="'Ajuste ' + hueco().ajuste + ' por ciento'"></meter>
      </div>
      @if (hueco().motivos.length) {
        <ul class="why">@for (m of hueco().motivos; track m) { <li>{{ m }}</li> }</ul>
      } @else { <p class="why ok">Cumple todos los criterios</p> }
      @if (elegida()) { <span class="done">✓ Reservada</span> }
      @else { <button type="button" class="dk-btn sm" [class.primary]="recomendada()" [disabled]="bloqueada()" (click)="reservar.emit(hueco())">{{ etiqueta() }}</button> }
    </article>
  `,
  styles: `
    :host{display:block;min-width:0}
    .opt{height:100%;box-sizing:border-box;border:1px solid var(--rule);border-radius:10px;padding:14px;background:var(--sheet);display:grid;gap:8px;align-content:start;transition:opacity .2s,border-color .2s,box-shadow .2s}
    .opt.best,.opt.chosen{border-color:var(--ultra);box-shadow:0 0 0 1px var(--ultra)}
    .opt.chosen{border-color:var(--ok);box-shadow:0 0 0 1px var(--ok)}
    .opt.muted{opacity:.5}
    h2{margin:0;font-size:.9375rem;letter-spacing:-.01em;display:flex;justify-content:space-between;align-items:center;gap:8px}
    .tag{font:500 .625rem var(--f-mono);color:var(--ultra);background:var(--ultra-soft);border-radius:999px;padding:1px 8px}
    ul{list-style:none;margin:0;padding:0;color:var(--ink-soft);font-size:.8125rem;display:grid;gap:2px}
    ul b{color:var(--ink);font-weight:600}
    .fit{display:grid;gap:4px;font-size:.75rem;color:var(--ink-soft)}
    .fit b{color:var(--ink);font-variant-numeric:tabular-nums}
    meter{width:100%;height:8px}
    .why{margin:0;font-size:.75rem;color:var(--spec)}
    .why li::before{content:"· "}
    .why.ok{color:var(--ok)}
    .done{font-weight:600;color:var(--ok);font-size:.8125rem}
    button{justify-self:start}
  `,
})
export class OpcionCardComponent {
  private static seq = 0;
  readonly hueco = input.required<Hueco>();
  readonly rank = input.required<number>();
  readonly recomendada = input(false);
  readonly elegida = input(false);
  readonly bloqueada = input(false);
  readonly etiqueta = input('Reservar');
  readonly reservar = output<Hueco>();
  readonly tid = `opt-${++OpcionCardComponent.seq}`;
  readonly fmtFecha = fmtFecha; readonly fmtHora = fmtHora;
}
