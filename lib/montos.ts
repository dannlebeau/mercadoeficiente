// El monto estimado de Mercado Público se trata como total con IVA (19%).
export function desglosarIva(montoTotal: unknown): { total: number; iva: number; neto: number } {
  const total = Number(montoTotal) || 0;
  const neto = Math.round(total / 1.19);
  return { total, iva: total - neto, neto };
}

export function formatearMonto(monto: number | null | undefined, moneda = "CLP"): string {
  if (monto === null || monto === undefined || !Number.isFinite(Number(monto))) return "No informado";
  const n = Number(monto);
  if (moneda === "CLP") return `$ ${n.toLocaleString("es-CL", { maximumFractionDigits: 0 })}`;
  return `${n.toLocaleString("es-CL")} ${moneda}`;
}
