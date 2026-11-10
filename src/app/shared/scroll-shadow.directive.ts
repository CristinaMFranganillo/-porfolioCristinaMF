import { AfterViewInit, Directive, ElementRef, HostListener, inject } from '@angular/core';

/**
 * Para tablas anchas con columnas y cabecera fijas (position: sticky).
 * Añade clases al contenedor según la posición del scroll para pintar sombras solo cuando
 * hay contenido oculto: `is-scrolled-x` (hay columnas debajo de las fijas), `has-more-x`
 * (queda contenido a la derecha) e `is-scrolled-y` (filas debajo de la cabecera).
 * También lo hace enfocable con teclado (WCAG 2.1.1) si no tiene tabindex.
 */
@Directive({ selector: '[appScrollShadow]', standalone: true })
export class ScrollShadowDirective implements AfterViewInit {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private ro?: ResizeObserver;

  ngAfterViewInit(): void {
    if (!this.el.hasAttribute('tabindex')) this.el.tabIndex = 0;
    this.update();
    this.ro = new ResizeObserver(() => this.update());
    this.ro.observe(this.el);
  }

  @HostListener('scroll')
  update(): void {
    const e = this.el;
    e.classList.toggle('is-scrolled-x', e.scrollLeft > 0);
    e.classList.toggle('has-more-x', Math.ceil(e.scrollLeft + e.clientWidth) < e.scrollWidth);
    e.classList.toggle('is-scrolled-y', e.scrollTop > 0);
  }
}
