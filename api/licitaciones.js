// Proxy serverless (Vercel) hacia la API de Mercado Público — mantiene el
// ticket de ChileCompra fuera del código del navegador.
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const ticket = process.env.MP_API_TICKET;
  if (!ticket) {
    console.error('❌ MP_API_TICKET no está configurado en el servidor.');
    return res.status(500).json({ error: 'Servidor no configurado' });
  }

  const codigo = (req.query.codigo || '').toString().trim();
  if (!codigo) {
    return res.status(400).json({ error: 'Falta el parámetro codigo' });
  }

  const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=${encodeURIComponent(codigo)}&ticket=${ticket}`;

  try {
    const upstream = await fetch(url);
    const data = await upstream.json();
    res.setHeader('Cache-Control', 'no-store');
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error('❌ Error consultando Mercado Público:', err.message);
    res.status(502).json({ error: 'No se pudo consultar Mercado Público' });
  }
};
