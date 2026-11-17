import type { Sql } from "./db.ts";

export const POR_PAGINA = 20;

export type Filtros = {
  q?: string;
  region?: string;
  rubro?: string;
  estado?: "abiertas" | "todas";
  montoMin?: number;
  montoMax?: number;
  orden?: "cierre" | "recientes" | "monto" | "relevancia";
  pagina?: number;
};

export type Resultado = {
  codigo: string;
  nombre: string;
  estado: string | null;
  organismo_nombre: string | null;
  region: string | null;
  monto_estimado: string | null;
  moneda: string | null;
  fecha_publicacion: Date | null;
  fecha_cierre: Date | null;
};

const numeroONulo = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(String(v).replace(/\./g, ""));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

const uno = (v: string | string[] | undefined): string | undefined => {
  const s = Array.isArray(v) ? v[0] : v;
  const t = s?.trim();
  return t ? t.slice(0, 200) : undefined;
};

/** Lee los filtros desde los parámetros de la URL, descartando valores inválidos. */
export function filtrosDesdeUrl(p: Record<string, string | string[] | undefined>): Filtros {
  const estado = uno(p.estado) === "todas" ? "todas" : "abiertas";
  const ordenes = ["cierre", "recientes", "monto", "relevancia"] as const;
  const orden = ordenes.find((o) => o === uno(p.orden));
  const rubro = uno(p.rubro);
  const pagina = Math.max(1, Math.min(500, Math.floor(Number(uno(p.pagina)) || 1)));
  return {
    q: uno(p.q),
    region: uno(p.region),
    rubro: rubro && /^\d{2}$/.test(rubro) ? rubro : undefined,
    estado,
    montoMin: numeroONulo(uno(p.montoMin)),
    montoMax: numeroONulo(uno(p.montoMax)),
    orden,
    pagina,
  };
}

export async function buscar(sql: Sql, f: Filtros): Promise<{ filas: Resultado[]; total: number }> {
  const q = f.q?.trim();
  const condiciones = [
    q ? sql`l.busqueda @@ websearch_to_tsquery('es_sin_tildes', ${q})` : null,
    f.region ? sql`l.region = ${f.region}` : null,
    f.rubro
      ? sql`exists (select 1 from items i where i.codigo_licitacion = l.codigo and left(i.codigo_producto, 2) = ${f.rubro})`
      : null,
    f.estado !== "todas" ? sql`l.codigo_estado = 5 and (l.fecha_cierre is null or l.fecha_cierre > now())` : null,
    f.montoMin !== undefined ? sql`l.monto_estimado >= ${f.montoMin}` : null,
    f.montoMax !== undefined ? sql`l.monto_estimado <= ${f.montoMax}` : null,
  ].filter((c) => c !== null);

  const where = condiciones.reduce((acc, c, i) => (i === 0 ? sql`where ${c}` : sql`${acc} and ${c}`), sql``);
  const orden = f.orden ?? (q ? "relevancia" : "cierre");
  const orderBy =
    orden === "relevancia" && q
      ? sql`ts_rank(l.busqueda, websearch_to_tsquery('es_sin_tildes', ${q})) desc, l.fecha_cierre asc nulls last`
      : orden === "recientes"
        ? sql`l.fecha_publicacion desc nulls last`
        : orden === "monto"
          ? sql`l.monto_estimado desc nulls last`
          : sql`l.fecha_cierre asc nulls last`;
  const pagina = f.pagina ?? 1;

  const [filas, [{ total }]] = await Promise.all([
    sql<Resultado[]>`
      select l.codigo, l.nombre, l.estado, l.organismo_nombre, l.region,
             l.monto_estimado::text as monto_estimado, l.moneda, l.fecha_publicacion, l.fecha_cierre
      from licitaciones l ${where}
      order by ${orderBy}, l.codigo
      limit ${POR_PAGINA} offset ${(pagina - 1) * POR_PAGINA}`,
    sql<{ total: number }[]>`select count(*)::int as total from licitaciones l ${where}`,
  ]);
  return { filas, total };
}

export type Opcion = { valor: string; etiqueta: string; cantidad: number };

/** Regiones y rubros con licitaciones, para los selectores del buscador. */
export async function opcionesFiltros(sql: Sql): Promise<{ regiones: Opcion[]; rubros: Opcion[] }> {
  const [regiones, rubros] = await Promise.all([
    sql<Opcion[]>`
      select region as valor, region as etiqueta, count(*)::int as cantidad
      from licitaciones where region is not null
      group by region order by region`,
    sql<Opcion[]>`
      select left(codigo_producto, 2) as valor,
             mode() within group (order by trim(split_part(categoria, '/', 1))) as etiqueta,
             count(distinct codigo_licitacion)::int as cantidad
      from items
      where codigo_producto ~ '^[0-9]{2}' and categoria is not null
      group by 1 order by etiqueta`,
  ]);
  return { regiones, rubros };
}

export type LicitacionGuardada = {
  codigo: string;
  nombre: string;
  estado: string | null;
  codigo_estado: number | null;
  detalle: unknown;
  fecha_cierre: Date | null;
  actualizado_en: Date;
};

export async function obtenerLicitacion(sql: Sql, codigo: string): Promise<LicitacionGuardada | null> {
  const [fila] = await sql<LicitacionGuardada[]>`
    select codigo, nombre, estado, codigo_estado, detalle, fecha_cierre, actualizado_en
    from licitaciones where codigo = ${codigo}`;
  return fila ?? null;
}

/** Códigos para el sitemap (las más recientes primero). */
export async function codigosParaSitemap(sql: Sql, limite = 45000): Promise<{ codigo: string; actualizado_en: Date }[]> {
  return sql<{ codigo: string; actualizado_en: Date }[]>`
    select codigo, actualizado_en from licitaciones
    where detalle is not null
    order by fecha_publicacion desc nulls last
    limit ${limite}`;
}
