import { Component, ElementRef, computed, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemoBarComponent } from '../../shared/ui/demo-bar.component';
import { AREAS, Area, CATEGORIAS, Categoria, IMPLANTADO, PLANTILLAS, PLAZOS, SECTORES } from './web.data';

type Vista = 'inicio' | 'presupuesto';
type Paso = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-web',
  standalone: true,
  imports: [FormsModule, DemoBarComponent],
  templateUrl: './web.component.html',
  styleUrl: './web.component.scss',
})
export class WebComponent {
  readonly areas = AREAS; readonly categorias = CATEGORIAS; readonly sectores = SECTORES;
  readonly plantillas = PLANTILLAS; readonly implantado = IMPLANTADO; readonly plazos = PLAZOS;

  readonly vista = signal<Vista>('inicio');
  readonly menu = signal(false);
  readonly menuTop = signal(68);
  readonly categoria = signal<Categoria | null>(null);
  readonly busqueda = signal('');
  readonly elegidas = signal<Set<string>>(new Set());

  readonly paso = signal<Paso>(1);
  readonly intento = signal(false);
  org = { sector: '', plantilla: '', implantado: '', plazo: '' };
  contacto = { nombre: '', empresa: '', email: '', telefono: '', acepto: false };
  comentario = '';
  referencia = '';
  private readonly titulo = viewChild<ElementRef<HTMLElement>>('titulo');

  readonly visibles = computed(() => {
    const c = this.categoria(); const q = this.busqueda().trim().toLowerCase();
    return this.areas.filter((a) => (!c || a.categoria === c) && (!q || (a.nombre + a.desc).toLowerCase().includes(q)));
  });
  readonly seleccion = computed(() => this.areas.filter((a) => this.elegidas().has(a.id)));

  toggleArea(a: Area): void {
    this.elegidas.update((s) => { const n = new Set(s); n.has(a.id) ? n.delete(a.id) : n.add(a.id); return n; });
  }

  toggleMenu(hdr: HTMLElement): void {
    this.menuTop.set(Math.max(0, hdr.getBoundingClientRect().bottom));
    this.menu.set(!this.menu());
    if (this.menu()) setTimeout(() => document.querySelector<HTMLElement>('.menu nav a')?.focus());
  }

  irInicio(): void { this.vista.set('inicio'); this.menu.set(false); scrollTo({ top: 0 }); }
  aviso(): void { document.querySelector('.ftr')?.scrollIntoView({ behavior: 'smooth' }); }

  irPresupuesto(): void { this.menu.set(false); this.vista.set('presupuesto'); this.paso.set(1); this.intento.set(false); scrollTo({ top: 0 }); this.enfocar(); }

  errores(): Record<string, string> {
    const e: Record<string, string> = {};
    if (this.paso() === 1 && !this.elegidas().size) e['areas'] = 'Elige al menos un área para preparar la propuesta.';
    if (this.paso() === 2) {
      if (!this.org.sector) e['sector'] = 'Indica el sector de tu organización.';
      if (!this.org.plantilla) e['plantilla'] = 'Indica el tamaño de la plantilla.';
      if (!this.org.implantado) e['implantado'] = 'Dinos si ya tenéis algo implantado.';
      if (!this.org.plazo) e['plazo'] = 'Indica cuándo lo necesitas.';
    }
    if (this.paso() === 3) {
      if (this.contacto.nombre.trim().length < 2) e['nombre'] = 'Escribe tu nombre.';
      if (!this.contacto.empresa.trim()) e['empresa'] = 'Escribe el nombre de la empresa.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.contacto.email)) e['email'] = 'Escribe un email válido, por ejemplo nombre@empresa.es.';
      if (this.contacto.telefono && !/^[+\d\s]{9,15}$/.test(this.contacto.telefono)) e['telefono'] = 'El teléfono debe tener al menos 9 dígitos.';
      if (!this.contacto.acepto) e['acepto'] = 'Necesitamos tu consentimiento para contactarte.';
    }
    return e;
  }
  err(k: string): string | null { return this.intento() ? this.errores()[k] ?? null : null; }

  siguiente(): void {
    this.intento.set(true);
    const e = Object.keys(this.errores());
    if (e.length) { queueMicrotask(() => document.getElementById('w-' + e[0])?.focus()); return; }
    if (this.paso() === 3) this.referencia = 'PR-' + Math.floor(10000 + Math.random() * 89999);
    this.paso.update((p) => (p + 1) as Paso);
    this.intento.set(false);
    this.enfocar();
  }
  atras(): void { this.paso.update((p) => (p - 1) as Paso); this.intento.set(false); this.enfocar(); }
  irPaso(p: Paso): void { if (p < this.paso()) { this.paso.set(p); this.enfocar(); } }

  reiniciar(): void {
    this.elegidas.set(new Set()); this.org = { sector: '', plantilla: '', implantado: '', plazo: '' };
    this.contacto = { nombre: '', empresa: '', email: '', telefono: '', acepto: false }; this.comentario = '';
    this.vista.set('inicio');
  }

  etiqueta(lista: { v: string; t: string }[], v: string): string { return lista.find((x) => x.v === v)?.t ?? ''; }

  /** Mueve el foco al título del paso para que el lector de pantalla anuncie el cambio. */
  private enfocar(): void { setTimeout(() => this.titulo()?.nativeElement.focus(), 0); }
}
