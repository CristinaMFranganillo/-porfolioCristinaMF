import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, signal,
} from '@angular/core';

/** Sprite de 11 fotogramas: 0 = gira a la izquierda, 5 = de frente, 10 = a la derecha. */
const FRAMES = 11;
const CENTER = (FRAMES - 1) / 2;
/** Distancia (px) a partir de la cual el retrato deja de reaccionar al cursor. */
const RADIO = 520;

/**
 * Foto de perfil ilustrada. Gira la cabeza unos grados hacia el cursor solo cuando
 * está cerca; si se aleja, vuelve suavemente al frente. Sin movimiento en táctil
 * ni con prefers-reduced-motion.
 */
@Component({
  selector: 'app-retrato-perfil',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="retrato" role="img" aria-label="Retrato ilustrado de Cristina Martínez Franganillo"
    [style.background-position-x.%]="frame() / (total - 1) * 100"></span>`,
  styles: [`
    :host{display:inline-block;width:var(--perfil-size,88px);aspect-ratio:1;flex:none;border-radius:50%;
      background:var(--ultra-soft);border:1px solid var(--rule);overflow:hidden;
      box-shadow:0 0 0 4px var(--sheet),0 12px 24px -16px color-mix(in srgb,var(--ultra) 60%,transparent)}
    .retrato{display:block;width:100%;height:100%;
      background:url('/retrato-perfil.webp') 0 0 / ${FRAMES * 100}% 100% no-repeat}
  `],
})
export class RetratoPerfilComponent {
  readonly total = FRAMES;
  readonly frame = signal(CENTER);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches) return;
      let target = CENTER, current = CENTER, raf = 0;

      const loop = () => {
        current += (target - current) * 0.1;
        const f = Math.round(current);
        if (f !== this.frame()) this.frame.set(f);
        raf = Math.abs(target - current) > 0.02 ? requestAnimationFrame(loop) : 0;
      };
      const move = (e: PointerEvent) => {
        const r = this.host.nativeElement.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const cerca = Math.max(0, 1 - Math.hypot(dx, dy) / RADIO);     // 1 encima, 0 lejos
        const lado = Math.max(-1, Math.min(1, dx / 220));
        target = CENTER + lado * CENTER * cerca;
        if (!raf) raf = requestAnimationFrame(loop);
      };
      window.addEventListener('pointermove', move, { passive: true });
      destroyRef.onDestroy(() => { window.removeEventListener('pointermove', move); cancelAnimationFrame(raf); });
    });
  }
}
