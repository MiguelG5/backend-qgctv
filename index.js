const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Función simulada para generar el token (puedes reemplazar esto con lógica real)
function generarToken(urlBase, ip) {
  // Aquí pondrías tu lógica para generar un token válido
  return 'e288c522610b73a6b0acc88157a68af6af95d18c-1e-1752852473-1752798473';
}

// 🧠 Paso 1: Generar la URL con la IP y el token
app.post('/generate-url', (req, res) => {
  const { baseUrl } = req.body;
  if (!baseUrl) {
    return res.status(400).json({ error: 'Falta el parámetro baseUrl' });
  }

  // Obtener IP real del cliente
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  if (ip.includes(',')) ip = ip.split(',')[0].trim();
  if (ip.includes('::ffff:')) ip = ip.split('::ffff:')[1];

  const token = generarToken(baseUrl, ip);

  try {
    const urlObj = new URL(baseUrl);
    urlObj.searchParams.set('ip', ip);
    urlObj.searchParams.set('token', token);
    const finalUrl = urlObj.toString();
    console.log(`✅ URL generada para IP ${ip}: ${finalUrl}`);
    return res.json({ url: finalUrl });
  } catch (error) {
    console.error('❌ Error al construir la URL:', error);
    return res.status(500).json({ error: 'Error interno al procesar la URL' });
  }
});

// 🛰️ Paso 2: Proxy que recibe una URL y la retransmite desde este backend
app.post('/proxy-stream', (req, res, next) => {
  const { fullUrl } = req.body;
  if (!fullUrl) {
    return res.status(400).json({ error: 'Falta el parámetro fullUrl' });
  }

  try {
    new URL(fullUrl);
    req.fullUrl = fullUrl;
    next();
  } catch (error) {
    return res.status(400).json({ error: 'URL inválida' });
  }
});

// Middleware dinámico del proxy
app.use('/proxy-stream', (req, res, next) => {
  if (!req.fullUrl) {
    return res.status(400).json({ error: 'No se proporcionó URL para proxy' });
  }

  const urlObj = new URL(req.fullUrl);
  const target = urlObj.origin;
  const path = urlObj.pathname + urlObj.search;

  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: {
      '^/proxy-stream': path,
    },
    logLevel: 'debug',
  })(req, res, next);
});

// Ruta raíz
app.get('/', (req, res) => {
  res.send('🛡️ Servidor activo. Puedes generar URLs con token y hacer proxy de streams.');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
