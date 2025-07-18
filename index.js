const express = require('express');
const cors = require('cors');
const axios = require('axios');
const http = require('http');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Requiere agente con keepAlive para streaming fluido
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

app.get('/relay', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'Falta el parámetro ?url=' });
  }

  try {
    const parsed = new URL(url);
    const agent = parsed.protocol === 'https:' ? httpsAgent : httpAgent;

    const streamResponse = await axios({
      method: 'get',
      url: parsed.href,
      responseType: 'stream',
      headers: {
        // Cabeceras que podrían ser necesarias para evitar bloqueo
        'User-Agent': 'Mozilla/5.0',
        'Referer': parsed.origin,
      },
      httpAgent,
      httpsAgent,
    });

    // Encabezados del stream original
    res.set(streamResponse.headers);

    // Pipear el stream original al cliente
    streamResponse.data.pipe(res);
  } catch (err) {
    console.error('Error al hacer proxy del stream:', err.message);
    res.status(500).json({ error: 'No se pudo hacer proxy al stream' });
  }
});

app.get('/', (req, res) => {
  res.send('Servidor Relay activo. Usa /relay?url=...');
});

app.listen(PORT, () => {
  console.log(`Servidor Relay corriendo en http://localhost:${PORT}`);
});
