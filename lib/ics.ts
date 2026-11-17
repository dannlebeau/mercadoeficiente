// Evento de calendario (RFC 5545) con recordatorios antes del cierre.

function fechaIcs(fecha: Date): string {
  return fecha.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escapa \ ; , y saltos de línea. */
export function textoIcs(texto: unknown): string {
  return String(texto ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/[;,]/g, (m) => "\\" + m)
    .replace(/\r?\n/g, "\\n");
}

export function urlMercadoPublico(codigo: string): string {
  return `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${encodeURIComponent(codigo)}`;
}

export function generarIcs(opciones: {
  codigo: string;
  nombre: string;
  organismo: string | null;
  cierre: Date;
  horasAntes: number[];
  ahora?: Date;
}): string {
  const { codigo, nombre, organismo, cierre, horasAntes } = opciones;
  const ahora = opciones.ahora ?? new Date();
  const titulo = `Cierre licitación ${codigo}: ${nombre}`;
  const url = urlMercadoPublico(codigo);
  const alarmas = horasAntes.flatMap((h) => [
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${textoIcs(`Cierra en ${h} hora(s): ${titulo}`)}`,
    `TRIGGER:-PT${h}H`,
    "END:VALARM",
  ]);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mercado Eficiente//Alertas de cierre//ES",
    "BEGIN:VEVENT",
    `UID:${textoIcs(codigo)}@mercadoeficiente.cl`,
    `DTSTAMP:${fechaIcs(ahora)}`,
    `DTSTART:${fechaIcs(cierre)}`,
    `DTEND:${fechaIcs(cierre)}`,
    `SUMMARY:${textoIcs(titulo)}`,
    `DESCRIPTION:${textoIcs(`Organismo: ${organismo || "N/A"}\n${url}`)}`,
    `URL:${url}`,
    ...alarmas,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
