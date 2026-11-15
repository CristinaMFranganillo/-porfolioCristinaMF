import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

type Theme = 'light' | 'dark';
const KEY = 'cmf-theme';

/**
 * Tema claro/oscuro: respeta el sistema y recuerda la elección del usuario.
 * En el prerender no hay window ni localStorage, así que solo se activa en el navegador;
 * el script en línea de index.html aplica el tema guardado antes del primer pintado.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly media = this.browser ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  private readonly systemDark = signal(this.media?.matches ?? false);
  private readonly choice = signal<Theme | null>(this.read());

  readonly isDark = computed(() => (this.choice() ?? (this.systemDark() ? 'dark' : 'light')) === 'dark');

  constructor() {
    this.media?.addEventListener('change', (e) => this.systemDark.set(e.matches));
    this.apply();
  }

  toggle(): void {
    this.choice.set(this.isDark() ? 'light' : 'dark');
    this.apply();
    try { localStorage.setItem(KEY, this.choice()!); } catch { /* almacenamiento no disponible */ }
  }

  private apply(): void {
    const c = this.choice();
    if (c && this.browser) this.doc.documentElement.dataset['theme'] = c;
  }

  private read(): Theme | null {
    if (!this.browser) return null;
    try {
      const v = localStorage.getItem(KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch { return null; }
  }
}
