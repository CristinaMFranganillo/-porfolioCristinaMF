import { Component, computed, signal } from '@angular/core';
import { DemoBarComponent } from '../../shared/ui/demo-bar.component';
import { contrastRatio, formatRatio } from '../../core/contrast';
import { Densidad, MARCAS, Marca, MarcaId, PARES, Tema, dimensiones, semanticos } from './ds.data';

interface Par { desc: string; a: string; b: string; ratio: number; min: number; ok: boolean; texto: string; }

/**
 * Demo del design system multiempresa: los mismos componentes con tres marcas, dos temas y dos densidades.
 * Los componentes de la vista previa solo leen tokens semánticos (var(--color-…)); al cambiar de marca
 * cambian los valores, nunca los componentes. El inspector muestra a qué primitivo apunta cada token
 * y comprueba en vivo el contraste WCAG de los pares críticos.
 */
@Component({
  selector: 'app-design-system',
  standalone: true,
  imports: [DemoBarComponent],
  templateUrl: './design-system.component.html',
  styleUrl: './design-system.component.scss',
})
export class DesignSystemComponent {
  readonly marcas = MARCAS;
  readonly marcaId = signal<MarcaId>('atalaya');
  readonly tema = signal<Tema>('claro');
  readonly densidad = signal<Densidad>('comoda');
  readonly vistaTokens = signal<'color' | 'dimension'>('color');
  readonly filtro = signal<'todos' | 'pendientes' | 'cerrados'>('todos');
  readonly copiado = signal('');

  readonly marca = computed<Marca>(() => MARCAS.find((m) => m.id === this.marcaId())!);
  readonly color = computed(() => semanticos(this.marca(), this.tema()));
  readonly dims = computed(() => dimensiones(this.marca(), this.densidad()));

  /** Variables CSS que recibe la vista previa: es lo único que cambia entre combinaciones. */
  readonly vars = computed<Record<string, string>>(() =>
    Object.fromEntries([...this.color(), ...this.dims()].map((t) => [`--${t.token}`, t.valor])),
  );

  readonly pares = computed<Par[]>(() => {
    const v = Object.fromEntries(this.color().map((t) => [t.token, t.valor]));
    return PARES.map(([a, b, min, desc]) => {
      const ratio = contrastRatio(v[a], v[b]);
      return { desc, a, b, ratio, min, ok: ratio >= min, texto: formatRatio(ratio) };
    });
  });
  readonly cumplen = computed(() => this.pares().filter((p) => p.ok).length);

  readonly resumen = computed(
    () => `${this.marca().nombre}, tema ${this.tema()}, densidad ${this.densidad() === 'comoda' ? 'cómoda' : 'compacta'}. ` +
      `${this.cumplen()} de ${this.pares().length} pares de contraste cumplen WCAG AA.`,
  );

  /** CSS que generaría el sistema para la combinación actual (lo que consume Angular). */
  readonly css = computed(() => {
    const sel = `[data-brand="${this.marcaId()}"][data-theme="${this.tema() === 'claro' ? 'light' : 'dark'}"]`;
    const col = this.color().map((t) => `  --${t.token}: var(--${t.ref});`).join('\n');
    const dim = this.dims().map((t) => `  --${t.token}: ${t.valor};`).join('\n');
    return `/* tokens/_semantic.scss · generado desde Figma Variables */\n${sel} {\n${col}\n}\n\n[data-density="${this.densidad()}"] {\n${dim}\n}`;
  });

  readonly filas = [
    { exp: '184520', cliente: 'Talleres Ribera S.L.', estado: 'Pendiente', importe: '1.200,00 €' },
    { exp: '184557', cliente: 'Construcciones Alcántara', estado: 'Cerrado', importe: '2.073,45 €' },
    { exp: '184561', cliente: 'Frutas Vegas Altas', estado: 'Pendiente', importe: '845,10 €' },
  ];
  readonly visibles = computed(() => {
    const f = this.filtro();
    return f === 'todos' ? this.filas : this.filas.filter((r) => (f === 'pendientes') === (r.estado === 'Pendiente'));
  });

  copiar(): void {
    navigator.clipboard?.writeText(this.css()).then(
      () => { this.copiado.set('CSS copiado'); setTimeout(() => this.copiado.set(''), 1800); },
      () => this.copiado.set('No se ha podido copiar'),
    );
  }
}
