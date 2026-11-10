import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { inject } from '@angular/core';
import { ThemeService } from '../../core/theme.service';

type Disp = 'movil' | 'tablet' | 'escritorio';
interface Dispositivo { k: Disp; label: string; w: number; h: number; escala: number; }

const DEMOS: Record<string, { titulo: string; ruta: string }> = {
  'asistente': { titulo: 'Asistente IA de planificación', ruta: '/demos/asistente' },
  'cobros': { titulo: 'Intranet de gestión de cobros', ruta: '/demos/cobros' },
  'web-publica': { titulo: 'Web corporativa', ruta: '/demos/web-publica' },
};

/**
 * Muestra la misma demo, en vivo y usable, en móvil (375), tablet (768) y escritorio (1280).
 * Cada marco es un iframe real del ancho del dispositivo, así que se aplican las media queries de verdad.
 */
@Component({
  selector: 'app-responsive',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="bar">
      <a routerLink="/" fragment="detalles" class="back">← Portfolio</a>
      <span class="t">Vista responsive · {{ demo().titulo }}</span>
      <button type="button" class="theme" (click)="theme.toggle()" aria-label="Cambiar entre tema claro y oscuro">◐</button>
    </header>
    <main class="main">
      <div class="head">
        <div>
          <h1>Misma app, tres pantallas</h1>
          <p>Las demos están pensadas para móvil, tablet y escritorio desde el diseño. Cada marco es la aplicación real funcionando: puedes usarla dentro.</p>
        </div>
        <div class="ctrls">
          <div class="seg" role="group" aria-label="Demo">
            @for (d of demos; track d.k) { <a [routerLink]="['/responsive', d.k]" [class.on]="d.k === slug()" [attr.aria-current]="d.k === slug() ? 'page' : null">{{ d.titulo }}</a> }
          </div>
          <div class="seg" role="group" aria-label="Dispositivos">
            <button type="button" [attr.aria-pressed]="vista() === 'todos'" (click)="vista.set('todos')">Los tres</button>
            @for (d of dispositivos; track d.k) { <button type="button" [attr.aria-pressed]="vista() === d.k" (click)="vista.set(d.k)">{{ d.label }}</button> }
          </div>
        </div>
      </div>

      <div class="stage" [class.solo]="vista() !== 'todos'">
        @for (d of visibles(); track d.k) {
          <figure class="dev" [class]="'dev ' + d.k" [style.width.px]="d.w * esc(d)" >
            <div class="frame" [style.width.px]="d.w * esc(d)" [style.height.px]="d.h * esc(d)">
              <iframe [src]="url()" [title]="demo().titulo + ' en ' + d.label" [style.width.px]="d.w" [style.height.px]="d.h" [style.transform]="'scale(' + esc(d) + ')'" loading="lazy"></iframe>
            </div>
            <figcaption><b>{{ d.label }}</b> · {{ d.w }} × {{ d.h }}</figcaption>
          </figure>
        }
      </div>
      <p class="note">¿Prefieres probarlo en tu móvil? Abre el portfolio en él: las demos se adaptan solas.</p>
    </main>
  `,
  styles: `
    :host{display:block;min-height:100vh;background:var(--paper);color:var(--ink);font-family:var(--f-sans)}
    .bar{display:flex;align-items:center;gap:16px;padding:10px max(16px,env(safe-area-inset-left,0px));background:var(--ink);color:var(--paper);font-size:.8125rem}
    .back{color:var(--paper);text-decoration:none;font-weight:600}
    .t{font-family:var(--f-mono);opacity:.8}
    .theme{margin-left:auto;background:transparent;border:1px solid color-mix(in srgb,var(--paper) 30%,transparent);color:var(--paper);border-radius:6px;width:30px;height:30px;cursor:pointer}
    .main{padding:24px max(16px,env(safe-area-inset-left,0px)) 40px;max-width:1440px;margin:0 auto;display:grid;gap:20px}
    .head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap}
    h1{font-size:1.75rem;letter-spacing:-.03em;margin:0}
    .head p{margin:6px 0 0;color:var(--ink-soft);max-width:60ch}
    .ctrls{display:grid;gap:8px;justify-items:end}
    .seg{display:flex;border:1px solid var(--rule);border-radius:8px;overflow:hidden;background:var(--sheet);flex-wrap:wrap}
    .seg a,.seg button{font:500 .8125rem var(--f-sans);border:0;border-left:1px solid var(--rule);background:transparent;color:var(--ink);padding:7px 12px;cursor:pointer;text-decoration:none}
    .seg>*:first-child{border-left:0}
    .seg .on,.seg [aria-pressed="true"]{background:var(--ultra);color:var(--on-ultra)}
    .stage{display:flex;justify-content:center;align-items:flex-end;gap:28px;flex-wrap:wrap}
    .dev{margin:0;display:grid;gap:8px;justify-items:center}
    .frame{position:relative;overflow:hidden;background:var(--sheet);box-shadow:0 30px 60px -30px rgb(14 15 30 / .45),0 0 0 1px var(--rule)}
    .movil .frame{border-radius:28px;outline:10px solid #14162B}
    .tablet .frame{border-radius:18px;outline:12px solid #14162B}
    .escritorio .frame{border-radius:10px;border-top:22px solid #14162B}
    iframe{border:0;transform-origin:0 0;position:absolute;top:0;left:0;background:var(--paper)}
    figcaption{font-size:.75rem;color:var(--ink-soft);margin-top:10px}
    .note{text-align:center;color:var(--ink-soft);font-size:.8125rem;margin:0}
    @media (max-width:900px){.ctrls{justify-items:start}}
  `,
})
export class ResponsiveComponent {
  readonly theme = inject(ThemeService);
  private readonly san = inject(DomSanitizer);
  /** Parámetro de ruta :demo */
  readonly slug = input<string>('web-publica', { alias: 'demo' });
  readonly vista = signal<'todos' | Disp>(innerWidth < 900 ? 'movil' : 'todos');
  readonly demos = Object.entries(DEMOS).map(([k, v]) => ({ k, ...v }));
  readonly dispositivos: Dispositivo[] = [
    { k: 'movil', label: 'Móvil', w: 375, h: 760, escala: 0.72 },
    { k: 'tablet', label: 'Tablet', w: 768, h: 1024, escala: 0.52 },
    { k: 'escritorio', label: 'Escritorio', w: 1280, h: 800, escala: 0.44 },
  ];
  readonly demo = computed(() => DEMOS[this.slug()] ?? DEMOS['web-publica']);
  readonly url = computed<SafeResourceUrl>(() => this.san.bypassSecurityTrustResourceUrl(this.demo().ruta + '?embed=1'));
  readonly visibles = computed(() => (this.vista() === 'todos' ? this.dispositivos : this.dispositivos.filter((d) => d.k === this.vista())));

  /** En vista individual se amplía hasta donde quepa en pantalla. */
  esc(d: Dispositivo): number {
    if (this.vista() === 'todos') return d.escala;
    const maxW = Math.min(innerWidth - 48, 1300), maxH = innerHeight - 220;
    return Math.min(1, maxW / d.w, Math.max(0.4, maxH / d.h));
  }
}
