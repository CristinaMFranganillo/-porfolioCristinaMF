import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/**
 * Patrón ARIA Tabs sobre marcado estático: role="tablist" > role="tab"[aria-controls].
 * Flechas izquierda/derecha, Inicio y Fin mueven el foco y activan la pestaña.
 */
@Directive({ selector: '[appTabs]', standalone: true })
export class TabsDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private get tabs(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('[role="tab"]'));
  }

  @HostListener('click', ['$event'])
  onClick(e: Event): void {
    const tab = (e.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
    if (tab) this.select(tab);
  }

  @HostListener('keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const tabs = this.tabs;
    const i = tabs.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const next: Record<string, number> = {
      ArrowRight: (i + 1) % tabs.length,
      ArrowLeft: (i - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (e.key in next) {
      e.preventDefault();
      const t = tabs[next[e.key]];
      this.select(t);
      t.focus();
    }
  }

  private select(active: HTMLElement): void {
    for (const t of this.tabs) {
      const on = t === active;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls') ?? '');
      if (panel) panel.hidden = !on;
    }
  }
}
