import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { DemoBarComponent } from '../../shared/ui/demo-bar.component';
import { ToastsComponent } from '../../shared/ui/toast.service';
import { CobrosStore } from './cobros.store';
import { IcoComponent } from './ui';

@Component({
  selector: 'app-cobros-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DemoBarComponent, ToastsComponent, IcoComponent],
  template: `
    <app-demo-bar title="Caso 02 · Intranet de gestión de cobros" responsive="cobros" />
    <div class="erp dk">
      <header class="top" #top>
        <a routerLink="/demos/cobros" class="logo"><span class="mark" aria-hidden="true">€</span>Cobros</a>
        <nav class="nav-d" aria-label="Aplicación de cobros">
          @for (l of enlaces; track l.ruta) {
            <a [routerLink]="l.ruta" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: l.exacto }">{{ l.label }} @if (contador(l.k)) { <span class="n">{{ contador(l.k) }}</span> }</a>
          }
        </nav>
        <span class="user"><span class="av" aria-hidden="true">UD</span>Usuario demo</span>
        <button type="button" class="burger" (click)="abrirMenu(top)" [attr.aria-expanded]="menu()" aria-controls="menu-cobros" [attr.aria-label]="menu() ? 'Cerrar menú' : 'Abrir menú'">
          <span aria-hidden="true" [class.x]="menu()"><i></i><i></i><i></i></span>
        </button>
      </header>
      @if (menu()) {
        <div class="menu" id="menu-cobros" [style.top.px]="menuTop()" (keydown.escape)="menu.set(false)">
          <nav aria-label="Aplicación de cobros (menú)">
            <ul class="row-list">
              @for (l of enlaces; track l.ruta) {
                <li><a [routerLink]="l.ruta" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: l.exacto }" (click)="menu.set(false)">
                  <app-ico [name]="l.ico" [size]="20" /><span>{{ l.label }}</span>
                  <span class="end">@if (contador(l.k)) { <span class="n">{{ contador(l.k) }}</span> }<span class="chev" aria-hidden="true">›</span></span></a></li>
              }
            </ul>
          </nav>
          <div class="menu-foot"><span class="av lg" aria-hidden="true">UD</span><div><b>Usuario demo</b><small>Gestora de cobros · datos ficticios</small></div></div>
        </div>
      }
      <main class="main"><router-outlet /></main>
      <footer class="foot"><span>© 2026 Organización ficticia · Aplicación interna de demostración</span><span>Usuario: DEMO · Inicio de sesión: {{ inicio }}</span></footer>
    </div>
    <app-toasts />
  `,
  styles: `
    :host{display:block;min-height:100vh;background:var(--paper)}
    .erp{font-size:.8125rem}
    .top{display:flex;align-items:center;gap:20px;padding:0 max(16px,env(safe-area-inset-left,0px));height:56px;background:var(--ultra);color:var(--on-ultra);position:sticky;top:0;z-index:25}
    .logo{display:flex;align-items:center;gap:8px;font-weight:600;font-size:1.0625rem;letter-spacing:-.02em;color:inherit;text-decoration:none}
    .mark{width:28px;height:28px;border-radius:7px;background:var(--on-ultra);color:var(--ultra);display:grid;place-items:center;font-weight:700;font-size:.85rem}
    .nav-d{display:flex;gap:2px;height:100%}
    .nav-d a{color:var(--on-ultra);text-decoration:none;font-weight:500;padding:0 12px;border-bottom:3px solid transparent;white-space:nowrap;display:inline-flex;gap:6px;align-items:center}
    .nav-d a:hover{background:color-mix(in srgb,var(--on-ultra) 10%,transparent)}
    .nav-d a.on{border-color:var(--on-ultra)}
    .n{font:600 .625rem var(--f-mono);background:var(--on-ultra);color:var(--ultra);border-radius:999px;padding:0 6px;line-height:16px}
    .user{margin-left:auto;display:flex;align-items:center;gap:8px}
    .av{width:26px;height:26px;border-radius:50%;background:var(--on-ultra);color:var(--ultra);display:grid;place-items:center;font:600 .625rem var(--f-mono);flex:none}
    .av.lg{width:40px;height:40px;font-size:.75rem;background:var(--ultra);color:var(--on-ultra)}
    .burger{display:none;margin-left:auto;width:40px;height:40px;border:1px solid color-mix(in srgb,var(--on-ultra) 35%,transparent);border-radius:10px;background:transparent;cursor:pointer;place-items:center;color:var(--on-ultra)}
    .burger span{display:grid;gap:4px;width:18px}
    .burger i{display:block;height:2px;background:currentColor;border-radius:2px;transition:transform .2s,opacity .2s}
    .burger .x i:nth-child(1){transform:translateY(6px) rotate(45deg)}
    .burger .x i:nth-child(2){opacity:0}
    .burger .x i:nth-child(3){transform:translateY(-6px) rotate(-45deg)}
    .menu{position:fixed;left:0;right:0;bottom:0;top:var(--menu-top,56px);z-index:24;background:var(--sheet);display:flex;flex-direction:column;justify-content:space-between;padding:8px 20px 0;animation:in .18s ease-out}
    @keyframes in{from{opacity:0;transform:translateY(-6px)}}
    .menu .row-list a{font-size:1.0625rem;font-weight:600}
    .menu .row-list a.on{color:var(--ultra)}
    .end{display:flex;align-items:center;gap:10px}
    .menu .n{background:var(--ultra);color:var(--on-ultra)}
    .menu-foot{display:flex;gap:12px;align-items:center;padding:16px 0 calc(16px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--rule)}
    .menu-foot small{display:block;color:var(--ink-soft)}
    .main{padding:20px max(16px,env(safe-area-inset-left,0px)) 32px;max-width:1440px;margin:0 auto}
    .foot{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:10px max(16px,env(safe-area-inset-left,0px));border-top:1px solid var(--rule);font-size:.6875rem;color:var(--ink-soft);background:var(--sheet)}
    @media (max-width:1024px){.nav-d,.user{display:none}.burger{display:grid}}
    @media (max-width:640px){.main{padding:16px 16px 100px}.foot{display:none}}
    @media (prefers-reduced-motion:reduce){.menu{animation:none}.burger i{transition:none}}
  `,
})
export class CobrosShellComponent {
  readonly s = inject(CobrosStore);
  readonly menu = signal(false);
  readonly menuTop = signal(56);
  readonly inicio = new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  readonly enlaces = [
    { k: 'exp', label: 'Expedientes', ruta: '/demos/cobros', exacto: true, ico: 'doc' },
    { k: 'ing', label: 'Ingresos diarios', ruta: '/demos/cobros/ingresos', exacto: false, ico: 'upload' },
    { k: 'rec', label: 'Índice de recaptación', ruta: '/demos/cobros/recaptacion', exacto: false, ico: 'chart' },
    { k: 'fac', label: 'Facturas sin cliente', ruta: '/demos/cobros/facturas', exacto: false, ico: 'file' },
  ];

  constructor() {
    inject(Router).events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.menu.set(false));
  }

  abrirMenu(top: HTMLElement): void {
    this.menuTop.set(Math.max(0, top.getBoundingClientRect().bottom));
    this.menu.set(!this.menu());
    if (this.menu()) setTimeout(() => document.querySelector<HTMLElement>('#menu-cobros a')?.focus());
  }

  contador(k: string): number { return k === 'ing' ? this.s.ingresos().length : k === 'fac' ? this.s.facturasSinCliente().length : 0; }
}
