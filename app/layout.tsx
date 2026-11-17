import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { BotonTema } from "@/components/BotonTema";
import { URL_SITIO } from "@/lib/sitio";
import "./globals.css";

const ADSENSE = "ca-pub-1842499606253396";

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITIO),
  title: { default: "Mercado Eficiente · Licitaciones públicas de Chile gratis", template: "%s · Mercado Eficiente" },
  description:
    "Busca licitaciones públicas de Chile por palabra, región y rubro. Gratis y sin registro, con datos de Mercado Público (ChileCompra).",
  keywords: ["Mercado Público", "licitaciones", "ChileCompra", "compras públicas", "Chile"],
  authors: [{ name: "Dann LeBeau" }],
  icons: { icon: "/img/logo.png" },
  other: { "google-adsense-account": ADSENSE },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1b5e20" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1610" },
  ],
};

// Aplica el tema guardado antes de pintar (ver components/BotonTema.tsx).
const scriptTema = `try{var t=localStorage.getItem("tema");if(t==="claro")document.documentElement.dataset.theme="light";else if(t==="oscuro")document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CL" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
        <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE}`} crossOrigin="anonymous" />
      </head>
      <body>
        <header className="cabecera">
          <div className="contenedor">
            <Link href="/" className="marca">
              <img src="/img/logo.png" alt="" width={40} height={40} />
              <span>
                <span className="marca-titulo">Mercado Eficiente</span>
                <span className="marca-sub">by Geopolis</span>
              </span>
            </Link>
            <nav aria-label="Principal">
              <Link href="/acerca-de">Acerca de</Link>
              <BotonTema />
            </nav>
          </div>
        </header>
        <main className="contenedor">{children}</main>
        <footer className="pie">
          <div className="contenedor">
            <a href="https://www.geopolis.cl" target="_blank" rel="noopener">
              <img src="/img/dann-lebeau.png" alt="Geopolis" width={56} height={56} />
            </a>
            <p>
              Elaborado por Dann LeBeau · Mercado Eficiente by{" "}
              <a href="https://www.geopolis.cl" target="_blank" rel="noopener">Geopolis</a>
            </p>
            <p>
              Datos: Dirección ChileCompra (API pública de Mercado Público). Proyecto independiente, sin relación oficial con ChileCompra.
            </p>
            <p>
              © 2026 · <Link href="/acerca-de">Acerca de</Link> · <Link href="/privacidad">Política de Privacidad</Link> ·{" "}
              <a href="https://github.com/dannlebeau" target="_blank" rel="noopener">GitHub</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
