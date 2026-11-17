// Corrida de ingesta (la lanza .github/workflows/ingesta.yml cada hora).
// Uso: DATABASE_URL=... MP_API_TICKET=... npm run ingesta
// Variables opcionales: INGESTA_PRESUPUESTO (300), INGESTA_LIMITE_DIARIO (8000).
import { cerrarDb, db } from "../lib/db.ts";
import { ejecutarIngesta } from "../lib/ingesta.ts";
import { esPrincipal } from "./cli.ts";
import { migrar } from "./migrar.ts";

if (esPrincipal(import.meta.url)) {
  const ticket = process.env.MP_API_TICKET;
  if (!ticket) {
    console.error("Falta MP_API_TICKET");
    process.exit(1);
  }
  try {
    const sql = db();
    await migrar(sql);
    const resumen = await ejecutarIngesta({
      sql,
      ticket,
      presupuesto: Number(process.env.INGESTA_PRESUPUESTO ?? 300),
      limiteDiario: Number(process.env.INGESTA_LIMITE_DIARIO ?? 8000),
      log: console.log,
    });
    console.log(JSON.stringify(resumen));
    // Si la corrida no pudo ni leer el listado, que el workflow quede en rojo.
    if (resumen.consultas > 0 && resumen.enListado === 0 && resumen.errores > 0) process.exitCode = 1;
  } catch (error) {
    // Nunca imprimir la URL (lleva el ticket): solo el mensaje.
    console.error("Ingesta fallida:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await cerrarDb();
  }
}
