# AGENTS.md

Guía para agentes que trabajen en este repositorio. Todo el proyecto (código, comentarios, docs y UI) está en **español**.

## Reglas comunes

Las reglas que valen para todos los repos viven en el repo **`dotfiles`** (`dotfiles/AGENTS.md`). Este archivo solo agrega lo específico del proyecto; si algo choca, manda el de este repo.

## Qué es

Visualizador gratuito de licitaciones públicas de Chile (datos de Mercado Público / ChileCompra), publicado en www.mercadoeficiente.cl. La hoja de ruta para convertirlo en plataforma completa está en `PLAN.md`.

Regla de arquitectura: **ningún secreto llega al navegador**. El ticket de ChileCompra y cualquier credencial de correo viven solo en el servidor (funciones de `api/` o variables de entorno de Vercel). El navegador nunca envía correos.

## Estructura

| Carpeta / archivo | Contenido |
|---|---|
| `index.html`, `acerca-de.html`, `privacidad.html` | Sitio estático (Bootstrap 4, jQuery, sin build) |
| `assets/js/main.js` | Lógica del buscador, desglose de IVA, cronómetro, `.ics`, exportación XLSX |
| `api/licitaciones.js` | Función serverless de Vercel: proxy a la API de Mercado Público |
| `dev-server.js` | Servidor local sin dependencias que emula `api/` |

## Comandos

```sh
cp .env.example .env   # completar MP_API_TICKET
node dev-server.js     # http://localhost:3000
node --check assets/js/main.js
```

## Convenciones de código

- Datos que vienen de la API se insertan con `textContent` o `createElement`, nunca con `innerHTML`/`insertAdjacentHTML`.
- El monto estimado de Mercado Público se trata como total con IVA: `neto = total / 1,19`.
- No migrar a otro framework fuera de lo que diga `PLAN.md` (Fase 1: Next.js).

## Despliegue

Vercel despliega `main` automáticamente. La etiqueta `vX.Y.Z` la crea `.github/workflows/tag.yaml` al llegar el `CHANGELOG.md` a `main`.
