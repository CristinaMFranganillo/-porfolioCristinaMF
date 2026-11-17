import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Cristina Martínez Franganillo · Frontend UX/UI & Design Systems' },
  {
    path: 'demos/cobros',
    title: 'Demo · Intranet de cobros',
    loadComponent: () => import('./demos/cobros/cobros-shell.component').then((m) => m.CobrosShellComponent),
    children: [
      { path: '', loadComponent: () => import('./demos/cobros/bandeja.component').then((m) => m.BandejaComponent) },
      { path: 'expediente/:id', loadComponent: () => import('./demos/cobros/ficha.component').then((m) => m.FichaComponent) },
      { path: 'ingresos', loadComponent: () => import('./demos/cobros/ingresos.component').then((m) => m.IngresosComponent) },
      { path: 'recaptacion', loadComponent: () => import('./demos/cobros/recaptacion.component').then((m) => m.RecaptacionComponent) },
      { path: 'facturas', loadComponent: () => import('./demos/cobros/facturas.component').then((m) => m.FacturasComponent) },
    ],
  },
  {
    path: 'demos/asistente',
    title: 'Demo · Asistente IA de planificación',
    loadComponent: () => import('./demos/asistente/asistente.component').then((m) => m.AsistenteComponent),
  },
  {
    path: 'demos/web-publica',
    title: 'Demo · Web corporativa',
    loadComponent: () => import('./demos/web/web.component').then((m) => m.WebComponent),
  },
  {
    path: 'demos/design-system',
    title: 'Demo · Design system multiempresa',
    loadComponent: () => import('./demos/design-system/design-system.component').then((m) => m.DesignSystemComponent),
  },
  {
    path: 'responsive/:demo',
    title: 'Vista responsive de las demos',
    loadComponent: () => import('./pages/responsive/responsive.component').then((m) => m.ResponsiveComponent),
  },
  { path: '**', redirectTo: '' },
];
