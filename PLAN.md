# PLAN — Mercado Eficiente como plataforma gratuita de licitaciones

Objetivo: que Mercado Eficiente sea **la** plataforma de acceso gratuito a licitaciones y compras públicas de Chile, cubriendo lo que hoy la competencia cobra. Sustento: anuncios (AdSense) sobre tráfico orgánico, sin muros de pago.

Estado: **análisis y hoja de ruta listos; ninguna fase iniciada.** Cada fase se hace en su propia rama + PR.

---

## 1. Competencia (análisis del 2026-11-17, solo páginas públicas)

| Sitio | Gratis | Pago | Fuerte en | Débil en |
|---|---|---|---|---|
| ganalafacil.cl | Sí: 1 usuario, correo diario, WhatsApp mar/jue | 0,3 UF/mes + IVA | Alertas WhatsApp, precio | Sin IA ni análisis |
| licitacionesdechile.cl | Sí: búsqueda normal, sin alertas | $29.990/mes ($24.990 anual) | IA semántica, chat con documentos, app iOS, revisa cada 10 min | Sin Android ni WhatsApp |
| todolicitaciones.cl | Sí: buscador, sin alertas | $20.000/mes | Adjudicados, historial de precios, Plan Anual de Compras | Solo correo, sin términos publicados |
| ialicitaciones.com | No (prueba 7-14 días) | 29/99/299 €/mes | IA: memorias técnicas, % de baja estimado | Plataforma española, cobra en EUR |
| licitamos.cl | No | UF 1,5 / 2,5 / 5,5 + IVA | Gestión de equipo: etapas, bóveda, calendario .ics, win rate | Sin IA, sin plan gratis |
| senegocia.com | — | A cotizar | Licitaciones **privadas** del lado comprador | No compite: no busca licitaciones públicas |

**Conclusiones**
- Todos usan la misma fuente: datos públicos de Mercado Público. La ventaja de ellos es el procesamiento, no el dato.
- Lo que cobran: **alertas**, **análisis de adjudicaciones y precios**, **IA**, **gestión/seguimiento**.
- Nadie junta alertas multicanal + análisis de precios + IA. Y nadie es gratis completo.
- Oportunidad SEO: una página indexable por licitación, organismo y rubro atrae tráfico orgánico, que es lo que paga los anuncios.
- Fuera de alcance: licitaciones privadas (Senegocia) y redacción de propuestas con IA a escala (costo alto por usuario).

Limitación: el análisis salió de resúmenes de WebFetch; precios y funciones pueden haber cambiado. Verificar antes de citarlos públicamente.

## 2. Estado actual del repo (diagnóstico)

Sitio estático (HTML + Bootstrap 4 + jQuery) y un proxy en Vercel (`api/licitaciones.js`) que solo busca **por código exacto**.

Problemas encontrados:
1. **Seguridad — EmailJS como relay abierto:** la public key, el servicio y la plantilla están en `assets/js/main.js` y `to_email` lo elige el navegador. Cualquiera puede mandar correos a cualquier dirección usando tu cuenta (spam, bloqueo de la cuenta).
2. **Seguridad — XSS:** `mostrarOfertas` inserta `oferta.Nombre` con `insertAdjacentHTML` sin escapar.
3. **Bug — IVA mal calculado:** usa `neto = total - total*0,19`; lo correcto es `neto = total / 1,19`, `iva = total - neto`.
4. **Alertas falsas:** las de cierre usan `setTimeout`; solo funcionan con la pestaña abierta.
5. Sin búsqueda por palabra, región, rubro ni estado: hay que saber el código.
6. Sin selector de tema Sistema/Claro/Oscuro (convención común).
7. Bloqueo de clic derecho: no protege nada y molesta.
8. Falta la base del repo: `CHANGELOG.md`, `AGENTS.md`/`CLAUDE.md`, `.github/` (changelog, tag, zizmor, gitleaks, Dependabot).

## 3. Arquitectura propuesta

| Pieza | Elección | Por qué |
|---|---|---|
| Front | **Next.js (React) + TypeScript** en Vercel | Lo pediste en React; Next.js renderiza en servidor, así Google indexa cada licitación (SEO = tráfico = anuncios). Ya estás en Vercel. |
| Datos | **Supabase (Postgres)** | Ya lo usas en Mappin. Búsqueda full-text en español (`tsvector`) + `pg_trgm`; luego `pgvector` para IA. |
| Ingesta | **GitHub Actions cron** (cada 30-60 min) con un script Node | Gratis, en Linux, con logs. El Cron de Vercel Hobby es solo diario. |
| Correo | Resend (u otro con capa gratis), enviado **desde el servidor** | Elimina el relay de EmailJS. |
| Canales extra | Bot de Telegram + Web Push (PWA) | Gratis. WhatsApp cobra por mensaje: solo si hay financiamiento. |

**Restricción clave — cuota de la API.** El ticket de Mercado Público tiene límite diario de consultas (documentado en ~10.000/día; **verificar**). `licitaciones.json?fecha=` trae la lista con pocos campos y el detalle exige 1 consulta por código. Con ~3.000 publicaciones/día y ~8.000 abiertas no alcanza para refrescar todo cada hora. Estrategia:
- Lista diaria por fecha y estado → detalle solo de lo nuevo.
- Re-consultar abiertas por prioridad (cierre próximo, con usuarios siguiéndolas).
- Historia y adjudicaciones desde **Datos Abiertos de ChileCompra** (descargas masivas), no desde la API.

