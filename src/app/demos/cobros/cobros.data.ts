/*
 * Datos 100 % ficticios para la demo de la intranet de cobros.
 * Se generan de forma determinista: mismos datos en cada visita, sin nombres reales
 * de empresas, personas, proveedores ni direcciones.
 */
export type Estado = 'Abierto' | 'Aplazado' | 'Jurídico' | 'Cobrado' | 'Cerrado';

export interface Actuacion {
  id: number; fecha: string; tipo: string; descripcion: string; gestor: string;
  recobrado: number | null; devuelto: number | null; adjunto: string | null; ejecucion: string | null;
}
export interface Factura { numero: string; fecha: string; vencimiento: string; importe: number; concepto: string; }
export interface Movimiento { fecha: string; concepto: string; importe: number; }
export interface Aplazamiento { id: number; vencimiento: string; motivo: string; descripcion: string; }
export interface Incidencia { fecha: string; tipo: string; estado: 'Abierta' | 'En curso' | 'Resuelta'; detalle: string; }
export interface LogEntry { fecha: string; texto: string; }

export interface Expediente {
  id: number;
  cliente: string; nif: string; numCliente: number; grupo: string | null;
  campana: string; gestor: string; entidad: string; provincia: string;
  estado: Estado; motivoAplazamiento: string | null; observaciones: string | null;
  deuda: number; negativo: number;
  granCuenta: boolean; juridico: boolean; bajaEnCurso: boolean; reclamacion: boolean; morosidad: boolean;
  valorCliente: number; scoring: number; fechaScoring: string;
  cartera: string; comision: number; motivoDevolucion: string; formaPago: string; terminos: string;
  contacto: string; telefono: string; emailCobro: string; comercial: string; productos: string; trabajadores: number;
  externa: { campana: string; estado: string; proveedor: string; situacion: string } | null;
  actuaciones: Actuacion[]; facturas: Factura[]; movimientos: Movimiento[];
  aplazamientos: Aplazamiento[]; bajas: Incidencia[]; reclamaciones: Incidencia[]; logs: LogEntry[];
  asignado: string;
}

export interface FacturaSinCliente { numero: string; cif: string; fecha: string; importe: number; emisor: string; extraccion: string; }
export interface IngresoPendiente { id: number; cif: string; entidad: string; numCliente: number; concepto: string; importe: number; expediente: number | null; }

export const GESTORES = ['M. Sánchez', 'L. Gómez', 'A. Pérez', 'R. Durán'];
export const CAMPANAS = ['Campaña octubre', 'Campaña septiembre', 'Recobro', 'Campaña general'];
export const ESTADOS: Estado[] = ['Abierto', 'Aplazado', 'Jurídico', 'Cobrado', 'Cerrado'];
export const PROVINCIAS = ['Badajoz', 'Cáceres', 'Sevilla', 'Madrid', 'Toledo'];
export const ENTIDADES = ['Entidad A', 'Entidad B', 'Entidad C'];
export const MOTIVOS_APLAZAMIENTO = ['Compromiso de pago', 'Pendiente de remesa', 'Acuerdo de pago', 'Revisión de factura'];
export const FORMAS_PAGO = ['Domiciliación', 'Transferencia', 'Tarjeta'];
export const TIPOS_ACTUACION = ['Llamada saliente', 'Llamada entrante', 'Email enviado', 'Compromiso de pago', 'Cobro parcial', 'Burofax'];
export const MOTIVOS_CIERRE = ['Deuda cobrada', 'Incobrable', 'Error de facturación', 'Baja del cliente'];
export const TIPOS_DOCUMENTO = ['Carta de reclamación', 'Requerimiento de pago', 'Certificado de deuda'];
export const MARCADORES = [
  { k: 'granCuenta', label: 'Gran cuenta' }, { k: 'grupo', label: 'Grupo cliente' }, { k: 'juridico', label: 'Jurídico' },
  { k: 'bajaEnCurso', label: 'Solicitud de baja' }, { k: 'reclamacion', label: 'Reclamación' }, { k: 'morosidad', label: 'Fichero de morosidad' },
] as const;
export type Marcador = (typeof MARCADORES)[number]['k'];

