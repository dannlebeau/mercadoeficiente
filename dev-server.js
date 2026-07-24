// Servidor de desarrollo LOCAL — sirve los archivos estáticos y emula
// /api/licitaciones (que en producción corre como función serverless en
// Vercel, ver api/licitaciones.js). Un servidor estático puro (Live Server,
// etc.) no puede ejecutar esa función, por eso las búsquedas fallan ahí.
//
// Uso:
//   1. Copiar .env.example a .env y completar MP_API_TICKET
//   2. node dev-server.js
//   3. Abrir http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');

function cargarEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
}
cargarEnv();

const PORT = process.env.PORT || 3000;
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.txt': 'text/plain',
};

async function manejarLicitaciones(url, res) {
  const ticket = process.env.MP_API_TICKET;
  if (!ticket) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Falta MP_API_TICKET en .env' }));
  }
  const codigo = (url.searchParams.get('codigo') || '').trim();
  if (!codigo) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Falta el parámetro codigo' }));
  }
  try {
    const upstream = await fetch(`https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=${encodeURIComponent(codigo)}&ticket=${ticket}`);
    const data = await upstream.json();
    res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No se pudo consultar Mercado Público' }));
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/licitaciones') {
    return manejarLicitaciones(url, res);
  }

  const filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      return res.end('No encontrado');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => console.log(`🌐 Servidor local en http://localhost:${PORT}`));
