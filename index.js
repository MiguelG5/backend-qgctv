const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');
const http = require('http');
const https = require('https');

const app = express();

// Carga las credenciales Firebase desde variable de entorno JSON
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

app.use(cors());

app.get('/relay/:id', async (req, res) => {
  const id = req.params.id;

  try {
    // Obtén documento con link desde Firebase
    const doc = await db.collection('transmisiones').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Transmisión no encontrada' });
    }

    const url = doc.data().link;

    if (!url) {
      return res.status(400).json({ error: 'URL de transmisión no disponible' });
    }

    const parsed = new URL(url);
    const agent = parsed.protocol === 'https:' ? httpsAgent : httpAgent;

    // Petición para obtener el stream en modo stream
    const streamResponse = await axios({
      method: 'get',
      url: parsed.href,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': parsed.origin, // necesario para evitar bloqueos CORS o anti-bots
      },
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 15000, // timeout opcional para evitar bloqueos infinitos
    });

    // Setea headers para que el cliente entienda el tipo de contenido
    res.set({
      'Content-Type': streamResponse.headers['content-type'] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });

    // Pipea el stream directamente al cliente
    streamResponse.data.pipe(res);
  } catch (error) {
    console.error('Error al hacer proxy del stream:', error.message);
    res.status(500).json({ error: 'No se pudo hacer proxy al stream' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Relay corriendo en puerto ${PORT}`);
});
