import { Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {
  // Se instancia al arrancar para aplicar el tema guardado antes del primer pintado.
  private readonly theme = inject(ThemeService);

  constructor() {
    // Dentro de la vista responsive (iframe) se ocultan las barras de scroll del sistema.
    // En el prerender (servidor) no hay window: solo se comprueba en el navegador.
    if (isPlatformBrowser(inject(PLATFORM_ID)) && window.self !== window.top) {
      document.documentElement.classList.add('embed');
    }
  }
}
