import postgres, { type Sql } from "postgres";

export type { Sql };

let conexion: Sql | null = null;

/** `true` si hay base configurada (en local o en un preview puede no haberla). */
export function hayBase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Conexión compartida. En Vercel se usa el pooler de Supabase (puerto 6543,
 * modo transacción), que no admite sentencias preparadas.
 */
export function db(): Sql {
  if (conexion) return conexion;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL");
  conexion = postgres(url, {
    prepare: false,
    max: Number(process.env.DB_MAX_CONEXIONES ?? 3),
    idle_timeout: 20,
    onnotice: () => {},
  });
  return conexion;
}

export async function cerrarDb(): Promise<void> {
  if (conexion) {
    await conexion.end({ timeout: 5 });
    conexion = null;
  }
}
