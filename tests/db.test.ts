// Pruebas contra Postgres real. En CI la base la da el servicio `postgres` del
// workflow; si falta DATABASE_URL en CI, la prueba FALLA (no se salta).
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { buscar, obtenerLicitacion, opcionesFiltros } from "../lib/busqueda.ts";
import { cerrarDb, db, type Sql } from "../lib/db.ts";
import { consultasUsadasHoy, ejecutarIngesta } from "../lib/ingesta.ts";
import type { LicitacionApi } from "../lib/mercadoPublico.ts";
import { migrar } from "../scripts/migrar.ts";
import { apiFalsa, detalles, itemListado } from "./datos-prueba.ts";

const hayBase = Boolean(process.env.DATABASE_URL);
if (!hayBase && process.env.CI) throw new Error("Falta DATABASE_URL en CI: el servicio postgres no está configurado.");

describe("base de datos", { skip: hayBase ? false : "sin DATABASE_URL (en local)" }, () => {
  let sql: Sql;
  const ticket = "ticket-de-prueba";

  before(async () => {
    sql = db();
    await sql.unsafe("drop schema public cascade; create schema public;");
    const aplicadas = await migrar(sql);
    assert.deepEqual(aplicadas, ["001_inicial.sql"]);
    assert.deepEqual(await migrar(sql), [], "migrar dos veces no reaplica");
  });

  after(async () => {
    await cerrarDb();
  });

  let datos = detalles();
  let listado: LicitacionApi[] = Object.values(datos).map(itemListado);
  let fallo: number | null = null;
  const api = apiFalsa({ listado: () => listado, detalles: () => datos, fallarCon: () => fallo });
  const opciones = () => ({ sql, ticket, fetch: api.fetch, pausaMs: 0 });

  test("presupuesto: con 2 consultas solo pide 1 detalle (el de cierre más próximo)", async () => {
    const r = await ejecutarIngesta({ ...opciones(), presupuesto: 2 });
    assert.equal(r.consultas, 2);
    assert.equal(r.nuevas, 3);
    assert.equal(r.detalladas, 1);
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from licitaciones where detalle is not null`;
    assert.equal(n, 1);
    // El listado trae la cerrada con cierre hace 2 días: es la de cierre más próximo.
    assert.ok(await obtenerLicitacion(sql, "3333-5-L126").then((l) => l?.detalle));
  });

  test("segunda corrida completa los detalles sin duplicar filas", async () => {
    const r = await ejecutarIngesta(opciones());
    assert.equal(r.nuevas, 0);
    assert.equal(r.detalladas, 2);
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from licitaciones`;
    assert.equal(n, 3);
    const [{ items }] = await sql<{ items: number }[]>`select count(*)::int as items from items`;
    assert.equal(items, 3);
  });

  test("tercera corrida no vuelve a pedir detalles recientes (1 sola consulta)", async () => {
    const antes = api.llamadas.length;
    const r = await ejecutarIngesta(opciones());
    assert.equal(r.consultas, 1);
    assert.equal(api.llamadas.length - antes, 1);
  });

  test("un cambio de estado en el listado fuerza a refrescar el detalle", async () => {
    datos = detalles();
    datos["2222-10-LP26"] = { ...datos["2222-10-LP26"], CodigoEstado: 19 };
    listado = listado.map((l) => (l.CodigoExterno === "2222-10-LP26" ? { ...l, CodigoEstado: 19 } : l));
    const r = await ejecutarIngesta(opciones());
    assert.equal(r.detalladas, 1);
    assert.equal((await obtenerLicitacion(sql, "2222-10-LP26"))?.estado, "Suspendida");
    // Se restaura para las pruebas de búsqueda.
    datos = detalles();
    listado = Object.values(datos).map(itemListado);
    await ejecutarIngesta(opciones());
  });

  test("registra las consultas del día y respeta el límite diario", async () => {
    const usadas = await consultasUsadasHoy(sql, new Date());
    assert.equal(usadas, api.llamadas.length);
    const r = await ejecutarIngesta({ ...opciones(), limiteDiario: usadas });
    assert.equal(r.consultas, 0);
    assert.equal(r.cortadaPor, "límite diario alcanzado");
  });

  test("un 429 de la API corta la corrida y no sigue gastando cuota", async () => {
    await sql`update licitaciones set detalle_en = null`;
    let n = 0;
    fallo = null;
    const api429 = apiFalsa({
      listado: () => listado,
      detalles: () => datos,
      fallarCon: () => (++n > 1 ? 429 : null),
    });
    const r = await ejecutarIngesta({ sql, ticket, fetch: api429.fetch, pausaMs: 0 });
    assert.equal(r.consultas, 2);
    assert.match(r.cortadaPor ?? "", /429/);
    await ejecutarIngesta(opciones());
  });

  test("buscar 'aseo' en Región del Biobío devuelve solo la abierta", async () => {
    const { filas, total } = await buscar(sql, { q: "aseo", region: "Región del Biobío" });
    assert.equal(total, 1);
    assert.equal(filas[0].codigo, "1234-56-LE26");
  });

  test("con estado 'todas' también aparece la cerrada", async () => {
    const { filas } = await buscar(sql, { q: "aseo", region: "Región del Biobío", estado: "todas" });
    assert.deepEqual(filas.map((f) => f.codigo).sort(), ["1234-56-LE26", "3333-5-L126"]);
  });

  test("búsqueda sin tildes: 'construccion' encuentra 'Construcción'", async () => {
    const { filas } = await buscar(sql, { q: "construccion" });
    assert.deepEqual(filas.map((f) => f.codigo), ["2222-10-LP26"]);
  });

  test("filtro por rubro (segmento UNSPSC) y por monto", async () => {
    assert.deepEqual((await buscar(sql, { rubro: "76" })).filas.map((f) => f.codigo), ["1234-56-LE26"]);
    assert.deepEqual((await buscar(sql, { montoMin: 50000000 })).filas.map((f) => f.codigo), ["2222-10-LP26"]);
  });

  test("texto con sintaxis rara no rompe la consulta", async () => {
    const { total } = await buscar(sql, { q: "'); drop table licitaciones; --" });
    assert.equal(total, 0);
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from licitaciones`;
    assert.equal(n, 3);
  });

  test("opciones de filtros: regiones y rubros con nombre", async () => {
    const { regiones, rubros } = await opcionesFiltros(sql);
    assert.ok(regiones.some((r) => r.valor === "Región del Biobío" && r.cantidad === 2));
    assert.ok(rubros.some((r) => r.valor === "76" && r.etiqueta.startsWith("Servicios de limpieza")));
  });
});
