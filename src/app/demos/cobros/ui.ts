import { Component, computed, input, model } from '@angular/core';

/* Iconos de línea (estilo similar a los de la aplicación original, dibujados de cero). */
const ICONOS: Record<string, string> = {
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  plus: 'M12 5v14M5 12h14',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
  phone: 'M5 4h4l2 5-3 2a11 11 0 005 5l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  swap: 'M7 7h13l-3-3M17 17H4l3 3',
  folder: 'M3 6h6l2 2h10v11H3z',
  close: 'M6 6l12 12M18 6L6 18',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 018 0v4',
  card: 'M3 6h18v12H3zM3 10h18',
  chart: 'M5 20V10M12 20V4M19 20v-7',
  refresh: 'M20 12a8 8 0 11-2.3-5.6M20 4v5h-5',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  check: 'M5 12l5 5L20 7',
  warn: 'M12 3l10 18H2zM12 10v5M12 18h.01',
  info: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 11v6M12 7h.01',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4',
  link: 'M10 14a4 4 0 006 0l3-3a4 4 0 00-6-6l-1 1M14 10a4 4 0 00-6 0l-3 3a4 4 0 006 6l1-1',
  play: 'M8 5l11 7-11 7z',
  filter: 'M4 5h16l-6 8v6l-4-2v-4z',
  'user-plus': 'M10 12a4 4 0 100-8 4 4 0 000 8zM3 21a7 7 0 0114 0M19 8v6M16 11h6',
  arrow: 'M19 12H5M11 6l-6 6 6 6',
  star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
};

@Component({
  selector: 'app-ico',
  standalone: true,
  template: `<svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="d()" [attr.fill]="fill() ? 'currentColor' : 'none'"/></svg>`,
  styles: ':host{display:inline-flex;flex:none}',
})
export class IcoComponent {
  readonly name = input.required<string>();
  readonly size = input(16);
  readonly fill = input(false);
  readonly d = computed(() => ICONOS[this.name()] ?? '');
}

/** Paginador compacto: primera, anterior, páginas con elipsis, siguiente y última. */
@Component({
  selector: 'app-paginador',
  standalone: true,
  template: `
    <nav class="pg" aria-label="Paginación">
      <span class="info">Mostrando {{ desde() }} a {{ hasta() }} de {{ total() }} registros</span>
      <div class="btns">
        <button type="button" (click)="page.set(1)" [disabled]="page() <= 1" aria-label="Primera página">«</button>
        <button type="button" (click)="page.set(page() - 1)" [disabled]="page() <= 1" aria-label="Página anterior">‹</button>
        @for (p of paginas(); track $index) {
          @if (p === 0) { <span class="gap" aria-hidden="true">…</span> }
          @else { <button type="button" [class.on]="p === page()" [attr.aria-current]="p === page() ? 'page' : null" (click)="page.set(p)">{{ p }}</button> }
        }
        <button type="button" (click)="page.set(page() + 1)" [disabled]="page() >= paginasTotales()" aria-label="Página siguiente">›</button>
        <button type="button" (click)="page.set(paginasTotales())" [disabled]="page() >= paginasTotales()" aria-label="Última página">»</button>
      </div>
    </nav>
  `,
  styles: `
    .pg{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 0;font-size:.8125rem;color:var(--ink-soft)}
    .btns{display:flex;border:1px solid var(--rule);border-radius:6px;overflow:hidden;background:var(--sheet)}
    button,.gap{min-width:32px;height:30px;border:0;border-left:1px solid var(--rule);background:transparent;color:var(--ink);font:500 .8125rem var(--f-sans);cursor:pointer;display:grid;place-items:center;font-variant-numeric:tabular-nums}
    button:first-child{border-left:0}
    button:hover:not(:disabled){background:var(--paper)}
    button:disabled{color:var(--ink-soft);opacity:.5;cursor:default}
    button.on{background:var(--ultra);color:var(--on-ultra)}
    .gap{cursor:default}
  `,
})
export class PaginadorComponent {
  readonly page = model.required<number>();
  readonly total = input.required<number>();
  readonly size = input.required<number>();
  readonly paginasTotales = computed(() => Math.max(1, Math.ceil(this.total() / this.size())));
  readonly desde = computed(() => (this.total() ? (this.page() - 1) * this.size() + 1 : 0));
  readonly hasta = computed(() => Math.min(this.total(), this.page() * this.size()));
  /** 1 … 4 5 6 … 20 (0 = elipsis) */
  readonly paginas = computed(() => {
    const n = this.paginasTotales(), p = this.page();
    if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1);
    const set = [1, n, p - 1, p, p + 1].filter((x) => x >= 1 && x <= n);
    const ord = [...new Set(set)].sort((a, b) => a - b);
    return ord.flatMap((x, i) => (i && x - ord[i - 1] > 1 ? [0, x] : [x]));
  });
}
