import Link from "next/link";
import { redirect } from "next/navigation";
import { buscar, filtrosDesdeUrl, opcionesFiltros, POR_PAGINA, type Filtros, type Resultado } from "@/lib/busqueda";
import { db, hayBase } from "@/lib/db";
import { formatearFechaChile } from "@/lib/fechas";
import { PATRON_CODIGO } from "@/lib/ficha";
import { formatearMonto } from "@/lib/montos";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function urlConFiltros(f: Filtros, cambios: Partial<Filtros>): string {
  const p = new URLSearchParams();
  const todo = { ...f, ...cambios };
  if (todo.q) p.set("q", todo.q);
  if (todo.region) p.set("region", todo.region);
  if (todo.rubro) p.set("rubro", todo.rubro);
  if (todo.estado === "todas") p.set("estado", "todas");
  if (todo.montoMin !== undefined) p.set("montoMin", String(todo.montoMin));
  if (todo.montoMax !== undefined) p.set("montoMax", String(todo.montoMax));
  if (todo.orden) p.set("orden", todo.orden);
  if (todo.pagina && todo.pagina > 1) p.set("pagina", String(todo.pagina));
  const qs = p.toString();
  return qs ? `/?${qs}` : "/";
}

export default async function Inicio({ searchParams }: Props) {
  const filtros = filtrosDesdeUrl(await searchParams);
  if (filtros.q && PATRON_CODIGO.test(filtros.q)) redirect(`/licitacion/${encodeURIComponent(filtros.q.toUpperCase())}`);

  let resultados: { filas: Resultado[]; total: number } | null = null;
  let opciones: Awaited<ReturnType<typeof opcionesFiltros>> = { regiones: [], rubros: [] };
  let errorBase = false;
  if (hayBase()) {
    try {
      [resultados, opciones] = await Promise.all([buscar(db(), filtros), opcionesFiltros(db())]);
    } catch (error) {
      console.error("Error consultando la base:", error instanceof Error ? error.message : error);
      errorBase = true;
    }
  }

  const pagina = filtros.pagina ?? 1;
  const totalPaginas = resultados ? Math.max(1, Math.ceil(resultados.total / POR_PAGINA)) : 1;

  return (
    <>
      <h1>Licitaciones públicas de Chile, gratis</h1>
      <p className="intro">
        Busca por palabra, región, rubro o monto entre las licitaciones de Mercado Público. Sin registro y sin planes de pago.
        Si ya tienes el código (ej. 4547-54-LR24), escríbelo y vas directo a su ficha.
      </p>

      <section className="tarjeta" aria-labelledby="titulo-buscador">
        <h2 id="titulo-buscador">Buscar</h2>
        <form className="buscador" method="get" action="/" role="search">
          <div className="campo campo-q">
            <label htmlFor="q">Qué buscas o código de licitación</label>
            <input id="q" name="q" type="search" defaultValue={filtros.q} placeholder="Ej: aseo, áreas verdes, 4547-54-LR24" maxLength={200} />
          </div>
          <div className="campo">
            <label htmlFor="region">Región</label>
            <select id="region" name="region" defaultValue={filtros.region ?? ""}>
              <option value="">Todas</option>
              {opciones.regiones.map((r) => (
                <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="rubro">Rubro</label>
            <select id="rubro" name="rubro" defaultValue={filtros.rubro ?? ""}>
              <option value="">Todos</option>
              {opciones.rubros.map((r) => (
                <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="estado">Estado</label>
            <select id="estado" name="estado" defaultValue={filtros.estado}>
              <option value="abiertas">Abiertas a ofertas</option>
              <option value="todas">Todas</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="montoMin">Monto mínimo ($)</label>
            <input id="montoMin" name="montoMin" inputMode="numeric" defaultValue={filtros.montoMin} placeholder="0" />
          </div>
          <div className="campo">
            <label htmlFor="orden">Ordenar por</label>
            <select id="orden" name="orden" defaultValue={filtros.orden ?? ""}>
              <option value="">Recomendado</option>
              <option value="cierre">Cierre más próximo</option>
              <option value="recientes">Más recientes</option>
              <option value="monto">Mayor monto</option>
            </select>
          </div>
          <button className="boton" type="submit">Buscar</button>
        </form>
      </section>

      {!hayBase() || errorBase ? (
        <div className="aviso" role="status">
          {errorBase
            ? "El buscador no está disponible en este momento. Puedes seguir buscando por código de licitación."
            : "El buscador por palabra se está cargando con datos. Mientras tanto, busca por código de licitación."}
        </div>
      ) : resultados ? (
        <section aria-labelledby="titulo-resultados">
          <h2 id="titulo-resultados" className="resumen-resultados">
            {resultados.total.toLocaleString("es-CL")} licitaci{resultados.total === 1 ? "ón" : "ones"}
            {filtros.estado !== "todas" ? " abiertas" : ""}
            {resultados.total > POR_PAGINA ? ` · página ${pagina} de ${totalPaginas}` : ""}
          </h2>
          {resultados.filas.length === 0 ? (
            <p>No hay resultados. Prueba con otras palabras, quita filtros o elige “Todas” en Estado.</p>
          ) : (
            <ul className="lista-resultados">
              {resultados.filas.map((l) => (
                <li key={l.codigo} className="resultado">
                  <h3>
                    <Link href={`/licitacion/${encodeURIComponent(l.codigo)}`}>{l.nombre}</Link>
                  </h3>
                  <p className="meta">
                    <span className="etiqueta">{l.estado ?? "Sin estado"}</span>
                    <span>{l.codigo}</span>
                    {l.organismo_nombre && <span>{l.organismo_nombre}</span>}
                    {l.region && <span>{l.region}</span>}
                    <span>Monto: {formatearMonto(l.monto_estimado === null ? null : Number(l.monto_estimado), l.moneda ?? "CLP")}</span>
                    <span>Cierre: {formatearFechaChile(l.fecha_cierre)}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
          {totalPaginas > 1 && (
            <nav className="paginacion" aria-label="Páginas de resultados">
              {pagina > 1 ? <Link className="boton boton-secundario" href={urlConFiltros(filtros, { pagina: pagina - 1 })}>← Anterior</Link> : <span />}
              {pagina < totalPaginas ? <Link className="boton boton-secundario" href={urlConFiltros(filtros, { pagina: pagina + 1 })}>Siguiente →</Link> : <span />}
            </nav>
          )}
        </section>
      ) : null}

      <section className="tarjeta" style={{ marginTop: 32 }}>
        <h2>¿Cómo funciona una licitación pública en Chile?</h2>
        <p>
          Cuando un organismo del Estado necesita comprar bienes o contratar servicios sobre cierto monto, debe hacerlo mediante una
          licitación pública en <a href="https://www.mercadopublico.cl" target="_blank" rel="noopener">mercadopublico.cl</a>, la plataforma
          oficial de ChileCompra. Cada proceso tiene un código único y pasa, en general, por las mismas etapas:
        </p>
        <ul>
          <li><strong>Publicación:</strong> el organismo publica las bases y el llamado a ofertar.</li>
          <li><strong>Preguntas y respuestas:</strong> los proveedores piden aclaraciones dentro del plazo fijado en las bases.</li>
          <li><strong>Cierre de ofertas:</strong> fecha y hora límite para presentar una oferta.</li>
          <li><strong>Adjudicación:</strong> el organismo evalúa las ofertas y publica a qué proveedor se adjudica el contrato.</li>
        </ul>
        <h3>Glosario básico</h3>
        <ul>
          <li><strong>Código de licitación:</strong> identificador único con formato <code>NNNN-NN-XXNN</code> (por ejemplo <code>4547-54-LR24</code>).</li>
          <li><strong>Monto estimado:</strong> presupuesto referencial que informa el organismo antes de recibir ofertas; no es necesariamente el monto adjudicado.</li>
          <li><strong>Rubro:</strong> categoría del producto o servicio según el clasificador UNSPSC que usa Mercado Público.</li>
          <li><strong>Estado:</strong> etapa del proceso: publicada, cerrada, adjudicada, desierta, revocada o suspendida.</li>
          <li><strong>Adjudicación:</strong> resolución que asigna el contrato a uno o más proveedores y por qué monto.</li>
        </ul>
      </section>
    </>
  );
}
