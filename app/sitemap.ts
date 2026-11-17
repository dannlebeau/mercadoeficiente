import type { MetadataRoute } from "next";
import { codigosParaSitemap } from "@/lib/busqueda";
import { db, hayBase } from "@/lib/db";
import { URL_SITIO } from "@/lib/sitio";

export const revalidate = 3600;

// Un sitemap admite hasta 50.000 URLs; se dejan las 45.000 más recientes.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fijas: MetadataRoute.Sitemap = [
    { url: `${URL_SITIO}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${URL_SITIO}/acerca-de`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${URL_SITIO}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
  ];
  if (!hayBase()) return fijas;
  try {
    const filas = await codigosParaSitemap(db());
    return [
      ...fijas,
      ...filas.map((f) => ({
        url: `${URL_SITIO}/licitacion/${encodeURIComponent(f.codigo)}`,
        lastModified: f.actualizado_en,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    console.error("Sitemap sin licitaciones:", error instanceof Error ? error.message : error);
    return fijas;
  }
}
