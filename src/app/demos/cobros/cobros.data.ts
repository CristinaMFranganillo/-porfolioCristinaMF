/* Datos 100 % ficticios generados de forma determinista para la demo. */
export type Estado = 'Abierto' | 'Aplazado' | 'Jurídico' | 'Cobrado' | 'Cerrado';

export interface Actuacion { id: number; fecha: string; tipo: string; descripcion: string; recobrado: number | null; }
export interface Factura { numero: string; fecha: string; vencimiento: string; importe: number; }
export interface LogEntry { fecha: string; texto: string; }

export interface Expediente {
  id: number;
  cliente: string;
  nif: string;
  campana: string;
  gestor: string;
  entidad: string;
  provincia: string;
  estado: Estado;
  deuda: number;
  negativo: number;
  bajaEnCurso: boolean;
  scoring: number;
  contacto: string;
  actuaciones: Actuacion[];
  facturas: Factura[];
  logs: LogEntry[];
}

export const GESTORES = ['M. Sánchez', 'L. Gómez', 'A. Pérez', 'R. Durán'];
export const CAMPANAS = ['Octubre', 'Septiembre', 'Recobro externo'];
export const ESTADOS: Estado[] = ['Abierto', 'Aplazado', 'Jurídico', 'Cobrado', 'Cerrado'];
export const PROVINCIAS = ['Badajoz', 'Cáceres', 'Sevilla', 'Madrid', 'Toledo'];
export const ENTIDADES = ['Entidad A', 'Entidad B', 'Entidad C'];
export const TIPOS_ACTUACION = ['Llamada saliente', 'Llamada entrante', 'Email enviado', 'Compromiso de pago', 'Cobro parcial', 'Burofax'];

const CLIENTES = [
  'Talleres Ribera S.L.', 'Construcciones Alcántara', 'Panadería Hnos. Ruiz', 'Clínica Dental Centro', 'Transportes Almaraz',
  'Hostal La Vega', 'Agroalimentaria Tajo', 'Limpiezas del Sur', 'Asesoría Lusitania', 'Bodegas Tierra Llana',
  'Cerámicas del Zújar', 'Metalúrgica Guadiana', 'Frutas Vegas Altas', 'Imprenta Moderna', 'Óptica Visión Clara',
  'Carpintería Encinar', 'Distribuciones Alagón', 'Farmacia San Roque', 'Gimnasio Activa', 'Autoescuela Vía Plata',
  'Electricidad Montánchez', 'Hotel Mirador', 'Quesería La Serena', 'Consultoría Norte', 'Reformas Hogar 10',
  'Academia Idiomas Plus', 'Fontanería Rápida', 'Viveros El Jerte', 'Cafetería Central', 'Logística Puerta Sur',
  'Seguridad Integral', 'Estudio Arquitectura Lineal',
];

function rng(seed: number) {
  return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
}
const pick = <T>(r: () => number, xs: T[]) => xs[Math.floor(r() * xs.length)];
const iso = (d: Date) => d.toISOString().slice(0, 10);

export function generarExpedientes(n = 64): Expediente[] {
  const r = rng(7);
  const hoy = new Date('2026-11-10');
  return Array.from({ length: n }, (_, i) => {
    const deuda = Math.round((300 + r() * 9500) * 100) / 100;
    const estado = pick(r, ESTADOS);
    const cliente = CLIENTES[i % CLIENTES.length];
    const nAct = 1 + Math.floor(r() * 4);
    const actuaciones: Actuacion[] = Array.from({ length: nAct }, (_, k) => {
      const d = new Date(hoy); d.setDate(d.getDate() - (k * 3 + Math.floor(r() * 3)));
      const tipo = pick(r, TIPOS_ACTUACION);
      return {
        id: i * 10 + k,
        fecha: iso(d),
        tipo,
        descripcion: tipo === 'Compromiso de pago' ? 'Se compromete a pagar antes del día 20' : tipo === 'Cobro parcial' ? 'Transferencia recibida' : tipo === 'Burofax' ? 'Requerimiento previo a monitorio' : 'Contacto con administración',
        recobrado: tipo === 'Cobro parcial' ? Math.round(deuda * 0.25) : null,
      };
    });
    const facturas: Factura[] = Array.from({ length: 1 + Math.floor(r() * 3) }, (_, k) => {
      const f = new Date(hoy); f.setMonth(f.getMonth() - (k + 1));
      const v = new Date(f); v.setDate(v.getDate() + 30);
      return { numero: `FP-2026-${String(100 + i * 3 + k).padStart(4, '0')}`, fecha: iso(f), vencimiento: iso(v), importe: Math.round((deuda / (k + 2)) * 100) / 100 };
    });
    return {
      id: 184520 + i * 37,
      cliente,
      nif: `B0${6100000 + i * 1371}`,
      campana: pick(r, CAMPANAS),
      gestor: pick(r, GESTORES),
      entidad: pick(r, ENTIDADES),
      provincia: pick(r, PROVINCIAS),
      estado,
      deuda,
      negativo: r() > 0.7 ? -120.5 : 0,
      bajaEnCurso: r() > 0.85,
      scoring: 1 + Math.floor(r() * 5),
      contacto: `administracion@${cliente.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '').slice(0, 14)}.example`,
      actuaciones,
      facturas,
      logs: [{ fecha: iso(hoy), texto: 'Expediente asignado automáticamente' }],
    };
  });
}

export const eur = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
export const estadoClass = (e: Estado) => 'st st-' + e.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
