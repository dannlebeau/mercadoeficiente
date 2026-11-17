// Ingesta incremental desde la API de Mercado Público hacia Postgres.
//
// Cuota: el ticket permite 10.000 consultas al día (https://www.chilecompra.cl/api/)
// y el detalle exige una consulta por código. Cada corrida:
//   1. Una consulta al listado de activas → inserta las nuevas y marca para
//      refrescar las que cambiaron de estado o salieron del listado.
//   2. Pide el detalle de las pendientes por prioridad (nunca detalladas y
//      cierre más próximo primero), sin pasar el presupuesto de la corrida
//      ni el límite diario registrado en `consultas_api`.
import type { Sql } from "./db.ts";
import { diaChile } from "./fechas.ts";
import {
  consultarLicitaciones,
  ErrorApi,
  filaBasica,
  filaDetalle,
  type Fetch,
  type LicitacionApi,
} from "./mercadoPublico.ts";

export type OpcionesIngesta = {
  sql: Sql;
  ticket: string;
  fetch?: Fetch;
  /** Consultas máximas en esta corrida (incluye la del listado). */
  presupuesto?: number;
  /** Tope diario propio; deja margen bajo las 10.000 del ticket para la web. */
  limiteDiario?: number;
  /** Pausa entre consultas de detalle, para no saturar la API. */
  pausaMs?: number;
  /** Errores seguidos tras los que se corta la corrida. */
  maxErroresSeguidos?: number;
  ahora?: () => Date;
  log?: (mensaje: string) => void;
};

export type ResumenIngesta = {
  consultas: number;
  enListado: number;
  nuevas: number;
  detalladas: number;
  errores: number;
  cortadaPor: string | null;
};

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function consultasUsadasHoy(sql: Sql, ahora: Date): Promise<number> {
  const [fila] = await sql<{ usadas: number }[]>`select usadas from consultas_api where dia = ${diaChile(ahora)}::date`;
  return fila?.usadas ?? 0;
}

async function registrarConsultas(sql: Sql, ahora: Date, cantidad: number): Promise<void> {
  if (cantidad <= 0) return;
  await sql`
    insert into consultas_api (dia, usadas) values (${diaChile(ahora)}::date, ${cantidad})
    on conflict (dia) do update set usadas = consultas_api.usadas + excluded.usadas`;
}

/** Inserta o actualiza el listado de activas. Devuelve cuántas eran nuevas. */
export async function guardarListado(sql: Sql, listado: LicitacionApi[], inicio: Date): Promise<number> {
  const filas = listado.map(filaBasica).filter((f) => f !== null);
  // La API puede repetir un código en el listado; se deja el último.
  const porCodigo = new Map(filas.map((f) => [f.codigo, f]));
  let nuevas = 0;
  const lista = [...porCodigo.values()].map((f) => ({ ...f, visto_en_listado: inicio }));
  for (let i = 0; i < lista.length; i += 500) {
    const lote = lista.slice(i, i + 500);
    const resultado = await sql<{ insertada: boolean }[]>`
      insert into licitaciones ${sql(lote, "codigo", "nombre", "codigo_estado", "estado", "fecha_cierre", "visto_en_listado")}
      on conflict (codigo) do update set
        nombre = excluded.nombre,
        estado = excluded.estado,
        codigo_estado = excluded.codigo_estado,
        fecha_cierre = coalesce(excluded.fecha_cierre, licitaciones.fecha_cierre),
        visto_en_listado = excluded.visto_en_listado,
        -- Cambio de estado: se vuelve a pedir el detalle.
        detalle_en = case
          when licitaciones.codigo_estado is distinct from excluded.codigo_estado then null
          else licitaciones.detalle_en end,
        actualizado_en = now()
      returning (xmax = 0) as insertada`;
    nuevas += resultado.filter((r) => r.insertada).length;
  }
  // Las que estaban publicadas y ya no aparecen cerraron o cambiaron: refrescar.
  await sql`
    update licitaciones set detalle_en = null
    where codigo_estado = 5 and detalle_en is not null
      and (visto_en_listado is null or visto_en_listado < ${inicio}::timestamptz)`;
  return nuevas;
}

