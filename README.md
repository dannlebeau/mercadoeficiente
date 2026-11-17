# Mercado Eficiente _(mercadoeficiente)_

Licitaciones públicas de Chile gratis: busca por palabra, región, rubro o monto, sin registro.

🔗 [www.mercadoeficiente.cl](https://www.mercadoeficiente.cl)

Los datos vienen de la API pública de Mercado Público (Dirección ChileCompra). Una ingesta cada hora los guarda en Postgres para buscarlos con texto completo en español; cada licitación tiene su ficha indexable con fechas, montos, productos, adjudicación, cronómetro y alerta de cierre para el calendario. La hoja de ruta está en [`PLAN.md`](PLAN.md).

## Instalación

Requiere Node.js 22.18 o superior.

```sh
npm ci
cp .env.example .env   # completar MP_API_TICKET y, si hay base, DATABASE_URL
npm run migrar         # solo si hay DATABASE_URL
```

## Uso

```sh
npm run dev            # http://localhost:3000
npm run ingesta        # trae licitaciones a la base (gasta cuota del ticket)
npm run typecheck
npm test               # las pruebas de base se saltan sin DATABASE_URL (en CI son obligatorias)
```

Sin `DATABASE_URL` el sitio funciona solo con búsqueda por código (consulta la API en vivo).

## Arquitectura

| Pieza | Dónde |
|---|---|
| Web (Next.js, React, TypeScript) | `app/`, `components/` |
| Cliente de la API, búsqueda, ingesta | `lib/` |
| Esquema de la base | `db/migraciones/` |
| Scripts (`migrar`, `ingesta`) | `scripts/` |
| Ingesta programada (cada hora) | `.github/workflows/ingesta.yml` |

Despliegue en Vercel con las variables `MP_API_TICKET` y `DATABASE_URL`. La ingesta corre en GitHub Actions con los secretos del repo del mismo nombre.

## Contribuir

Los cambios se proponen con una rama y un PR hacia `main` (ver `AGENTS.md`). Preguntas y errores: [issues del repo](https://github.com/dannlebeau/mercadoeficiente/issues).

## Licencia

UNLICENSED © Dann LeBeau · Geopolis. Datos: Dirección ChileCompra.
