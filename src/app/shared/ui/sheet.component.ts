import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

/**
 * Hoja inferior (móvil) / panel lateral (tablet y escritorio) sobre <dialog> nativo.
 * Patrón de app comercial: cabecera fija con título y cierre, cuerpo con scroll y pie fijo con acciones.
 */
@Component({
  selector: 'app-sheet',
  standalone: true,
  template: `
    <dialog #dlg [attr.aria-labelledby]="tid" (close)="closed.emit()" (click)="fondo($event)" [class.side]="side()">
      <div class="grab" aria-hidden="true"></div>
      <header><h2 [id]="tid">{{ heading() }}</h2><button type="button" class="x" (click)="dlg.close()" aria-label="Cerrar">✕</button></header>
      <div class="body"><ng-content /></div>
      <footer><ng-content select="[actions]" /></footer>
    </dialog>
  `,
  styles: `
    dialog{margin:auto auto 0;width:100%;max-width:100%;max-height:88dvh;border:0;padding:0;border-radius:18px 18px 0 0;background:var(--sheet);color:var(--ink);display:none;flex-direction:column;box-shadow:0 -20px 50px -20px rgb(0 0 0 / .4)}
    dialog[open]{display:flex;animation:up .22s ease-out}
    dialog::backdrop{background:rgb(14 15 30 / .5)}
    @keyframes up{from{transform:translateY(40px);opacity:0}}
    @media (min-width:641px){
      dialog.side{margin:0 0 0 auto;height:100dvh;max-height:100dvh;width:min(420px,92vw);border-radius:0;box-shadow:-20px 0 50px -20px rgb(0 0 0 / .4)}
      dialog.side[open]{animation:side .22s ease-out}
      dialog.side .grab{display:none}
    }
    @keyframes side{from{transform:translateX(40px);opacity:0}}
    .grab{width:40px;height:4px;border-radius:2px;background:var(--rule);margin:8px auto 0;flex:none}
    header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--rule);flex:none}
    h2{margin:0;font-size:1.0625rem;letter-spacing:-.02em}
    .x{border:0;background:var(--paper);color:var(--ink);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:.9rem}
    .body{overflow:auto;padding:16px 20px;flex:1;min-height:0}
    footer{flex:none;display:flex;gap:8px;padding:12px 20px calc(12px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--rule);background:var(--sheet)}
    footer:empty{display:none}
    @media (prefers-reduced-motion:reduce){dialog[open]{animation:none}}
  `,
})
export class SheetComponent {
  private static seq = 0;
  readonly heading = input.required<string>();
  readonly open = input(false);
  /** En pantallas medianas y grandes se abre como panel lateral. */
  readonly side = input(true);
  readonly closed = output<void>();
  readonly tid = `sheet-${++SheetComponent.seq}`;
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');
  private opener: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const d = this.dlg().nativeElement;
      if (this.open() && !d.open) { this.opener = document.activeElement as HTMLElement; d.showModal(); }
      else if (!this.open() && d.open) { d.close(); this.opener?.focus(); }
    });
  }
  fondo(e: MouseEvent): void { if (e.target === this.dlg().nativeElement) this.dlg().nativeElement.close(); }
}
