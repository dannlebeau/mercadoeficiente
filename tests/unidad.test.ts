import assert from "node:assert/strict";
import { test } from "node:test";
import { filtrosDesdeUrl } from "../lib/busqueda.ts";
import { diaChile, fechaMercadoPublico, fechaParaApi } from "../lib/fechas.ts";
import { generarIcs, textoIcs } from "../lib/ics.ts";
import { filaDetalle } from "../lib/mercadoPublico.ts";
import { desglosarIva } from "../lib/montos.ts";
import { detalles } from "./datos-prueba.ts";

test("fechas sin zona se leen en hora de Chile (verano UTC-3, invierno UTC-4)", () => {
  assert.equal(fechaMercadoPublico("2026-11-20T15:00:00")?.toISOString(), "2026-11-20T18:00:00.000Z");
  assert.equal(fechaMercadoPublico("2026-07-10T15:00:00")?.toISOString(), "2026-07-10T19:00:00.000Z");
  assert.equal(fechaMercadoPublico("2026-11-20T15:00:00.123")?.toISOString(), "2026-11-20T18:00:00.000Z");
  assert.equal(fechaMercadoPublico("2026-11-20T15:00:00Z")?.toISOString(), "2026-11-20T15:00:00.000Z");
});

test("fechas vacías o de relleno son null", () => {
  assert.equal(fechaMercadoPublico("0001-01-01T00:00:00"), null);
  assert.equal(fechaMercadoPublico(""), null);
  assert.equal(fechaMercadoPublico(null), null);
  assert.equal(fechaMercadoPublico("no es fecha"), null);
});

test("día y fecha para la API usan hora de Chile", () => {
  // 02:00 UTC del 21 = 23:00 del 20 en Chile (verano).
  const d = new Date("2026-11-21T02:00:00Z");
  assert.equal(diaChile(d), "2026-11-20");
  assert.equal(fechaParaApi(d), "20112026");
});

test("IVA: neto = total / 1,19", () => {
  assert.deepEqual(desglosarIva(119000), { total: 119000, iva: 19000, neto: 100000 });
  assert.deepEqual(desglosarIva(undefined), { total: 0, iva: 0, neto: 0 });
});

test(".ics escapa texto y agrega una alarma por recordatorio", () => {
  assert.equal(textoIcs("a;b,c\\d\ne"), "a\\;b\\,c\\\\d\\ne");
  const ics = generarIcs({
    codigo: "1-2-LE26",
    nombre: "Aseo, limpieza",
    organismo: "Muni; X",
    cierre: new Date("2026-11-20T18:00:00Z"),
    horasAntes: [1, 24],
    ahora: new Date("2026-11-17T00:00:00Z"),
  });
  assert.match(ics, /DTSTART:20261120T180000Z/);
  assert.match(ics, /TRIGGER:-PT1H/);
  assert.match(ics, /TRIGGER:-PT24H/);
  assert.doesNotMatch(ics, /PT48H/);
  assert.ok(ics.includes("SUMMARY:Cierre licitación 1-2-LE26: Aseo\\, limpieza"));
  assert.ok(ics.includes("Organismo: Muni\\; X\\n"));
  assert.ok(ics.split("\r\n").length > 10, "líneas separadas por CRLF");
});

test("filaDetalle mapea comprador, fechas e ítems adjudicados", () => {
  const fila = filaDetalle(detalles()["3333-5-L126"]);
  assert.ok(fila);
  assert.equal(fila.licitacion.estado, "Cerrada");
  assert.equal(fila.licitacion.region, "Región del Biobío");
  assert.equal(fila.licitacion.monto_estimado, 900000);
  assert.ok(fila.licitacion.fecha_cierre instanceof Date);
  assert.equal(fila.items[0].codigo_producto, "47131700");
  assert.equal(fila.items[0].proveedor_nombre, "Limpiezas del Sur SpA");
  assert.equal(filaDetalle({ Nombre: "sin código" }), null);
});

test("filtrosDesdeUrl descarta valores inválidos", () => {
  const f = filtrosDesdeUrl({ q: "  aseo ", rubro: "7x", pagina: "-3", estado: "cualquiera", montoMin: "1.000.000", orden: "drop" });
  assert.equal(f.q, "aseo");
  assert.equal(f.rubro, undefined);
  assert.equal(f.pagina, 1);
  assert.equal(f.estado, "abiertas");
  assert.equal(f.montoMin, 1000000);
  assert.equal(f.orden, undefined);
  assert.equal(filtrosDesdeUrl({ rubro: "76", estado: "todas" }).rubro, "76");
});
