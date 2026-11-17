// Datos de prueba con la forma de la API de Mercado Público (fechas sin zona,
// en hora de Chile, como las entrega la API).
import type { LicitacionApi } from "../lib/mercadoPublico.ts";

/** Fecha local de Chile "aaaa-mm-ddThh:mm:ss" desplazada `dias` desde ahora. */
export function fechaLocalChile(dias: number, base = new Date()): string {
  const d = new Date(base.getTime() + dias * 86400000);
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const v = (t: string) => p.find((x) => x.type === t)?.value;
  return `${v("year")}-${v("month")}-${v("day")}T${v("hour")}:${v("minute")}:${v("second")}`;
}

export function detalles(): Record<string, LicitacionApi> {
  return {
    "1234-56-LE26": {
      CodigoExterno: "1234-56-LE26",
      Nombre: "Servicio de aseo y limpieza de dependencias municipales",
      CodigoEstado: 5,
      Descripcion: "Contratación del servicio de aseo para edificios consistoriales.",
      Tipo: "LE",
      Moneda: "CLP",
      MontoEstimado: 11900000,
      Comprador: {
        CodigoOrganismo: "7001",
        NombreOrganismo: "Municipalidad de Concepción",
        RutUnidad: "69.150.400-K",
        NombreUnidad: "Dirección de Aseo",
        ComunaUnidad: "Concepción",
        RegionUnidad: "Región del Biobío",
      },
      Fechas: { FechaPublicacion: fechaLocalChile(-3), FechaCierre: fechaLocalChile(7), FechaAdjudicacion: fechaLocalChile(30) },
      Items: {
        Cantidad: 1,
        Listado: [
          {
            Correlativo: 1,
            CodigoProducto: 76111501,
            CodigoCategoria: "76111500",
            Categoria: "Servicios de limpieza, descontaminación y tratamiento de residuos / Servicios de aseo y limpieza",
            NombreProducto: "Servicios de limpieza de edificios",
            Descripcion: "Aseo diario",
            UnidadMedida: "Mes",
            Cantidad: 12,
          },
        ],
      },
    },
    "2222-10-LP26": {
      CodigoExterno: "2222-10-LP26",
      Nombre: "Construcción de sede social Villa Los Aromos",
      CodigoEstado: 5,
      Descripcion: "Obra menor con financiamiento FNDR.",
      Moneda: "CLP",
      MontoEstimado: 95000000,
      Comprador: { NombreOrganismo: "Municipalidad de Quilpué", ComunaUnidad: "Quilpué", RegionUnidad: "Región de Valparaíso" },
      Fechas: { FechaPublicacion: fechaLocalChile(-1), FechaCierre: fechaLocalChile(14) },
      Items: {
        Listado: [
          {
            Correlativo: 1,
            CodigoProducto: 72101500,
            Categoria: "Servicios de edificación, construcción de instalaciones y mantenimiento / Servicios de apoyo a la construcción",
            NombreProducto: "Construcción de edificios",
            Cantidad: 1,
          },
        ],
      },
    },
    "3333-5-L126": {
      CodigoExterno: "3333-5-L126",
      Nombre: "Adquisición de artículos de aseo",
      CodigoEstado: 6,
      Moneda: "CLP",
      MontoEstimado: 900000,
      Comprador: { NombreOrganismo: "Hospital Regional de Concepción", RegionUnidad: "Región del Biobío" },
      Fechas: { FechaPublicacion: fechaLocalChile(-20), FechaCierre: fechaLocalChile(-2) },
      Items: {
        Listado: [
          {
            Correlativo: 1,
            CodigoProducto: 47131700,
            Categoria: "Equipos de limpieza y suministros / Suministros de aseo",
            NombreProducto: "Detergente",
            Cantidad: 50,
            Adjudicacion: { RutProveedor: "76.000.000-1", NombreProveedor: "Limpiezas del Sur SpA", Cantidad: 50, MontoUnitario: 18000 },
          },
        ],
      },
    },
  };
}

/** Elemento del listado (pocos campos, como el listado real). */
export function itemListado(d: LicitacionApi): LicitacionApi {
  return { CodigoExterno: d.CodigoExterno, Nombre: d.Nombre, CodigoEstado: d.CodigoEstado, FechaCierre: d.Fechas?.FechaCierre };
}

/**
 * API falsa: responde `estado=activas` con `listado` y `codigo=X` con su
 * detalle. Registra cada URL y exige el ticket.
 */
export function apiFalsa(opciones: {
  listado: () => LicitacionApi[];
  detalles: () => Record<string, LicitacionApi>;
  fallarCon?: () => number | null;
}) {
  const llamadas: URL[] = [];
  const fetch = async (url: string): Promise<Response> => {
    const u = new URL(url);
    llamadas.push(u);
    if (u.searchParams.get("ticket") !== "ticket-de-prueba") return new Response("{}", { status: 401 });
    const fallo = opciones.fallarCon?.();
    if (fallo) return new Response("{}", { status: fallo });
    if (u.searchParams.get("estado") === "activas") {
      const listado = opciones.listado();
      return Response.json({ Cantidad: listado.length, Listado: listado });
    }
    const codigo = u.searchParams.get("codigo");
    const d = codigo ? opciones.detalles()[codigo] : undefined;
    return Response.json({ Cantidad: d ? 1 : 0, Listado: d ? [d] : [] });
  };
  return { fetch, llamadas };
}
