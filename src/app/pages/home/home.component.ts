import { AfterViewInit, Component, ElementRef, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ThemeService } from '../../core/theme.service';
import { TabsDirective } from '../../shared/tabs.directive';
import { contrastRatio, formatRatio, wcagLevel } from '../../core/contrast';
import { CODE } from './code-snippets';

interface ContrastRow { name: string; fg: string; bg: string; value: number; ratio: string; level: string; }

const PAIRS: [string, string, string][] = [
  ['Texto sobre fondo', '--ink', '--paper'],
  ['Texto secundario', '--ink-soft', '--paper'],
  ['Acción primaria', '--on-ultra', '--ultra'],
  ['Enlace sobre lámina', '--ultra', '--sheet'],
  ['Anotación', '--spec', '--sheet'],
  ['Estado correcto', '--ok', '--sheet'],
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TabsDirective],
  templateUrl: './home.component.html',
})
export class HomeComponent implements AfterViewInit {
  readonly theme = inject(ThemeService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly sanitizer = inject(DomSanitizer);

  /** Fragmentos de código estáticos y escritos por mí: se marcan como seguros. */
  readonly code: Record<string, SafeHtml> = Object.fromEntries(
    Object.entries(CODE).map(([k, v]) => [k, this.sanitizer.bypassSecurityTrustHtml(v)]),
  );

  readonly contrast = signal<ContrastRow[]>([]);
  readonly tokenCount = signal(0);
  readonly weight = signal('');
  readonly copyLabel = signal('copiar');
  readonly copyStatus = signal('');

  constructor() {
    // Recalcula el contraste cada vez que cambia el tema
    effect(() => {
      this.theme.isDark();
      queueMicrotask(() => this.measure());
    });
  }

  ngAfterViewInit(): void {
    this.measure();
    this.tokenCount.set(this.countTokens());
    const kb = performance.getEntriesByType('resource')
      .filter((r) => /\.(js|css)$/.test(r.name))
      .reduce((sum, r) => sum + ((r as PerformanceResourceTiming).transferSize || 0), 0) / 1024;
    this.weight.set(kb > 0 ? `${kb.toFixed(0)} KB de JS y CSS` : 'carga diferida por rutas');
  }

  copyMail(el: HTMLElement): void {
    const text = el.textContent?.trim() ?? '';
    const select = () => {
      const r = document.createRange();
      r.selectNodeContents(el);
      const s = getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
      this.copyLabel.set('seleccionado');
    };
    navigator.clipboard?.writeText(text).then(() => {
      this.copyLabel.set('copiado');
      this.copyStatus.set('Email copiado');
      setTimeout(() => this.copyLabel.set('copiar'), 1800);
    }, select) ?? select();
  }

  private token(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim().toUpperCase();
  }

  private measure(): void {
    this.contrast.set(PAIRS.map(([name, fg, bg]) => {
      const value = contrastRatio(this.token(fg), this.token(bg));
      return { name, fg, bg, value, ratio: formatRatio(value), level: wcagLevel(value) };
    }));
    const root = this.host.nativeElement;
    root.querySelectorAll<HTMLElement>('[data-ratio]').forEach((el) => {
      const [f, b] = (el.dataset['ratio'] ?? '').split('|');
      el.textContent = formatRatio(contrastRatio(this.token(f), this.token(b)));
    });
    root.querySelectorAll<HTMLElement>('[data-hex]').forEach((el) => (el.textContent = this.token(el.dataset['hex'] ?? '')));
  }

  private countTokens(): number {
    const tokens = new Set<string>();
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) {
          if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
            for (const p of Array.from(rule.style)) if (p.startsWith('--')) tokens.add(p);
          }
        }
      } catch { /* hojas de otros orígenes */ }
    }
    return tokens.size;
  }
}
