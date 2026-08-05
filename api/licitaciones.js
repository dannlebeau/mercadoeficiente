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

  // La API de Mercado Público soporta tres modos de búsqueda mutuamente
  // excluyentes: por código, por fecha de publicación (ddmmyyyy) o por estado
  // (p.ej. "activas"). Este proxy pasa el que venga tal cual.
  const codigo = (req.query.codigo || '').toString().trim();
  const fecha = (req.query.fecha || '').toString().trim();
  const estado = (req.query.estado || '').toString().trim();

  if (!codigo && !fecha && !estado) {
    return res.status(400).json({ error: 'Falta el parámetro codigo, fecha o estado' });
  }

  const params = new URLSearchParams({ ticket });
  if (codigo) params.set('codigo', codigo);
  if (fecha) params.set('fecha', fecha);
  if (estado) params.set('estado', estado);

  const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?${params.toString()}`;

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
