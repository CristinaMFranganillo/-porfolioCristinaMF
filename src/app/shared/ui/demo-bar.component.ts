import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/theme.service';

/** Barra común a todas las demos: volver al portfolio, aviso de datos ficticios y tema. */
@Component({
  selector: 'app-demo-bar',
  host: { '[class.embebida]': 'embebida' },
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="demo-bar" aria-label="Demo del portfolio">
      <a routerLink="/" fragment="trabajo" class="back">← Portfolio</a>
      <span class="title">{{ title() }}</span>
      <span class="note">Demo interactiva · datos ficticios</span>
      @if (responsive()) { <a class="resp" [routerLink]="['/responsive', responsive()]">Ver en móvil y tablet</a> }
      <button type="button" class="theme" (click)="theme.toggle()" aria-label="Cambiar entre tema claro y oscuro">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>
      </button>
    </nav>
  `,
  styles: `
    .demo-bar{display:flex;align-items:center;gap:16px;padding:8px max(16px,env(safe-area-inset-left,0px));background:var(--ink);color:var(--paper);font-size:.8125rem;flex-wrap:wrap}
    .back{color:var(--paper);text-decoration:none;font-weight:600}
    .back:hover{text-decoration:underline}
    .title{font-family:var(--f-mono);opacity:.8}
    .resp{color:var(--paper);font-size:.75rem;text-decoration:none;border:1px solid color-mix(in srgb,var(--paper) 30%,transparent);border-radius:6px;padding:4px 10px}
    .resp:hover{background:color-mix(in srgb,var(--paper) 12%,transparent)}
    :host(.embebida){display:none}
    .note{margin-left:auto;font-family:var(--f-mono);font-size:.6875rem;opacity:.7}
    .theme{background:transparent;border:1px solid color-mix(in srgb,var(--paper) 30%,transparent);color:var(--paper);border-radius:6px;width:30px;height:30px;display:grid;place-items:center;cursor:pointer}
    @media (max-width:560px){.note,.resp,.title{display:none}.theme{margin-left:auto}.demo-bar{padding-block:6px}}
  `,
})
export class DemoBarComponent {
  readonly title = input.required<string>();
  /** slug de la demo para el enlace a la vista responsive */
  readonly responsive = input<string | null>(null);
  readonly theme = inject(ThemeService);
  /** Dentro de la vista responsive (iframe) la barra se oculta para mostrar solo la app. */
  readonly embebida = window.self !== window.top;
}
