import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DemoBarComponent } from '../../shared/ui/demo-bar.component';
import { ToastsComponent } from '../../shared/ui/toast.service';

@Component({
  selector: 'app-cobros-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DemoBarComponent, ToastsComponent],
  template: `
    <app-demo-bar title="Caso 02 · Intranet de gestión de cobros" />
    <div class="app dk">
      <header class="top">
        <span class="logo"><span class="mark" aria-hidden="true">€</span>Gestión de cobros</span>
        <nav aria-label="Aplicación de cobros">
          <a routerLink="/demos/cobros" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: false }">Expedientes</a>
        </nav>
        <span class="user">Usuaria demo</span>
      </header>
      <main class="main"><router-outlet /></main>
      <footer class="foot"><span>Aplicación interna · versión de demostración</span><span>Datos ficticios generados</span></footer>
    </div>
    <app-toasts />
  `,
  styles: `
    :host{display:block;min-height:100vh;background:var(--paper)}
    .top{display:flex;align-items:center;gap:24px;padding:0 max(16px,env(safe-area-inset-left,0px));height:52px;background:var(--ultra);color:var(--on-ultra)}
    .logo{display:flex;align-items:center;gap:8px;font-weight:600;letter-spacing:-.01em}
    .mark{width:26px;height:26px;border-radius:6px;background:var(--on-ultra);color:var(--ultra);display:grid;place-items:center;font-weight:700;font-size:.8rem}
    nav a{color:var(--on-ultra);text-decoration:none;font-size:.8125rem;font-weight:500;padding:6px 10px;border-radius:6px;opacity:.85}
    nav a.on{background:color-mix(in srgb,var(--on-ultra) 18%,transparent);opacity:1}
    .user{margin-left:auto;font-size:.8125rem;opacity:.9}
    .main{padding:24px max(16px,env(safe-area-inset-left,0px)) 40px;max-width:1400px;margin:0 auto}
    .foot{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px max(16px,env(safe-area-inset-left,0px));border-top:1px solid var(--rule);font-size:.75rem;color:var(--ink-soft)}
  `,
})
export class CobrosShellComponent {}