const EMPRESAS = [
  'Talleres Ribera', 'Construcciones Alcántara', 'Panadería Hnos. Ruiz', 'Clínica Dental Centro', 'Transportes Almaraz',
  'Hostal La Vega', 'Agroalimentaria Tajo', 'Limpiezas del Sur', 'Asesoría Lusitania', 'Bodegas Tierra Llana',
  'Cerámicas del Zújar', 'Metalúrgica Guadiana', 'Frutas Vegas Altas', 'Imprenta Moderna', 'Óptica Visión Clara',
  'Carpintería Encinar', 'Distribuciones Alagón', 'Farmacia San Roque', 'Gimnasio Activa', 'Autoescuela Vía Plata',
  'Electricidad Montánchez', 'Hotel Mirador', 'Quesería La Serena', 'Consultoría Norte', 'Reformas Hogar 10',
  'Academia Idiomas Plus', 'Fontanería Rápida', 'Viveros El Jerte', 'Cafetería Central', 'Logística Puerta Sur',
  'Seguridad Integral', 'Estudio Arquitectura Lineal',
];
const FORMAS = ['S.L.', 'S.A.', 'S.Coop.', 'S.L.U.'];
const CONTACTOS = ['Ana Rodríguez', 'Luis Castaño', 'Marta Ortega', 'Jorge Pino', 'Elena Ramos', 'Rubén Solís'];
const OBSERVACIONES = ['Llamar el lunes', 'Envía justificante', 'Sin contacto', 'Pide copia de factura', null, null];

function rng(seed: number) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280); }
const pick = <T>(r: () => number, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
export const iso = (d: Date) => d.toISOString().slice(0, 10);
const round = (n: number) => Math.round(n * 100) / 100;
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '').slice(0, 16);

export function generarExpedientes(n = 96): Expediente[] {
  const r = rng(11);
  const hoy = new Date('2026-11-10');
  return Array.from({ length: n }, (_, i) => {
    const base = EMPRESAS[i % EMPRESAS.length];
    const cliente = i < EMPRESAS.length ? `${base} ${FORMAS[i % FORMAS.length]}` : `${base} ${['Norte', 'Sur', 'Centro'][i % 3]} ${FORMAS[(i + 1) % FORMAS.length]}`;
    const deuda = round(300 + r() * 14500);
    const estado = pick(r, ESTADOS);
    const gestor = pick(r, GESTORES);
    const juridico = estado === 'Jurídico';
    const fecha = (dias: number) => { const d = new Date(hoy); d.setDate(d.getDate() - dias); return iso(d); };

    const actuaciones: Actuacion[] = Array.from({ length: 2 + Math.floor(r() * 4) }, (_, k) => {
      const tipo = pick(r, TIPOS_ACTUACION);
      return {
        id: i * 100 + k, fecha: fecha(k * 3 + Math.floor(r() * 3)), tipo, gestor,
        descripcion: tipo === 'Compromiso de pago' ? 'Se compromete a pagar 1.000 € antes del día 15'
          : tipo === 'Cobro parcial' ? 'Transferencia recibida' : tipo === 'Burofax' ? 'Requerimiento previo a monitorio'
          : tipo === 'Email enviado' ? 'Se envía relación de facturas vencidas' : 'Habla con administración, pide aplazar',
        recobrado: tipo === 'Cobro parcial' ? round(deuda * 0.2) : null,
        devuelto: null,
        adjunto: tipo === 'Burofax' ? 'burofax.pdf' : null,
        ejecucion: tipo === 'Burofax' ? fecha(k * 3) : null,
      };
    });
    const facturas: Factura[] = Array.from({ length: 1 + Math.floor(r() * 4) }, (_, k) => {
      const f = new Date(hoy); f.setMonth(f.getMonth() - (k + 1));
      const v = new Date(f); v.setDate(v.getDate() + 30);
      return { numero: `FV26-${String(4000 + i * 7 + k).padStart(5, '0')}`, fecha: iso(f), vencimiento: iso(v), importe: round(deuda / (k + 2)), concepto: pick(r, ['Cuota mensual de servicio', 'Servicio puntual', 'Renovación anual']) };
    });
    const movimientos: Movimiento[] = Array.from({ length: 3 }, (_, k) => ({
      fecha: fecha(15 + k * 30), concepto: k === 0 ? 'Devolución de recibo' : k === 1 ? 'Cargo de recibo' : 'Cobro por transferencia', importe: k === 0 ? -round(deuda / 3) : round(deuda / 3),
    }));
    const aplazado = estado === 'Aplazado';
    const baja = r() > 0.82;
    const reclamacion = r() > 0.85;
    return {
      id: 184520 + i * 37, cliente, nif: `B${String(10000000 + i * 137713).slice(0, 8)}`, numCliente: 30210 + i * 113,
      grupo: i % 9 === 0 ? `Grupo ${base.split(' ')[0]}` : null,
      campana: pick(r, CAMPANAS), gestor, entidad: pick(r, ENTIDADES), provincia: pick(r, PROVINCIAS),
      estado, motivoAplazamiento: aplazado ? pick(r, MOTIVOS_APLAZAMIENTO) : null, observaciones: pick(r, OBSERVACIONES),
      deuda, negativo: r() > 0.7 ? -120.5 : 0,
      granCuenta: r() > 0.75, juridico, bajaEnCurso: baja, reclamacion, morosidad: juridico && r() > 0.4,
      valorCliente: 1 + Math.floor(r() * 5), scoring: 1 + Math.floor(r() * 5), fechaScoring: fecha(4),
      cartera: pick(r, ['Compartida', 'Propia']), comision: pick(r, [2, 3, 5]), motivoDevolucion: pick(r, ['Saldo insuficiente', 'Cuenta cancelada', 'Orden del titular']),
      formaPago: pick(r, FORMAS_PAGO), terminos: pick(r, ['30 días · Mensual', '60 días · Trimestral', 'Al contado']),
      contacto: pick(r, CONTACTOS), telefono: '600 000 000', emailCobro: `administracion@${slug(base)}.example`, comercial: pick(r, ['J. Castaño', 'P. Lillo', 'S. Mena']),
      productos: pick(r, ['Servicio integral · 4 especialidades', 'Servicio básico', 'Servicio integral + formación']), trabajadores: 5 + Math.floor(r() * 240),
      externa: estado === 'Jurídico' || r() > 0.7 ? { campana: pick(r, CAMPANAS), estado: pick(r, ['Pte. documentación', 'En gestión', 'Demanda']), proveedor: pick(r, ['Agencia externa 1', 'Agencia externa 2']), situacion: pick(r, ['Monitorio', 'Sin acción judicial', 'Demanda presentada']) } : null,
      actuaciones, facturas, movimientos,
      aplazamientos: aplazado ? [{ id: i, vencimiento: fecha(-15), motivo: 'Acuerdo de pago', descripcion: 'Pago en dos plazos acordado por teléfono' }] : [],
      bajas: baja ? [{ fecha: fecha(6), tipo: 'Solicitud de baja', estado: 'En curso', detalle: 'El cliente solicita la baja del servicio a fin de mes' }] : [],
      reclamaciones: reclamacion ? [{ fecha: fecha(10), tipo: 'Reclamación de factura', estado: 'Abierta', detalle: 'No reconoce el importe de la última factura' }] : [],
      logs: [{ fecha: fecha(20), texto: 'Expediente creado automáticamente por impago' }, { fecha: fecha(19), texto: `Asignado a ${gestor}` }],
      asignado: fecha(Math.floor(r() * 40)),
    };
  });
}

