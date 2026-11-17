# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) y el proyecto usa [SemVer](https://semver.org/lang/es/).

## [5.1.0] - 2026-11-17

### Added

- Nueva plataforma en Next.js 16 + React 19 + TypeScript que reemplaza el sitio estático.
- Buscador gratis y sin registro: palabra clave (español, sin distinguir tildes), región, rubro (segmento UNSPSC), monto mínimo, estado y orden. Un código exacto lleva directo a su ficha.
- Ficha indexable por licitación (`/licitacion/[codigo]`): organismo, fechas clave en hora de Chile, monto con neto e IVA referenciales, productos, adjudicación, cronómetro y alerta de cierre `.ics`.
- Base Postgres (`db/migraciones/001_inicial.sql`) e ingesta horaria (`lib/ingesta.ts`, `.github/workflows/ingesta.yml`) con presupuesto por corrida, tope diario y registro de consultas para no pasar las 10.000 del ticket.
- `sitemap.xml` con las fichas y `robots.txt` generados por la app.
- Selector de tema Sistema / Claro / Oscuro.
- CI (`.github/workflows/ci.yml`): tipos, pruebas con Postgres real y build.

### Changed

- `acerca-de` y `privacidad` pasan a rutas de Next.js; las URLs `.html` antiguas redirigen. La política de privacidad ya no menciona EmailJS.
- Las fechas de la API se interpretan en hora de Chile también en el servidor (antes dependían de la zona del navegador).

### Removed

- Sitio estático (`index.html`, `assets/`, jQuery, Bootstrap, exportación XLSX), `api/licitaciones.js` y `dev-server.js`. Quedan en el historial de git.

## [5.0.3] - 2026-11-17

### Fixed

- La Fase 0 (5.0.2) se había mezclado en la rama del plan y no en `main`: se integra ahora con el commit de AdSense (`6208e01`).
- El listado inicial de licitaciones activas también inserta los datos como texto (XSS) y calcula bien el IVA.
- `api/licitaciones.js` guarda en la CDN de Vercel las respuestas correctas (5 min el detalle, 15 min los listados), para que las visitas a la home no agoten la cuota diaria de 10.000 consultas del ticket.

## [5.0.2] - 2026-11-17

### Added

- Alertas de cierre como evento de calendario (`.ics`) con recordatorios de 1, 24, 48 y 72 horas, que funcionan aunque se cierre la pestaña.
- `AGENTS.md`, `CLAUDE.md` y `.github/` (Dependabot y workflows de changelog, etiqueta, zizmor y gitleaks).

### Changed

- "Avisar Resultado" pasa a "Resultado de Adjudicación": muestra en pantalla todos los ítems adjudicados en vez de enviarlos por correo.
- `.gitignore` según la plantilla común, más `.vercel/`.

### Fixed

- Cálculo de IVA: el neto ahora es `total / 1,19` (antes `total - total × 0,19`).
- El enlace "Ver en Mercado Público" usa HTTPS y codifica el código ingresado.

### Removed

- Bloqueo del clic derecho.
- EmailJS y los campos de correo y WhatsApp de las alertas.

### Security

- Se elimina EmailJS del navegador: su clave pública permitía usar la cuenta para enviar correos a cualquier dirección.
- Los datos de la API se insertan como texto y no como HTML, para evitar XSS.

## [5.0.1] - 2026-11-17

### Added

- `PLAN.md`: análisis de la competencia (6 plataformas de licitaciones), diagnóstico del sitio actual y hoja de ruta por fases para convertir Mercado Eficiente en una plataforma gratuita.
- `CHANGELOG.md`.

[5.1.0]: https://github.com/dannlebeau/mercadoeficiente/compare/v5.0.3...v5.1.0
[5.0.3]: https://github.com/dannlebeau/mercadoeficiente/compare/v5.0.2...v5.0.3
[5.0.2]: https://github.com/dannlebeau/mercadoeficiente/compare/v5.0.1...v5.0.2
[5.0.1]: https://github.com/dannlebeau/mercadoeficiente/releases/tag/v5.0.1
