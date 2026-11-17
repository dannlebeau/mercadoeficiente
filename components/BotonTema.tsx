"use client";

import { useEffect, useState } from "react";

// Selector de tema Sistema → Claro → Oscuro, guardado en localStorage y
// aplicado en <html data-theme>. El script de app/layout.tsx lo aplica antes
// de pintar para evitar el parpadeo.
type Tema = "sistema" | "claro" | "oscuro";
const ORDEN: Tema[] = ["sistema", "claro", "oscuro"];
const NOMBRE: Record<Tema, string> = { sistema: "Sistema", claro: "Claro", oscuro: "Oscuro" };
const CLAVE = "tema";

function aplicar(tema: Tema) {
  const raiz = document.documentElement;
  if (tema === "sistema") delete raiz.dataset.theme;
  else raiz.dataset.theme = tema === "claro" ? "light" : "dark";
}

function leer(): Tema {
  try {
    const t = localStorage.getItem(CLAVE);
    return t === "claro" || t === "oscuro" ? t : "sistema";
  } catch {
    return "sistema";
  }
}

export function BotonTema() {
  const [tema, setTema] = useState<Tema>("sistema");
  useEffect(() => setTema(leer()), []);

  const siguiente = ORDEN[(ORDEN.indexOf(tema) + 1) % ORDEN.length];

  function cambiar() {
    setTema(siguiente);
    aplicar(siguiente);
    try {
      if (siguiente === "sistema") localStorage.removeItem(CLAVE);
      else localStorage.setItem(CLAVE, siguiente);
    } catch {
      // Sin almacenamiento (modo privado): el tema vale solo para esta visita.
    }
  }

  const etiqueta = `Tema: ${NOMBRE[tema]}. Cambiar a ${NOMBRE[siguiente]}`;
  return (
    <button type="button" className="boton-tema" onClick={cambiar} aria-label={etiqueta} title={etiqueta}>
      {tema === "sistema" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      ) : tema === "claro" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
