"use client";

import { useEffect, useState } from "react";

function restante(ms: number): string {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${d}d ${h}h ${m}m ${s}s`;
}

export function Cronometro({ cierreIso }: { cierreIso: string }) {
  const cierre = new Date(cierreIso).getTime();
  const [ahora, setAhora] = useState<number | null>(null);

  useEffect(() => {
    setAhora(Date.now());
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // En el servidor no se calcula (evita diferencias de hidratación).
  if (ahora === null) return <span className="cronometro">…</span>;
  const ms = cierre - ahora;
  return (
    <span className="cronometro" role="timer" aria-live="off">
      {ms > 0 ? restante(ms) : "Cerrada a ofertas"}
    </span>
  );
}
