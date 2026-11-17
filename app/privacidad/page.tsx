import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Qué datos recopila Mercado Eficiente y cómo se usan.",
};

export default function Privacidad() {
  return (
    <section className="tarjeta">
      <h1>Política de Privacidad</h1>
      <p><em>Última actualización: noviembre de 2026.</em></p>

      <h2>¿Qué es Mercado Eficiente?</h2>
      <p>
        Mercado Eficiente (mercadoeficiente.cl) es una plataforma de Geopolis Consultores para consultar licitaciones públicas de Chile con
        datos de la API pública de Mercado Público (ChileCompra). Esta política explica qué datos recopilamos y cómo se usan.
      </p>

      <h2>Datos que recopilamos</h2>
      <ul>
        <li>
          <strong>Búsquedas:</strong> las palabras y filtros que usas viajan en la dirección de la página para mostrarte resultados. No las
          asociamos a tu identidad. Nuestro proveedor de hosting (Vercel) puede registrar de forma técnica las solicitudes (dirección IP,
          página pedida) por seguridad y operación.
        </li>
        <li>
          <strong>Alertas de cierre:</strong> el archivo de calendario (.ics) se genera en tu navegador. No pedimos ni guardamos tu correo.
        </li>
        <li>
          <strong>Preferencia de tema:</strong> si eliges tema claro u oscuro, se guarda solo en tu navegador (localStorage).
        </li>
        <li>
          <strong>Datos de navegación de terceros:</strong> los anunciantes (ver abajo) pueden recopilar datos técnicos de tu visita (tipo de
          navegador, dispositivo, páginas vistas) con fines de publicidad y analítica.
        </li>
      </ul>

      <h2>Publicidad — Google AdSense</h2>
      <p>
        Este sitio muestra anuncios de Google AdSense. Google, como proveedor externo, usa cookies para mostrar anuncios en base a visitas
        anteriores a este u otros sitios. Puedes inhabilitar la publicidad personalizada en la{" "}
        <a href="https://adssettings.google.com" target="_blank" rel="noopener">Configuración de anuncios de Google</a> o, para terceros en
        general, en <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener">www.aboutads.info</a>.
      </p>

      <h2>Independencia</h2>
      <p>
        Mercado Eficiente es un proyecto independiente, no afiliado ni respaldado por ChileCompra ni Mercado Público. Los datos de licitaciones
        provienen de su API pública oficial.
      </p>

      <h2>Contacto</h2>
      <p style={{ marginBottom: 0 }}>
        Para consultas sobre esta política o tus datos, contáctanos a través de{" "}
        <a href="https://www.geopolis.cl" target="_blank" rel="noopener">Geopolis Consultores</a>.
      </p>
    </section>
  );
}
