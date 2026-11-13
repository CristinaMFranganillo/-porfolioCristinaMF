import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, ElementRef, inject, signal } from '@angular/core';

/** Fotogramas del sprite (mismo dibujo, solo cambia la mirada). */
const FRAMES = ['c', 'l', 'r', 'u', 'ul', 'ur', 'dl', 'dr', 'blink'] as const;
type Frame = (typeof FRAMES)[number];

/**
 * Foto de perfil ilustrada: el dibujo no se mueve, solo los ojos siguen al cursor
 * y parpadea de vez en cuando. Cada cambio de mirada es un fundido corto.
 * Con prefers-reduced-motion se queda mirando de frente.
 */
@Component({
  selector: 'app-retrato-perfil',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="retrato" role="img" aria-label="Retrato ilustrado de Cristina Martínez Franganillo">
      @for (f of frames; track f; let i = $index) {
        <span class="f" [class.on]="f === visible()" [style.background-position-x.%]="i / (frames.length - 1) * 100"></span>
      }
    </span>`,
  styles: [`
    :host{display:inline-block;width:var(--perfil-size,88px);aspect-ratio:1;flex:none;border-radius:50%;
      background:var(--ultra-soft);border:1px solid var(--rule);overflow:hidden;
      box-shadow:0 0 0 4px var(--sheet),0 12px 24px -16px color-mix(in srgb,var(--ultra) 60%,transparent)}
    .retrato{position:relative;display:block;width:100%;height:100%}
    .f{position:absolute;inset:0;opacity:0;transition:opacity .14s ease-out;
      background:url('/retrato-ojos.webp') 0 0 / ${FRAMES.length * 100}% 100% no-repeat}
    .f.on{opacity:1}
  `],
})
export class RetratoPerfilComponent {
  readonly frames = FRAMES;
  private readonly mirada = signal<Frame>('c');
  private readonly parpadeo = signal(false);
  readonly visible = () => (this.parpadeo() ? 'blink' : this.mirada());
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let raf = 0, x = 0, y = 0, timer = 0;

      const mirar = () => {
        raf = 0;
        const r = this.host.nativeElement.getBoundingClientRect();
        const dx = x - (r.left + r.width / 2);
        const dy = y - (r.top + r.height * 0.42);              // altura de los ojos
        if (Math.hypot(dx, dy) < r.width * 0.6) { this.mirada.set('c'); return; }
        const a = Math.atan2(dy, dx) * 180 / Math.PI;          // 0 derecha · 90 abajo
        const f: Frame =
          a > -30 && a <= 30 ? 'r' : a > 30 && a <= 90 ? 'dr' : a > 90 && a <= 150 ? 'dl' :
          a > 150 || a <= -150 ? 'l' : a > -150 && a <= -110 ? 'ul' : a > -110 && a <= -70 ? 'u' : 'ur';
        this.mirada.set(f);
      };
      const move = (e: PointerEvent) => {
        if (e.pointerType === 'touch') return;
        x = e.clientX; y = e.clientY;
        if (!raf) raf = requestAnimationFrame(mirar);
      };
      const salir = () => this.mirada.set('c');
      const parpadear = () => {
        this.parpadeo.set(true);
        setTimeout(() => this.parpadeo.set(false), 140);
        timer = window.setTimeout(parpadear, 3000 + Math.random() * 4000);
      };
      timer = window.setTimeout(parpadear, 2500);
      window.addEventListener('pointermove', move, { passive: true });
      document.documentElement.addEventListener('pointerleave', salir);
      destroyRef.onDestroy(() => {
        window.removeEventListener('pointermove', move);
        document.documentElement.removeEventListener('pointerleave', salir);
        cancelAnimationFrame(raf); clearTimeout(timer);
      });
    });
  }
}
