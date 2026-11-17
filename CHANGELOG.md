# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) y el proyecto usa [SemVer](https://semver.org/lang/es/).

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

[5.0.2]: https://github.com/dannlebeau/mercadoeficiente/compare/v5.0.1...v5.0.2
[5.0.1]: https://github.com/dannlebeau/mercadoeficiente/releases/tag/v5.0.1
