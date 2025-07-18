const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para permitir CORS y parsear JSON
app.use(cors());
app.use(express.json());

// Función simulada para generar token - aquí agrega tu lógica real
function generarToken(urlBase, ip) {
  // Ejemplo: un token ficticio, aquí pondrías el algoritmo real
  // Podrías usar JWT, HMAC, etc.
  // Recuerda que el token puede depender de la URL base y la IP
  return 'TOKEN_GENERADO_SEGURAMENTE';
}

// Endpoint para generar URL con token + IP
app.post('/generate-url', (req, res) => {
  const { baseUrl } = req.body;
  if (!baseUrl) {
    return res.status(400).json({ error: 'Falta el parámetro baseUrl' });
  }

  // Obtener IP real del cliente
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim(); // En caso de proxies múltiples
  }
  if (ip.includes('::ffff:')) {
    ip = ip.split('::ffff:')[1];
  }

  // Generar token (simulado)
  const token = generarToken(baseUrl, ip);

  try {
    // Construir URL final evitando parámetros duplicados
    const urlObj = new URL(baseUrl);

    if (!urlObj.searchParams.has('ip')) {
      urlObj.searchParams.append('ip', ip);
    }
    if (!urlObj.searchParams.has('token')) {
      urlObj.searchParams.append('token', token);
    }

    const finalUrl = urlObj.toString();

    console.log(`URL generada para IP ${ip}: ${finalUrl}`);

    return res.json({ url: finalUrl });
  } catch (error) {
    console.error('Error al construir la URL:', error);
    return res.status(500).json({ error: 'Error interno al procesar la URL' });
  }
});

// Ruta raíz para prueba rápida
app.get('/', (req, res) => {
  res.send('Backend de generación de URLs de streaming con token');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
