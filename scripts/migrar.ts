// Aplica en orden las migraciones de db/migraciones que aún no estén aplicadas.
// Uso: DATABASE_URL=... npm run migrar
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { cerrarDb, db, type Sql } from "../lib/db.ts";
import { esPrincipal } from "./cli.ts";

const CARPETA = join(import.meta.dirname, "..", "db", "migraciones");

export async function migrar(sql: Sql): Promise<string[]> {
  await sql`create table if not exists schema_migraciones (
    nombre text primary key,
    aplicada_en timestamptz not null default now()
  )`;
  const aplicadas = new Set((await sql<{ nombre: string }[]>`select nombre from schema_migraciones`).map((f) => f.nombre));
  const archivos = (await readdir(CARPETA)).filter((a) => a.endsWith(".sql")).sort();
  const nuevas: string[] = [];
  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) continue;
    const contenido = await readFile(join(CARPETA, archivo), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(contenido);
      await tx`insert into schema_migraciones (nombre) values (${archivo})`;
    });
    nuevas.push(archivo);
  }
  return nuevas;
}

if (esPrincipal(import.meta.url)) {
  try {
    const nuevas = await migrar(db());
    console.log(nuevas.length ? `Aplicadas: ${nuevas.join(", ")}` : "Sin migraciones pendientes.");
  } finally {
    await cerrarDb();
  }
}
