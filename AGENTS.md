# AGENTS.md

Guía para agentes que trabajen en este repositorio. Todo el proyecto (código, comentarios, docs y UI) está en **español**.

## Reglas comunes

Las reglas que valen para todos los repos viven en el repo **`dotfiles`** (`dotfiles/AGENTS.md`). Este archivo solo agrega lo específico del proyecto; si algo choca, manda el de este repo.

## Qué es

Plataforma gratuita de licitaciones públicas de Chile (datos de Mercado Público / ChileCompra), publicada en www.mercadoeficiente.cl. La hoja de ruta está en `PLAN.md`.

Reglas de arquitectura que no se rompen:
- **Ningún secreto llega al navegador.** El ticket y `DATABASE_URL` solo se leen en el servidor o en la ingesta. El navegador nunca envía correos.
- **La cuota del ticket es de 10.000 consultas diarias.** La web lee de la base; la API en vivo solo como respaldo de la ficha y siempre con caché. Toda consulta nueva de la ingesta pasa por `consultas_api`.
- **Sin muros de pago.** Todo lo que se agregue es gratis y sin registro, salvo que el PLAN diga otra cosa.

## Estructura

| Carpeta | Contenido |
|---|---|
| `app/`, `components/` | Next.js 16 (App Router), React 19, CSS propio en `app/globals.css` |
| `lib/` | Cliente de la API, fechas en hora de Chile, búsqueda, ingesta, `.ics` |
| `db/migraciones/` | SQL numerado; `npm run migrar` aplica los pendientes |
| `scripts/` | `migrar.ts`, `ingesta.ts` (Node con type stripping, sin build) |
| `tests/` | `node --test`; `db.test.ts` usa Postgres real |

## Comandos

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

## Convenciones de código

- Las importaciones entre archivos de `lib/` y `scripts/` llevan extensión `.ts` (corren con Node sin build). En `app/` y `components/` se usa `@/`.
- Fechas de la API: siempre con `fechaMercadoPublico()` (vienen sin zona, en hora de Chile). Nunca `new Date(texto)`.
- Monto estimado = total con IVA; neto = total / 1,19 (`lib/montos.ts`).
- Datos de la API se muestran con JSX (escapado). Nada de `dangerouslySetInnerHTML` con datos externos.
- Sin Tailwind, ORM ni librerías de UI salvo que el PLAN lo pida.

## Datos sensibles a cambios

- El esquema cambia solo con una migración nueva en `db/migraciones/` (nunca editar una ya aplicada).
- Si cambia la forma de la API, actualizar `lib/mercadoPublico.ts` y `tests/datos-prueba.ts`.

## Pruebas

- En local sin Postgres, `tests/db.test.ts` se salta. En CI corre contra el servicio `postgres` de `.github/workflows/ci.yml` y falla si falta `DATABASE_URL`.
- Para ver la ficha sin ticket real: levantar una API falsa y usar `MP_API_BASE=http://localhost:PUERTO` con `MP_API_TICKET=falso`.

## Despliegue

Vercel despliega `main` automáticamente. La ingesta corre en `.github/workflows/ingesta.yml` cada hora. La etiqueta `vX.Y.Z` la crea `.github/workflows/tag.yaml` al llegar el `CHANGELOG.md` a `main`.
