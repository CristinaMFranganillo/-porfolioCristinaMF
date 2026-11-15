import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, signal,
} from '@angular/core';

/** Sprite de 11 fotogramas: 0 = gira a la izquierda, 5 = de frente, 10 = a la derecha. */
const FRAMES = 11;
const CENTER = (FRAMES - 1) / 2;
/** Distancia (px) a partir de la cual el retrato deja de reaccionar al cursor. */
const RADIO = 520;

/**
 * Foto de perfil ilustrada. Con ratón gira la cabeza hacia el cursor cuando está cerca
 * y vuelve suavemente al frente al alejarse. En táctil saluda con una mirada a cada lado
 * al aparecer en pantalla, repite al tocarla y sigue el dedo mientras se arrastra cerca.
 * Sin movimiento con prefers-reduced-motion.
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
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const el = this.host.nativeElement;
      let target = CENTER, current = CENTER, raf = 0;
      const timers: number[] = [];

      const loop = () => {
        current += (target - current) * 0.1;
        const f = Math.round(current);
        if (f !== this.frame()) this.frame.set(f);
        raf = Math.abs(target - current) > 0.02 ? requestAnimationFrame(loop) : 0;
      };
      const aim = (t: number) => { target = t; if (!raf) raf = requestAnimationFrame(loop); };

      /** Gira hacia un punto de la pantalla según lo cerca que esté del retrato. */
      const lookAt = (x: number, y: number) => {
        const r = el.getBoundingClientRect();
        const dx = x - (r.left + r.width / 2);
        const dy = y - (r.top + r.height / 2);
        const cerca = Math.max(0, 1 - Math.hypot(dx, dy) / RADIO);     // 1 encima, 0 lejos
        const lado = Math.max(-1, Math.min(1, dx / 220));
        aim(CENTER + lado * CENTER * cerca);
      };

      if (!matchMedia('(hover: none)').matches) {
        const move = (e: PointerEvent) => lookAt(e.clientX, e.clientY);
        window.addEventListener('pointermove', move, { passive: true });
        destroyRef.onDestroy(() => { window.removeEventListener('pointermove', move); cancelAnimationFrame(raf); });
        return;
      }

      // Táctil: una mirada a cada lado y vuelta al frente
      const glance = () => {
        timers.splice(0).forEach(clearTimeout);
        aim(0);
        timers.push(window.setTimeout(() => aim(FRAMES - 1), 650), window.setTimeout(() => aim(CENTER), 1300));
      };
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) glance(); }, { threshold: 0.6 });
      io.observe(el);
      const touch = (e: TouchEvent) => { const t = e.touches[0]; if (t) lookAt(t.clientX, t.clientY); };
      const release = () => aim(CENTER);
      el.addEventListener('click', glance);
      window.addEventListener('touchmove', touch, { passive: true });
      window.addEventListener('touchend', release, { passive: true });
      destroyRef.onDestroy(() => {
        io.disconnect();
        timers.forEach(clearTimeout);
        el.removeEventListener('click', glance);
        window.removeEventListener('touchmove', touch);
        window.removeEventListener('touchend', release);
        cancelAnimationFrame(raf);
      });
    });
  }
}
