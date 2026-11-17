import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acerca de",
  description: "Qué es Mercado Eficiente, de dónde salen los datos y por qué es gratis.",
};

export default function AcercaDe() {
  return (
    <section className="tarjeta">
      <h1>Acerca de Mercado Eficiente</h1>
      <p>
        Mercado Eficiente es una plataforma gratuita de Geopolis Consultores para encontrar licitaciones públicas de Chile: buscas por
        palabra, región, rubro o monto, y cada licitación tiene su ficha con el organismo comprador, las fechas clave, el desglose del
        monto, los productos y, cuando existe, el resultado de la adjudicación.
      </p>
      <h2>Por qué es gratis</h2>
      <p>
        La información de las compras públicas es pública. Creemos que cualquier pyme, emprendedor o persona debería poder encontrarla sin
        pagar una suscripción. El sitio se financia con publicidad y no tiene planes de pago.
      </p>
      <h2>De dónde salen los datos</h2>
      <p>
        Los datos provienen de la Dirección ChileCompra, a través de la{" "}
        <a href="https://www.chilecompra.cl/api/" target="_blank" rel="noopener">API pública de Mercado Público</a>, y se actualizan varias
        veces al día. Mercado Eficiente es un proyecto independiente: no está afiliado, patrocinado ni respaldado por ChileCompra. Para
        ofertar, revisar bases o hacer reclamos, usa siempre{" "}
        <a href="https://www.mercadopublico.cl" target="_blank" rel="noopener">mercadopublico.cl</a>.
      </p>
      <p style={{ marginBottom: 0 }}>
        El monto neto y el IVA mostrados son un cálculo referencial (monto estimado / 1,19), no un valor oficial ni vinculante.
      </p>
    </section>
  );
}
