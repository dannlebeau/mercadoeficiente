import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cronometro } from "@/components/Cronometro";
import { RecordatorioIcs } from "@/components/RecordatorioIcs";
import { fechaMercadoPublico, formatearFechaChile } from "@/lib/fechas";
import { obtenerFicha } from "@/lib/ficha";
import { urlMercadoPublico } from "@/lib/ics";
import { estadoTexto, UNIDADES_TIEMPO } from "@/lib/mercadoPublico";
import { desglosarIva, formatearMonto } from "@/lib/montos";

export const revalidate = 900;

type Props = { params: Promise<{ codigo: string }> };

async function codigoDe(props: Props): Promise<string> {
  return decodeURIComponent((await props.params).codigo).trim().toUpperCase();
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const codigo = await codigoDe(props);
  const ficha = await obtenerFicha(codigo).catch(() => null);
  if (!ficha) return { title: `Licitación ${codigo}`, robots: { index: false } };
  const d = ficha.detalle;
  const organismo = d.Comprador?.NombreOrganismo;
  const cierre = fechaMercadoPublico(d.Fechas?.FechaCierre);
  const descripcion = [
    `Licitación ${codigo}${organismo ? ` de ${organismo}` : ""}.`,
    cierre ? `Cierre: ${formatearFechaChile(cierre)}.` : "",
    d.Descripcion?.slice(0, 120) ?? "",
  ].join(" ").trim();
  return {
    title: d.Nombre ?? `Licitación ${codigo}`,
    description: descripcion,
    alternates: { canonical: `/licitacion/${encodeURIComponent(codigo)}` },
    openGraph: { title: d.Nombre ?? codigo, description: descripcion, type: "article" },
  };
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <>
      <dt>{etiqueta}</dt>
      <dd>{children}</dd>
    </>
  );
}

