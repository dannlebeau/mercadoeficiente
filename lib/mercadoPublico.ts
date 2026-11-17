// Cliente de la API pública de Mercado Público (https://www.chilecompra.cl/api/).
// Límite: 10.000 consultas diarias por ticket. Solo se usa en el servidor.
import { fechaMercadoPublico } from "./fechas.ts";

// MP_API_BASE solo se usa en pruebas locales, para apuntar a una API falsa.
export const API_BASE = process.env.MP_API_BASE || "https://api.mercadopublico.cl/servicios/v1/publico";

export const ESTADOS: Record<number, string> = {
  5: "Publicada",
  6: "Cerrada",
  7: "Desierta",
  8: "Adjudicada",
  18: "Revocada",
  19: "Suspendida",
};

export const UNIDADES_TIEMPO: Record<number, string> = {
  1: "horas",
  2: "días",
  3: "semanas",
  4: "meses",
  5: "años",
};

// Forma (parcial) de la respuesta de la API. Todo opcional: la API omite
// campos o los manda vacíos según el estado de la licitación.
export type AdjudicacionItemApi = {
  RutProveedor?: string;
  NombreProveedor?: string;
  Cantidad?: number;
  MontoUnitario?: number;
};

export type ItemApi = {
  Correlativo?: number;
  CodigoProducto?: number | string;
  CodigoCategoria?: string;
  Categoria?: string;
  NombreProducto?: string;
  Descripcion?: string;
  UnidadMedida?: string;
  Cantidad?: number;
  Adjudicacion?: AdjudicacionItemApi | null;
};

export type LicitacionApi = {
  CodigoExterno?: string;
  Nombre?: string;
  CodigoEstado?: number;
  Estado?: string;
  Descripcion?: string;
  Tipo?: string;
  Moneda?: string;
  MontoEstimado?: number;
  FuenteFinanciamiento?: string;
  TiempoDuracionContrato?: string | number;
  UnidadTiempoDuracionContrato?: number;
  FechaCierre?: string;
  Comprador?: {
    CodigoOrganismo?: string;
    NombreOrganismo?: string;
    RutUnidad?: string;
    CodigoUnidad?: string;
    NombreUnidad?: string;
    DireccionUnidad?: string;
    ComunaUnidad?: string;
    RegionUnidad?: string;
  };
  Fechas?: {
    FechaCreacion?: string;
    FechaCierre?: string;
    FechaInicio?: string;
    FechaFinal?: string;
    FechaPublicacion?: string;
    FechaAdjudicacion?: string;
  };
  Items?: { Cantidad?: number; Listado?: ItemApi[] };
  Adjudicacion?: { UrlActa?: string; Fecha?: string; NumeroOferentes?: number } | null;
};

export type RespuestaApi = { Cantidad?: number; Listado?: LicitacionApi[]; Codigo?: number; Mensaje?: string };

export type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export class ErrorApi extends Error {
  readonly status: number;
  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.status = status;
  }
}

/** Una consulta a licitaciones.json. Nunca expone el ticket en errores. */
export async function consultarLicitaciones(
  parametros: { codigo?: string; fecha?: string; estado?: string },
  opciones: { ticket: string; fetch?: Fetch; init?: RequestInit },
): Promise<LicitacionApi[]> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(parametros)) if (v) params.set(k, v);
  params.set("ticket", opciones.ticket);
  const f = opciones.fetch ?? fetch;
  const respuesta = await f(`${API_BASE}/licitaciones.json?${params}`, opciones.init);
  if (!respuesta.ok) throw new ErrorApi(`Mercado Público respondió ${respuesta.status}`, respuesta.status);
  const datos = (await respuesta.json()) as RespuestaApi;
  if (!Array.isArray(datos.Listado)) {
    throw new ErrorApi(`Respuesta sin listado${datos.Mensaje ? `: ${datos.Mensaje}` : ""}`, 502);
  }
  return datos.Listado;
}

// ─── Filas para la base de datos ───────────────────────────────────────────

