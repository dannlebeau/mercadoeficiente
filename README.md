# Mercado Eficiente

🔗 **Se ve acá: [www.mercadoeficiente.cl](https://www.mercadoeficiente.cl)**

🗺️ Mercado Eficiente by Geopolis
Visualizador simple de licitaciones públicas de Chile (ChileCompra), pensado como complemento —no reemplazo— de mercadopublico.cl.

## Arquitectura

Sitio estático (HTML/CSS/JS, sin build) + una función serverless (`api/licitaciones.js`) que hace de proxy hacia la API de Mercado Público. El ticket de integración de ChileCompra vive solo en el servidor (variable de entorno `MP_API_TICKET`), nunca en el código que llega al navegador.

Esto requiere una plataforma con soporte de funciones serverless — **Vercel** (recomendado, cero configuración adicional para el contenido de `/api`).

## Configuración y despliegue (Vercel)

1. Importar el repo en Vercel.
2. En **Project Settings → Environment Variables**, agregar `MP_API_TICKET` con el ticket real de ChileCompra (ver `.env.example`).
3. Apuntar el dominio `www.mercadoeficiente.cl` al proyecto desde **Project Settings → Domains**.

## Desarrollo local

Un servidor estático puro (Live Server, etc.) no puede ejecutar `api/licitaciones.js` — las búsquedas fallarían. Para probar en local con la API funcionando:

1. Copiar `.env.example` a `.env` y completar `MP_API_TICKET`.
2. `node dev-server.js`
3. Abrir `http://localhost:3000`

(`dev-server.js` es un servidor de desarrollo sin dependencias que emula el proxy; no se usa en producción, ahí corre `api/licitaciones.js` como función serverless de Vercel.)

## Estructura

```
├── index.html
├── api/
│   └── licitaciones.js   # Proxy serverless (producción) — oculta el ticket de ChileCompra
├── dev-server.js         # Servidor de desarrollo local (emula el proxy)
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── img/
└── .env.example
```

## Licencia

Elaborado por Dann LeBeau · Mercado Eficiente by Geopolis. Todos los derechos reservados © 2026.