/** Guarda el detalle completo y reemplaza sus ítems. */
export async function guardarDetalle(sql: Sql, detalle: LicitacionApi, ahora: Date): Promise<boolean> {
  const fila = filaDetalle(detalle);
  if (!fila) return false;
  const l = fila.licitacion;
  await sql.begin(async (tx) => {
    await tx`
      insert into licitaciones ${tx({ ...l, detalle: tx.json(detalle as never), detalle_en: ahora, actualizado_en: ahora })}
      on conflict (codigo) do update set
        nombre = excluded.nombre,
        codigo_estado = excluded.codigo_estado,
        estado = excluded.estado,
        descripcion = excluded.descripcion,
        tipo = excluded.tipo,
        organismo_codigo = excluded.organismo_codigo,
        organismo_nombre = excluded.organismo_nombre,
        unidad_nombre = excluded.unidad_nombre,
        rut_unidad = excluded.rut_unidad,
        region = excluded.region,
        comuna = excluded.comuna,
        monto_estimado = excluded.monto_estimado,
        moneda = excluded.moneda,
        fecha_publicacion = excluded.fecha_publicacion,
        fecha_cierre = excluded.fecha_cierre,
        fecha_adjudicacion = excluded.fecha_adjudicacion,
        detalle = excluded.detalle,
        detalle_en = excluded.detalle_en,
        actualizado_en = excluded.actualizado_en`;
    await tx`delete from items where codigo_licitacion = ${l.codigo}`;
    if (fila.items.length) {
      const items = fila.items.map((i) => ({ ...i, codigo_licitacion: l.codigo }));
      // Correlativos repetidos rompen la clave: se deja el último.
      const unicos = [...new Map(items.map((i) => [i.correlativo, i])).values()];
      await tx`insert into items ${tx(unicos)}`;
    }
  });
  return true;
}

export async function ejecutarIngesta(opciones: OpcionesIngesta): Promise<ResumenIngesta> {
  const {
    sql,
    ticket,
    presupuesto = 300,
    limiteDiario = 8000,
    pausaMs = 400,
    maxErroresSeguidos = 5,
  } = opciones;
  const ahora = opciones.ahora ?? (() => new Date());
  const log = opciones.log ?? (() => {});
  const resumen: ResumenIngesta = { consultas: 0, enListado: 0, nuevas: 0, detalladas: 0, errores: 0, cortadaPor: null };

  const inicio = ahora();
  const disponibles = Math.min(presupuesto, limiteDiario - (await consultasUsadasHoy(sql, inicio)));
  if (disponibles <= 0) {
    resumen.cortadaPor = "límite diario alcanzado";
    return resumen;
  }

  const consultar = async (parametros: { codigo?: string; estado?: string }) => {
    resumen.consultas++;
    return consultarLicitaciones(parametros, { ticket, fetch: opciones.fetch });
  };

  try {
    const listado = await consultar({ estado: "activas" });
    resumen.enListado = listado.length;
    resumen.nuevas = await guardarListado(sql, listado, inicio);
    log(`Listado: ${listado.length} activas, ${resumen.nuevas} nuevas.`);

    const pendientes = await sql<{ codigo: string }[]>`
      select codigo from licitaciones
      where detalle_en is null
         or (codigo_estado = 5 and detalle_en < ${inicio}::timestamptz - interval '24 hours')
      order by detalle_en nulls first, fecha_cierre asc nulls last
      limit ${disponibles - resumen.consultas}`;

    let seguidos = 0;
    for (const { codigo } of pendientes) {
      if (resumen.consultas >= disponibles) break;
      if (resumen.consultas > 1 && pausaMs > 0) await esperar(pausaMs);
      try {
        const [detalle] = await consultar({ codigo });
        if (detalle && (await guardarDetalle(sql, detalle, ahora()))) {
          resumen.detalladas++;
        } else {
          // La API no devolvió nada útil: no reintentar en cada corrida.
          await sql`update licitaciones set detalle_en = ${ahora()}::timestamptz where codigo = ${codigo}`;
        }
        seguidos = 0;
      } catch (error) {
        resumen.errores++;
        seguidos++;
        const mensaje = error instanceof Error ? error.message : String(error);
        log(`Error en ${codigo}: ${mensaje}`);
        // Límite o caída de la API: cortar en vez de seguir gastando cuota.
        if (error instanceof ErrorApi && (error.status === 429 || error.status >= 500)) {
          resumen.cortadaPor = mensaje;
          break;
        }
        if (seguidos >= maxErroresSeguidos) {
          resumen.cortadaPor = `${seguidos} errores seguidos`;
          break;
        }
      }
    }
  } finally {
    await registrarConsultas(sql, inicio, resumen.consultas);
  }
  return resumen;
}
