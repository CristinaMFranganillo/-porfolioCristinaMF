import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';

/** Sprite de 25 fotogramas: 0 = gira a la izquierda, 12 = de frente, 24 = a la derecha. */
const FRAMES = 25;
const CENTER = (FRAMES - 1) / 2;
/** Distancia (px) a partir de la cual el retrato deja de reaccionar al cursor. */
const RADIO = 900;
/** Hasta esta distancia (px) el giro es completo; a partir de ahí se atenúa hasta RADIO. */
const PLENO = 380;

/**
 * Foto de perfil ilustrada que gira la cabeza hacia el cursor cuando está cerca.
 * - Mezcla dos fotogramas contiguos según la posición decimal, así el giro es continuo y no a saltos.
 * - Muelle amortiguado para que arranque y frene con naturalidad.
 * - Ligera inclinación y desplazamiento que acompañan al giro.
 * Sin movimiento en pantallas táctiles ni con prefers-reduced-motion.
 */
@Component({
  selector: 'app-retrato-perfil',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="retrato" #rig role="img" aria-label="Retrato ilustrado de Cristina Martínez Franganillo">
      <span class="f a"></span><span class="f b"></span>
    </span>`,
  styles: [`
    :host{display:inline-block;width:var(--perfil-size,88px);aspect-ratio:1;flex:none;border-radius:50%;
      background:var(--ultra-soft);border:1px solid var(--rule);overflow:hidden;
      box-shadow:0 0 0 4px var(--sheet),0 12px 24px -16px color-mix(in srgb,var(--ultra) 60%,transparent)}
    .retrato{position:relative;display:block;width:100%;height:100%;transform-origin:50% 85%;
      --fa:${CENTER};--fb:${CENTER};--mix:0;--tilt:0;
      transform:translateX(calc(var(--tilt) * 3%)) rotate(calc(var(--tilt) * 2.5deg))}
    .f{position:absolute;inset:0;background:url('/retrato-perfil.webp') 0 0 / ${FRAMES * 100}% 100% no-repeat}
    .a{background-position-x:calc(var(--fa) / ${FRAMES - 1} * 100%)}
    .b{background-position-x:calc(var(--fb) / ${FRAMES - 1} * 100%);opacity:var(--mix)}
  `],
})
export class RetratoPerfilComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly rig = viewChild.required<ElementRef<HTMLElement>>('rig');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches) return;
      const el = this.rig().nativeElement;
      let target = CENTER, pos = CENTER, vel = 0, last = 0, raf = 0;

      const pintar = () => {
        const fa = Math.floor(pos);
        let mix = pos - fa;
        // El fotograma central es otro dibujo: ahí se corta sin mezclar para evitar el efecto «doble».
        // En el resto se mezcla solo en la franja central, así nunca se ven dos caras a la vez mucho rato.
        if (fa === CENTER - 1 || fa === CENTER) mix = mix < 0.5 ? 0 : 1;
        else { const m = Math.min(1, Math.max(0, (mix - 0.3) / 0.4)); mix = m * m * (3 - 2 * m); }
        el.style.setProperty('--fa', String(fa));
        el.style.setProperty('--fb', String(Math.min(FRAMES - 1, fa + 1)));
        el.style.setProperty('--mix', mix.toFixed(3));
        el.style.setProperty('--tilt', ((pos - CENTER) / CENTER).toFixed(3));
      };
      // Muelle crítico: rigidez k, amortiguación 2·√k → sin rebote, frenada suave
      const loop = (t: number) => {
        const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
        const k = 60, c = 2 * Math.sqrt(k);
        vel += (k * (target - pos) - c * vel) * dt;
        pos = Math.max(0, Math.min(FRAMES - 1, pos + vel * dt));
        pintar();
        if (Math.abs(target - pos) > 0.005 || Math.abs(vel) > 0.01) raf = requestAnimationFrame(loop);
        else { raf = 0; last = 0; }
      };
      const move = (e: PointerEvent) => {
        const r = this.host.nativeElement.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.min(1, Math.max(0, (Math.hypot(dx, dy) - PLENO) / (RADIO - PLENO)));
        const cerca = 1 - d * d * (3 - 2 * d);                          // pleno cerca, se apaga suave lejos
        const lado = Math.tanh(dx / 260);                               // gira deprisa al principio y satura con calma
        target = CENTER + lado * CENTER * cerca;
        if (!raf) raf = requestAnimationFrame(loop);
      };
      const salir = () => { target = CENTER; if (!raf) raf = requestAnimationFrame(loop); };
      window.addEventListener('pointermove', move, { passive: true });
      document.documentElement.addEventListener('pointerleave', salir);
      destroyRef.onDestroy(() => {
        window.removeEventListener('pointermove', move);
        document.documentElement.removeEventListener('pointerleave', salir);
        cancelAnimationFrame(raf);
      });
    });
  }
}
