import { Injectable, signal, computed } from '@angular/core';

type Theme = 'light' | 'dark';
const KEY = 'cmf-theme';

/** Tema claro/oscuro: respeta el sistema y recuerda la elección del usuario. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly media = window.matchMedia('(prefers-color-scheme: dark)');
  private readonly systemDark = signal(this.media.matches);
  private readonly choice = signal<Theme | null>(this.read());

  readonly isDark = computed(() => (this.choice() ?? (this.systemDark() ? 'dark' : 'light')) === 'dark');

  constructor() {
    this.media.addEventListener('change', (e) => this.systemDark.set(e.matches));
    this.apply();
  }

  toggle(): void {
    this.choice.set(this.isDark() ? 'light' : 'dark');
    this.apply();
    try { localStorage.setItem(KEY, this.choice()!); } catch { /* almacenamiento no disponible */ }
  }

  private apply(): void {
    const c = this.choice();
    if (c) document.documentElement.dataset['theme'] = c;
  }

  private read(): Theme | null {
    try {
      const v = localStorage.getItem(KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch { return null; }
  }
}