export default async function FichaLicitacion(props: Props) {
  const codigo = await codigoDe(props);
  const ficha = await obtenerFicha(codigo);
  if (!ficha) notFound();

  const d = ficha.detalle;
  const c = d.Comprador ?? {};
  const f = d.Fechas ?? {};
  const moneda = d.Moneda ?? "CLP";
  const { total, iva, neto } = desglosarIva(d.MontoEstimado);
  const cierre = fechaMercadoPublico(f.FechaCierre);
  const estado = estadoTexto(d.CodigoEstado, d.Estado) ?? "Sin estado";
  const items = d.Items?.Listado ?? [];
  const adjudicados = items.filter((i) => i.Adjudicacion?.NombreProveedor);
  const duracion = d.TiempoDuracionContrato
    ? `${d.TiempoDuracionContrato} ${UNIDADES_TIEMPO[d.UnidadTiempoDuracionContrato ?? 0] ?? ""}`.trim()
    : null;

  return (
    <article>
      <nav className="migas" aria-label="Ruta">
        <Link href="/">Buscador</Link> › {codigo}
      </nav>
      <h1>{d.Nombre ?? codigo}</h1>
      <p className="meta" style={{ marginBottom: 20 }}>
        <span className="etiqueta">{estado}</span>
        <span>{codigo}</span>
        {c.NombreOrganismo && <span>{c.NombreOrganismo}</span>}
        {c.RegionUnidad && <span>{c.RegionUnidad}</span>}
      </p>

      <div className="ficha-grid">
        <div>
          <section className="tarjeta">
            <h2>Información general</h2>
            {d.Descripcion && <p style={{ whiteSpace: "pre-line" }}>{d.Descripcion}</p>}
            <dl className="datos">
              <Dato etiqueta="Organismo">{c.NombreOrganismo}</Dato>
              <Dato etiqueta="Unidad compradora">{c.NombreUnidad}</Dato>
              <Dato etiqueta="RUT unidad">{c.RutUnidad}</Dato>
              <Dato etiqueta="Dirección">{c.DireccionUnidad}</Dato>
              <Dato etiqueta="Comuna">{c.ComunaUnidad}</Dato>
              <Dato etiqueta="Región">{c.RegionUnidad}</Dato>
              <Dato etiqueta="Tipo">{d.Tipo}</Dato>
              <Dato etiqueta="Financiamiento">{d.FuenteFinanciamiento}</Dato>
              <Dato etiqueta="Duración del contrato">{duracion}</Dato>
            </dl>
          </section>

          <section className="tarjeta">
            <h2>Monto estimado</h2>
            {d.MontoEstimado ? (
              <dl className="datos">
                <Dato etiqueta="Total">{formatearMonto(total, moneda)}</Dato>
                {moneda === "CLP" && <Dato etiqueta="Neto (referencial)">{formatearMonto(neto)}</Dato>}
                {moneda === "CLP" && <Dato etiqueta="IVA 19% (referencial)">{formatearMonto(iva)}</Dato>}
              </dl>
            ) : (
              <p>El organismo no informó un monto estimado.</p>
            )}
            <p style={{ fontSize: "0.85rem", color: "var(--texto-suave)", marginBottom: 0 }}>
              El neto y el IVA son un cálculo referencial (total / 1,19), no un valor oficial.
            </p>
          </section>

          <section className="tarjeta">
            <h2>Fechas clave</h2>
            <dl className="datos">
              <Dato etiqueta="Publicación">{formatearFechaChile(fechaMercadoPublico(f.FechaPublicacion))}</Dato>
              <Dato etiqueta="Inicio de preguntas">{formatearFechaChile(fechaMercadoPublico(f.FechaInicio))}</Dato>
              <Dato etiqueta="Fin de preguntas">{formatearFechaChile(fechaMercadoPublico(f.FechaFinal))}</Dato>
              <Dato etiqueta="Cierre de ofertas">{formatearFechaChile(cierre)}</Dato>
              <Dato etiqueta="Adjudicación (estimada)">{formatearFechaChile(fechaMercadoPublico(f.FechaAdjudicacion))}</Dato>
            </dl>
          </section>

          {items.length > 0 && (
            <section className="tarjeta">
              <h2>Productos y servicios ({items.length})</h2>
              <div className="tabla-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Producto</th>
                      <th scope="col">Cantidad</th>
                      <th scope="col">Adjudicado a</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i, n) => (
                      <tr key={`${i.Correlativo ?? n}`}>
                        <td>
                          {i.NombreProducto ?? "—"}
                          {i.Descripcion && <div style={{ color: "var(--texto-suave)", fontSize: "0.85rem" }}>{i.Descripcion}</div>}
                        </td>
                        <td>{i.Cantidad ?? "—"} {i.UnidadMedida ?? ""}</td>
                        <td>
                          {i.Adjudicacion?.NombreProveedor ? (
                            <>
                              {i.Adjudicacion.NombreProveedor}
                              <div style={{ fontSize: "0.85rem", color: "var(--texto-suave)" }}>
                                RUT {i.Adjudicacion.RutProveedor} · {i.Adjudicacion.Cantidad} ×{" "}
                                {formatearMonto(Number(i.Adjudicacion.MontoUnitario) || 0, moneda)}
                              </div>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {adjudicados.length > 0 && /^https?:\/\//i.test(d.Adjudicacion?.UrlActa ?? "") && (
                <p style={{ marginBottom: 0 }}>
                  <a href={d.Adjudicacion?.UrlActa} target="_blank" rel="noopener noreferrer">Ver acta de adjudicación</a>
                </p>
              )}
            </section>
          )}
        </div>

        <aside>
          <section className="tarjeta">
            <h2>Cierre de ofertas</h2>
            <p style={{ marginTop: 0 }}>{formatearFechaChile(cierre)}</p>
            {cierre && <Cronometro cierreIso={cierre.toISOString()} />}
          </section>
          {cierre && cierre.getTime() > Date.now() && (
            <section className="tarjeta">
              <h2>Alerta de cierre</h2>
              <RecordatorioIcs codigo={codigo} nombre={d.Nombre ?? codigo} organismo={c.NombreOrganismo ?? null} cierreIso={cierre.toISOString()} />
            </section>
          )}
          <section className="tarjeta">
            <h2>Postular</h2>
            <p style={{ marginTop: 0 }}>Las bases, preguntas y ofertas se gestionan en el sitio oficial.</p>
            <a className="boton" href={urlMercadoPublico(codigo)} target="_blank" rel="noopener noreferrer">
              Ver en Mercado Público
            </a>
          </section>
          <p style={{ fontSize: "0.8rem", color: "var(--texto-suave)" }}>
            Fuente: Dirección ChileCompra. Actualizado {formatearFechaChile(ficha.actualizado)}.
          </p>
        </aside>
      </div>
    </article>
  );
}