## 4. Hoja de ruta

Cada paso dice **cómo se demuestra** que funciona.

### Fase 0 — Ordenar la casa y cerrar riesgos (sitio actual, sin migrar)
1. Agregar base del repo desde `dotfiles/templates/` (`CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`, `.github/`). → El PR muestra los checks changelog, zizmor y gitleaks en verde.
2. Quitar EmailJS del navegador: endpoint `api/avisar.js` que envía desde el servidor, con validación y límite por IP. Rotar las claves de EmailJS. → `grep emailjs assets/` vacío; un POST con correo inválido devuelve 400; 6 envíos seguidos desde la misma IP devuelven 429.
3. Escapar datos de la API (`textContent` en vez de HTML). → Probar con un `Nombre` que contenga `<img onerror>` en el dev-server: se ve como texto.
4. Corregir IVA. → Total $119.000 muestra neto $100.000 e IVA $19.000.
5. Quitar bloqueo de clic derecho y avisar con claridad que las alertas actuales no son reales (o esconderlas hasta Fase 2). → Revisión manual en el navegador.

### Fase 1 — Nueva plataforma: buscador abierto
1. Proyecto Next.js + TS en la misma repo (rama), con selector de tema. → `pnpm build` en CI verde; tema persiste al recargar.
2. Esquema Supabase: `licitaciones`, `items`, `organismos`, `proveedores`, `adjudicaciones` con índices full-text en español. → Migraciones aplicadas en una base vacía desde CI.
3. Ingesta (GitHub Actions cron) idempotente con registro de consultas usadas. → Dos corridas seguidas no duplican filas; log muestra consultas < cuota.
4. Buscador: palabra clave, región, rubro (UNSPSC), monto, estado, fecha de cierre, organismo. Gratis y **sin registro**. → Test e2e: buscar "aseo" + Región del Biobío devuelve resultados que coinciden.
5. Páginas SEO: `/licitacion/[codigo]`, `/organismo/[id]`, `/rubro/[id]`, `sitemap.xml`. → Lighthouse SEO ≥ 90; sitemap válido en Search Console.
6. Compra Ágil: **investigar primero** la fuente disponible (API vs. Datos Abiertos). → Nota en este PLAN con la fuente confirmada antes de implementar.
7. Migrar `privacidad`, `acerca-de`, `ads.txt` y AdSense; redirigir URLs viejas. → Las URLs actuales responden 200 o 301.

### Fase 2 — Alertas reales y seguimiento (lo que más cobran)
1. Cuenta con login por enlace al correo (Supabase Auth), sin contraseña. → Registro, logout y re-login funcionan; doble clic en "enviar enlace" no crea dos cuentas.
2. Búsquedas guardadas → resumen diario por correo, sin límite de alertas. → Test con una búsqueda guardada y licitación de prueba: llega 1 correo, no 2.
3. Avisos de cierre (72/48/24/1 h) y de cambio de estado (adjudicada, desierta, segundo llamado, extensión de plazo). → Test con fechas simuladas.
4. Favoritos, notas y exportación del calendario `.ics`. → El `.ics` abre en Google Calendar.
5. Telegram y Web Push. → Mensaje de prueba recibido en ambos.

### Fase 3 — Inteligencia de mercado gratis
1. Carga histórica desde Datos Abiertos (licitaciones + órdenes de compra). → Conteos por mes cuadran con los publicados por ChileCompra (±1%).
2. Ficha de organismo: cuánto compra, qué, a quién. Ficha de proveedor: qué gana, dónde, win rate. → Comparar 3 casos a mano contra mercadopublico.cl.
3. Historial de precios por producto (UNSPSC) desde órdenes de compra. → Gráfico de un producto común (resma de papel) con valores verificables.
4. Plan Anual de Compras por organismo, si la fuente lo permite. → Fuente confirmada en este PLAN.

### Fase 4 — IA con costo controlado
1. Búsqueda semántica con `pgvector` (embeddings calculados una vez por licitación en la ingesta). → "hago mantención de áreas verdes" encuentra licitaciones de "jardinería" y "paisajismo".
2. Resumen de bases bajo demanda, cacheado por licitación (se paga una vez, lo ven todos). → Costo por resumen registrado; límite diario global.

### Fase 5 — Sostenibilidad
- AdSense en páginas de alto tráfico, sin tapar el contenido; botón de aporte voluntario.
- Página "Transparencia" con costos reales mensuales.
- API pública propia (con límite) para que otros construyan encima: refuerza la misión.

## 5. Riesgos

- **Cuota de la API** y cambios de formato de ChileCompra → caché, Datos Abiertos, monitoreo de la ingesta.
- **Costos** si el tráfico crece (Supabase, correo, IA) → topes duros y página de transparencia.
- **Términos de uso**: solo datos públicos de ChileCompra. No copiar contenido ni datos procesados de la competencia.
- **Datos personales** (correos de usuarios) → política de privacidad actualizada (Ley 19.628 y Ley 21.719).
- **Tiempo de un solo desarrollador** → fases cortas, cada una deja algo usable.

## 6. Próximo paso

Aprobar este plan y partir con la **Fase 0** (riesgos de seguridad del sitio en producción).
