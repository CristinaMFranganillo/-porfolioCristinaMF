import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CobrosStore } from './cobros.store';
import { FacturaSinCliente, eur, fecha } from './cobros.data';
import { ModalComponent } from '../../shared/ui/modal.component';
import { ToastService } from '../../shared/ui/toast.service';
import { IcoComponent, PaginadorComponent } from './ui';

/** Facturas que llegan sin cliente asociado y se asignan a mano buscando por CIF o nombre. */
@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [FormsModule, ModalComponent, IcoComponent, PaginadorComponent],
  template: `
    <h1>Facturas sin cliente</h1>
    <div class="ph">
      <p><b>{{ s.facturasSinCliente().length }} facturas</b> pendientes de asignar a un cliente</p>
      <button type="button" class="dk-btn" (click)="toast.show('info', 'Exportado', 'facturas_sin_cliente.csv (simulado)')"><app-ico name="download" /> Exportar Excel</button>
    </div>
    <div class="tools">
      <span></span>
      <label class="search"><span>Buscar:</span><input class="dk-input" type="search" [ngModel]="q()" (ngModelChange)="q.set($event); page.set(1)" aria-label="Buscar facturas"></label>
    </div>
    <div class="dk-table-wrap">
      <table class="dk-table dense">
        <caption class="sr">Facturas sin cliente</caption>
        <thead><tr><th scope="col">Nº factura</th><th scope="col">CIF</th><th scope="col">Fecha factura</th><th scope="col" class="r">Importe</th><th scope="col">Emisor</th><th scope="col">Fecha extracción</th><th scope="col">Acciones</th></tr></thead>
        <tbody>
          @for (f of pagina(); track f.numero) {
            <tr><td><b class="mono">{{ f.numero }}</b></td><td class="mono">{{ f.cif }}</td><td>{{ fecha(f.fecha) }}</td><td class="r">{{ eur(f.importe) }}</td><td>{{ f.emisor }}</td><td>{{ f.extraccion }}</td>
              <td class="acc">
                <button type="button" (click)="toast.show('info', 'PDF', f.numero + '.pdf (simulado)')" [attr.aria-label]="'Ver PDF de ' + f.numero" title="Ver PDF"><app-ico name="file" [size]="15" /></button>
                <button type="button" (click)="abrir(f)" [attr.aria-label]="'Asignar cliente a ' + f.numero" title="Asignar cliente"><app-ico name="user-plus" [size]="15" /></button>
              </td></tr>
          } @empty { <tr><td colspan="7"><div class="dk-empty"><b>Todas las facturas tienen cliente</b><span>Buen trabajo.</span></div></td></tr> }
        </tbody>
      </table>
    </div>
    <app-paginador [(page)]="page" [total]="filtradas().length" [size]="10" />

    <app-modal heading="Asignar cliente a la factura" [open]="!!actual()" (closed)="actual.set(null)">
      @if (actual(); as f) {
        <dl class="fact"><div><dt>Factura</dt><dd class="mono">{{ f.numero }}</dd></div><div><dt>CIF</dt><dd class="mono">{{ f.cif }}</dd></div>
          <div><dt>Emisor</dt><dd>{{ f.emisor }}</dd></div><div><dt>Importe</dt><dd>{{ eur(f.importe) }}</dd></div></dl>
        <label class="dk-field"><span class="dk-label">Buscar cliente</span>
          <input class="dk-input" type="search" placeholder="Nombre, CIF o nº de cliente" [ngModel]="qCli()" (ngModelChange)="qCli.set($event); elegido.set(null)" autofocus></label>
        <p class="lbl">{{ qCli() ? 'Resultados' : 'Clientes sugeridos' }}</p>
        <ul class="clis" role="listbox" aria-label="Clientes">
          @for (c of candidatos(); track c.id) {
            <li [class.on]="elegido() === c.id">
              <span class="mono">{{ c.numCliente }}</span><b>{{ c.cliente }}</b><span class="mono">{{ c.nif }}</span>
              @if (elegido() === c.id) { <span class="tag">Seleccionado</span> }
              @else { <button type="button" class="dk-btn sm" (click)="elegido.set(c.id)">Seleccionar</button> }
            </li>
          } @empty { <li class="none">Sin resultados</li> }
        </ul>
        @if (elegidoNombre(); as n) {
          <div class="confirm"><span>¿Asignar <b>{{ n }}</b> a la factura {{ f.numero }}?</span>
            <span class="btns"><button type="button" class="dk-btn sm" (click)="elegido.set(null)">Cancelar</button><button type="button" class="dk-btn sm primary" (click)="asignar(f)">Asignar cliente</button></span></div>
        }
      }
      <div actions><button type="button" class="dk-btn" (click)="actual.set(null)">Cerrar</button></div>
    </app-modal>
  `,
  styles: `
    :host{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
    .ph,.tools{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
    .ph p{margin:0}
    .search{display:flex;align-items:center;gap:8px}.search input{width:220px}
    .dense th,.dense td{padding:8px 10px}
    .mono{font-family:var(--f-mono);font-size:.75rem}
    .acc{display:flex;gap:4px}
    .acc button{border:0;background:transparent;color:var(--ultra);cursor:pointer;border-radius:4px;padding:4px;display:grid}
    .acc button:hover{background:var(--ultra-soft)}
    .fact{display:grid;grid-template-columns:repeat(4,auto);gap:4px 20px;margin:0;font-size:.8125rem}
    @media (max-width:520px){.fact{grid-template-columns:1fr 1fr}}
    .fact dt{color:var(--ink-soft);font-size:.6875rem}.fact dd{margin:0}
    .lbl{margin:0;font-weight:600;color:var(--ultra);font-size:.75rem}
    .clis{list-style:none;margin:0;padding:0;border:1px solid var(--rule);border-radius:8px;max-height:220px;overflow:auto}
    .clis li{display:grid;grid-template-columns:60px 1fr auto auto;gap:10px;align-items:center;padding:8px 10px;border-top:1px solid var(--rule);font-size:.8125rem}
    .clis li:first-child{border-top:0}
    .clis li.on{background:var(--ultra-soft)}
    .clis .none{display:block;color:var(--ink-soft)}
    .tag{font:600 .625rem var(--f-mono);text-transform:uppercase;color:var(--ultra)}
    .confirm{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;background:var(--paper);border:1px solid var(--rule);border-radius:8px;padding:10px 12px;font-size:.8125rem}
    .btns{display:flex;gap:6px}
    .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  `,
})
export class FacturasComponent {
  readonly s = inject(CobrosStore);
  readonly toast = inject(ToastService);
  readonly eur = eur; readonly fecha = fecha;
  readonly q = signal(''); readonly page = signal(1);
  readonly actual = signal<FacturaSinCliente | null>(null);
  readonly qCli = signal(''); readonly elegido = signal<number | null>(null);

  readonly filtradas = computed(() => {
    const q = this.q().toLowerCase();
    return this.s.facturasSinCliente().filter((f) => !q || [f.numero, f.cif, f.emisor].join(' ').toLowerCase().includes(q));
  });
  readonly pagina = computed(() => this.filtradas().slice((this.page() - 1) * 10, this.page() * 10));
  readonly candidatos = computed(() => {
    const q = this.qCli().toLowerCase();
    const xs = this.s.expedientes();
    return (q ? xs.filter((e) => [e.cliente, e.nif, e.numCliente].join(' ').toLowerCase().includes(q)) : xs.slice(0, 4)).slice(0, 8);
  });
  readonly elegidoNombre = computed(() => this.s.byId(this.elegido() ?? -1)?.cliente ?? null);

  abrir(f: FacturaSinCliente): void { this.qCli.set(''); this.elegido.set(null); this.actual.set(f); }
  asignar(f: FacturaSinCliente): void {
    const n = this.elegidoNombre();
    this.s.asignarFactura(f.numero, this.elegido()!);
    this.actual.set(null);
    this.toast.show('ok', 'Factura asignada', `${f.numero} → ${n}`);
  }
}
