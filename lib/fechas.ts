// Mercado Público entrega las fechas sin zona horaria ("2026-11-20T15:00:00")
// en hora de Chile continental. El servidor (Vercel, GitHub Actions) corre en
// UTC, así que interpretarlas con `new Date()` las correría 3-4 horas.

export const ZONA_CHILE = "America/Santiago";

// Diferencia en minutos entre la hora de Chile y UTC en un instante dado.
function desfaseChile(instanteUtc: number): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_CHILE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instanteUtc));
  const v = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  const comoUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second"));
  return Math.round((comoUtc - instanteUtc) / 60000);
}

/** Convierte una fecha de Mercado Público a `Date` (o `null` si no es válida). */
export function fechaMercadoPublico(valor: unknown): Date | null {
  if (typeof valor !== "string" || valor.trim() === "") return null;
  const texto = valor.trim();

  // Si trae zona (Z o ±hh:mm), se respeta.
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(texto)) {
    const d = new Date(texto);
    return isNaN(d.getTime()) ? null : d;
  }

  const m = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/);
  if (!m) return null;
  const [, a, mes, dia, h = "0", min = "0", s = "0"] = m;
  if (Number(a) < 1900) return null; // la API usa 0001-01-01 como "sin fecha"
  const comoUtc = Date.UTC(Number(a), Number(mes) - 1, Number(dia), Number(h), Number(min), Number(s));
  // Dos pasadas para acertar en los días de cambio de horario.
  let instante = comoUtc - desfaseChile(comoUtc) * 60000;
  instante = comoUtc - desfaseChile(instante) * 60000;
  const d = new Date(instante);
  return isNaN(d.getTime()) ? null : d;
}

/** Formatea en hora de Chile, ej. "20-11-2026 15:00". */
export function formatearFechaChile(fecha: Date | string | null | undefined): string {
  if (!fecha) return "N/A";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: ZONA_CHILE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
}

/** Día en hora de Chile como "aaaa-mm-dd" (para la columna `date`). */
export function diaChile(fecha: Date): string {
  const ddmmaaaa = fechaParaApi(fecha);
  return `${ddmmaaaa.slice(4)}-${ddmmaaaa.slice(2, 4)}-${ddmmaaaa.slice(0, 2)}`;
}

/** Fecha como la pide la API de Mercado Público: ddmmaaaa, en hora de Chile. */
export function fechaParaApi(fecha: Date): string {
  const partes = new Intl.DateTimeFormat("es-CL", {
    timeZone: ZONA_CHILE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(fecha);
  const v = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${v("day")}${v("month")}${v("year")}`;
}
