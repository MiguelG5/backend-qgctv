const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint que recibe la URL completa (con token) y proxy al stream
app.post('/proxy-stream', (req, res, next) => {
  const { fullUrl } = req.body;
  if (!fullUrl) {
    return res.status(400).json({ error: 'Falta el parámetro fullUrl' });
  }

  try {
    // Validar que fullUrl sea URL válida
    new URL(fullUrl);
    req.fullUrl = fullUrl;
    next();
  } catch (error) {
    return res.status(400).json({ error: 'URL inválida' });
  }
});

// Proxy middleware dinámico según URL recibida
app.use('/proxy-stream', (req, res, next) => {
  if (!req.fullUrl) {
    return res.status(400).json({ error: 'No se proporcionó URL para proxy' });
  }

  // Extraer origen base (protocolo + host) para proxy
  const urlObj = new URL(req.fullUrl);
  const target = urlObj.origin;

  // Crear path con pathname + search params
  const path = urlObj.pathname + urlObj.search;

  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: {
      '^/proxy-stream': path,
    },
    logLevel: 'debug',
  })(req, res, next);
});

app.get('/', (req, res) => {
  res.send('Proxy puro para streaming, recibe URLs completas con token');
});

app.listen(PORT, () => {
  console.log(`Servidor backend proxy corriendo en http://localhost:${PORT}`);
});
