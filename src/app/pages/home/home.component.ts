import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ThemeService } from '../../core/theme.service';
import { TabsDirective } from '../../shared/tabs.directive';
import { CODE } from './code-snippets';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TabsDirective],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  readonly theme = inject(ThemeService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly doc = inject(DOCUMENT);

  /** Fragmentos de código estáticos y escritos por mí: se marcan como seguros. */
  readonly code: Record<string, SafeHtml> = Object.fromEntries(
    Object.entries(CODE).map(([k, v]) => [k, this.sanitizer.bypassSecurityTrustHtml(v)]),
  );

  readonly copyLabel = signal('copiar');
  readonly copyStatus = signal('');

  constructor() {
    // Estilo «producto limpio» solo mientras se ve la home (las demos mantienen el suyo)
    this.doc.documentElement.classList.add('limpio');
    inject(DestroyRef).onDestroy(() => this.doc.documentElement.classList.remove('limpio'));
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
}
