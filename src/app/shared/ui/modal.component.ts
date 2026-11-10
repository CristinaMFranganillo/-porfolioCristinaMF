import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

/**
 * Modal accesible sobre <dialog> nativo: bloquea el fondo, atrapa el foco,
 * se cierra con Escape y devuelve el foco al elemento que lo abrió.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <dialog #dlg [attr.aria-labelledby]="titleId" (close)="closed.emit()" (click)="onBackdrop($event)">
      <header>
        <h2 [id]="titleId">{{ heading() }}</h2>
        <button type="button" class="x" (click)="dlg.close()" aria-label="Cerrar">✕</button>
      </header>
      <div class="body"><ng-content /></div>
      <footer><ng-content select="[actions]" /></footer>
    </dialog>
  `,
  styles: `
    dialog{border:1px solid var(--rule);border-radius:10px;padding:0;width:min(520px,calc(100vw - 32px));background:var(--sheet);color:var(--ink);box-shadow:0 24px 64px -24px rgb(0 0 0 / .45)}
    dialog::backdrop{background:rgb(14 15 30 / .45)}
    header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid var(--rule)}
    h2{font-size:1rem;font-weight:600;letter-spacing:-.01em;margin:0}
    .x{border:0;background:transparent;color:var(--ink-soft);font-size:1rem;cursor:pointer;width:32px;height:32px;border-radius:6px}
    .x:hover{background:var(--paper)}
    .body{padding:20px;display:grid;gap:14px;font-size:.875rem}
    footer{display:flex;justify-content:flex-end;gap:8px;padding:12px 20px;border-top:1px solid var(--rule)}
  `,
})
export class ModalComponent {
  private static seq = 0;
  readonly heading = input.required<string>();
  readonly open = input(false);
  readonly closed = output<void>();
  readonly titleId = `modal-title-${++ModalComponent.seq}`;
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');
  private opener: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const d = this.dlg().nativeElement;
      if (this.open() && !d.open) {
        this.opener = document.activeElement as HTMLElement;
        d.showModal();
        queueMicrotask(() => d.querySelector<HTMLElement>('input,select,textarea,[autofocus]')?.focus());
      } else if (!this.open() && d.open) {
        d.close();
        this.opener?.focus();
      }
    });
  }

  onBackdrop(e: MouseEvent): void {
    if (e.target === this.dlg().nativeElement) this.dlg().nativeElement.close();
  }
}