export function generarFacturasSinCliente(): FacturaSinCliente[] {
  const emisores = ['Sociedad emisora 1', 'Sociedad emisora 2', 'Sociedad emisora 3'];
  return Array.from({ length: 18 }, (_, i) => ({
    numero: `FV26-${String(4410 + i * 17).padStart(5, '0')}`,
    cif: `B${String(6123456 + i * 9187).padStart(8, '0')}`,
    fecha: iso(new Date(2026, 9, 10 + i)),
    importe: round(145.2 + i * 388.6),
    emisor: emisores[i % 3],
    extraccion: `${iso(new Date(2026, 10, 1 + (i % 5)))} 09:15`,
  }));
}

/** Simula la lectura del Excel de ingresos del banco. */
export function leerIngresos(expedientes: Expediente[]): IngresoPendiente[] {
  return expedientes.filter((e) => e.estado !== 'Cobrado' && e.estado !== 'Cerrado').slice(0, 12).map((e, i) => ({
    id: i + 1, cif: e.nif, entidad: e.entidad, numCliente: e.numCliente,
    concepto: `TRANSF ${e.cliente.toUpperCase().slice(0, 22)} FRA ${4410 + i}`,
    importe: round(Math.min(e.deuda, 120 + i * 237.15)), expediente: i === 7 ? null : e.id,
  }));
}

const EUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, useGrouping: 'always' } as unknown as Intl.NumberFormatOptions);
export const eur = (n: number) => EUR.format(n);
export const fecha = (isoDate: string) => { const [y, m, d] = isoDate.slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
export const estadoClass = (e: string) => 'st st-' + e.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
