import { Component, Injectable, inject, signal } from '@angular/core';

export type ToastKind = 'info' | 'ok' | 'warn' | 'error';
interface Toast { id: number; kind: ToastKind; title: string; text: string; }

/** Avisos efímeros anunciados a lectores de pantalla mediante una región aria-live. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  show(kind: ToastKind, title: string, text: string): void {
    const id = ++this.seq;
    this.toasts.update((t) => [...t, { id, kind, title, text }]);
    setTimeout(() => this.dismiss(id), 4200);
  }

  dismiss(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
}

@Component({
  selector: 'app-toasts',
  standalone: true,
  template: `
    <div class="stack" role="status" aria-live="polite">
      @for (t of svc.toasts(); track t.id) {
        <div class="toast" [class]="'toast ' + t.kind">
          <span><b>{{ t.title }}</b> · {{ t.text }}</span>
          <button type="button" (click)="svc.dismiss(t.id)" aria-label="Cerrar aviso">✕</button>
        </div>
      }
    </div>
  `,
  styles: `
    .stack{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));display:grid;gap:8px;z-index:60;width:min(380px,calc(100vw - 32px))}
    .toast{display:flex;justify-content:space-between;gap:12px;align-items:start;padding:10px 12px;border-radius:6px;border-left:3px solid;background:var(--sheet);color:var(--ink);box-shadow:0 12px 32px -16px rgb(0 0 0 / .4);font-size:.8125rem;animation:in .2s ease-out}
    .info{border-color:var(--ultra)} .ok{border-color:var(--ok)} .warn{border-color:#C77700} .error{border-color:var(--spec)}
    button{border:0;background:transparent;color:var(--ink-soft);cursor:pointer}
    @keyframes in{from{transform:translateY(8px);opacity:0}}
  `,
})
export class ToastsComponent {
  readonly svc = inject(ToastService);
}
