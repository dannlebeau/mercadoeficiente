// Obtiene el detalle de una licitación: primero desde la base y, si no está,
// en vivo desde la API (con caché de Next.js para no gastar cuota).
import { cache } from "react";
import { obtenerLicitacion } from "./busqueda.ts";
import { db, hayBase } from "./db.ts";
import { consultarLicitaciones, type LicitacionApi } from "./mercadoPublico.ts";

export const PATRON_CODIGO = /^\d{1,7}-\d{1,5}-[A-Za-z0-9]{2,8}$/;

export type Ficha = { detalle: LicitacionApi; fuente: "base" | "api"; actualizado: Date | null };

export const obtenerFicha = cache(async (codigo: string): Promise<Ficha | null> => {
  if (!PATRON_CODIGO.test(codigo)) return null;

  if (hayBase()) {
    try {
      const guardada = await obtenerLicitacion(db(), codigo);
      if (guardada?.detalle) {
        return { detalle: guardada.detalle as LicitacionApi, fuente: "base", actualizado: guardada.actualizado_en };
      }
    } catch (error) {
      console.error("Error leyendo la base:", error instanceof Error ? error.message : error);
    }
  }

  const ticket = process.env.MP_API_TICKET;
  if (!ticket) return null;
  try {
    const [detalle] = await consultarLicitaciones(
      { codigo },
      { ticket, init: { next: { revalidate: 900 } } as RequestInit },
    );
    return detalle ? { detalle, fuente: "api", actualizado: new Date() } : null;
  } catch (error) {
    console.error("Error consultando Mercado Público:", error instanceof Error ? error.message : error);
    throw new Error("No se pudo consultar Mercado Público");
  }
});