export type FilaLicitacion = {
  codigo: string;
  nombre: string;
  codigo_estado: number | null;
  estado: string | null;
  descripcion: string | null;
  tipo: string | null;
  organismo_codigo: string | null;
  organismo_nombre: string | null;
  unidad_nombre: string | null;
  rut_unidad: string | null;
  region: string | null;
  comuna: string | null;
  monto_estimado: number | null;
  moneda: string | null;
  fecha_publicacion: Date | null;
  fecha_cierre: Date | null;
  fecha_adjudicacion: Date | null;
};

export type FilaItem = {
  correlativo: number;
  codigo_producto: string | null;
  codigo_categoria: string | null;
  categoria: string | null;
  nombre_producto: string | null;
  descripcion: string | null;
  cantidad: number | null;
  unidad: string | null;
  proveedor_rut: string | null;
  proveedor_nombre: string | null;
  cantidad_adjudicada: number | null;
  monto_unitario: number | null;
};

const texto = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};
const numero = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export function estadoTexto(codigo: number | null | undefined, respaldo?: string | null): string | null {
  return (codigo != null && ESTADOS[codigo]) || texto(respaldo);
}

/** Fila mínima a partir de un elemento del listado (sin `codigo`). */
export function filaBasica(l: LicitacionApi): Pick<FilaLicitacion, "codigo" | "nombre" | "codigo_estado" | "estado" | "fecha_cierre"> | null {
  const codigo = texto(l.CodigoExterno);
  if (!codigo) return null;
  const codigoEstado = numero(l.CodigoEstado);
  return {
    codigo,
    nombre: texto(l.Nombre) ?? codigo,
    codigo_estado: codigoEstado,
    estado: estadoTexto(codigoEstado, l.Estado),
    fecha_cierre: fechaMercadoPublico(l.FechaCierre ?? l.Fechas?.FechaCierre),
  };
}

/** Fila completa a partir del detalle (consulta con `codigo`). */
export function filaDetalle(l: LicitacionApi): { licitacion: FilaLicitacion; items: FilaItem[] } | null {
  const basica = filaBasica(l);
  if (!basica) return null;
  const c = l.Comprador ?? {};
  const f = l.Fechas ?? {};
  const licitacion: FilaLicitacion = {
    ...basica,
    fecha_cierre: fechaMercadoPublico(f.FechaCierre ?? l.FechaCierre),
    descripcion: texto(l.Descripcion),
    tipo: texto(l.Tipo),
    organismo_codigo: texto(c.CodigoOrganismo),
    organismo_nombre: texto(c.NombreOrganismo),
    unidad_nombre: texto(c.NombreUnidad),
    rut_unidad: texto(c.RutUnidad),
    region: texto(c.RegionUnidad),
    comuna: texto(c.ComunaUnidad),
    monto_estimado: numero(l.MontoEstimado),
    moneda: texto(l.Moneda),
    fecha_publicacion: fechaMercadoPublico(f.FechaPublicacion ?? f.FechaCreacion),
    fecha_adjudicacion: fechaMercadoPublico(f.FechaAdjudicacion),
  };
  const items: FilaItem[] = (l.Items?.Listado ?? []).map((i, indice) => ({
    correlativo: numero(i.Correlativo) ?? indice + 1,
    codigo_producto: texto(i.CodigoProducto),
    codigo_categoria: texto(i.CodigoCategoria),
    categoria: texto(i.Categoria),
    nombre_producto: texto(i.NombreProducto),
    descripcion: texto(i.Descripcion),
    cantidad: numero(i.Cantidad),
    unidad: texto(i.UnidadMedida),
    proveedor_rut: texto(i.Adjudicacion?.RutProveedor),
    proveedor_nombre: texto(i.Adjudicacion?.NombreProveedor),
    cantidad_adjudicada: numero(i.Adjudicacion?.Cantidad),
    monto_unitario: numero(i.Adjudicacion?.MontoUnitario),
  }));
  return { licitacion, items };
}
