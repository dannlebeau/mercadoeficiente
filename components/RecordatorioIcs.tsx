"use client";

import { useState } from "react";
import { generarIcs } from "@/lib/ics";

const HORAS = [1, 24, 48, 72];

// Descarga el cierre como evento de calendario con recordatorios: avisa aunque
// se cierre la pestaña, sin enviar correos ni guardar datos del usuario.
export function RecordatorioIcs(props: { codigo: string; nombre: string; organismo: string | null; cierreIso: string }) {
  const [marcadas, setMarcadas] = useState<number[]>([24]);
  const [mensaje, setMensaje] = useState("");
  const cierre = new Date(props.cierreIso);

  function alternar(h: number) {
    setMarcadas((m) => (m.includes(h) ? m.filter((x) => x !== h) : [...m, h].sort((a, b) => a - b)));
  }

  function descargar() {
    if (cierre.getTime() <= Date.now()) {
      setMensaje("Esta licitación ya cerró.");
      return;
    }
    if (marcadas.length === 0) {
      setMensaje("Marca al menos un recordatorio.");
      return;
    }
    const ics = generarIcs({ ...props, cierre, horasAntes: marcadas });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `cierre-${props.codigo}.ics`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
    setMensaje("Listo: abre el archivo para agregarlo a tu calendario.");
  }

  return (
    <div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600 }}>Recordarme antes del cierre</legend>
        <div className="casillas">
          {HORAS.map((h) => (
            <label key={h}>
              <input type="checkbox" checked={marcadas.includes(h)} onChange={() => alternar(h)} />
              {h === 1 ? "1 hora antes" : `${h} horas antes`}
            </label>
          ))}
        </div>
      </fieldset>
      <button type="button" className="boton" onClick={descargar}>
        Agregar al calendario
      </button>
      <p role="status" style={{ fontSize: "0.88rem", marginBottom: 0 }}>{mensaje}</p>
    </div>
  );
}
