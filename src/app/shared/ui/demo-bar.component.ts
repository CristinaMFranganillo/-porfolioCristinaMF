import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/theme.service';

/** Barra común a todas las demos: volver al portfolio, aviso de datos ficticios y tema. */
@Component({
  selector: 'app-demo-bar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="demo-bar">
      <a routerLink="/" fragment="trabajo" class="back">← Portfolio</a>
      <span class="title">{{ title() }}</span>
      <span class="note">Demo interactiva · datos ficticios</span>
      <button type="button" class="theme" (click)="theme.toggle()" aria-label="Cambiar entre tema claro y oscuro">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>
      </button>
    </div>
  `,
  styles: `
    .demo-bar{display:flex;align-items:center;gap:16px;padding:8px max(16px,env(safe-area-inset-left,0px));background:var(--ink);color:var(--paper);font-size:.8125rem;flex-wrap:wrap}
    .back{color:var(--paper);text-decoration:none;font-weight:600}
    .back:hover{text-decoration:underline}
    .title{font-family:var(--f-mono);opacity:.8}
    .note{margin-left:auto;font-family:var(--f-mono);font-size:.6875rem;opacity:.7}
    .theme{background:transparent;border:1px solid color-mix(in srgb,var(--paper) 30%,transparent);color:var(--paper);border-radius:6px;width:30px;height:30px;display:grid;place-items:center;cursor:pointer}
    @media (max-width:560px){.note{display:none}.theme{margin-left:auto}}
  `,
})
export class DemoBarComponent {
  readonly title = input.required<string>();
  readonly theme = inject(ThemeService);
}
