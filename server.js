const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Werkstatt Insider API läuft', version: '1.1' });
});

// Fahrzeugschein scan endpoint
app.post('/scan', async (req, res) => {
  try {
    const { imageData, mediaType } = req.body;
    if (!imageData) return res.status(400).json({ error: 'Kein Bild übermittelt' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType || 'image/jpeg',
                data: imageData
              }
            },
            {
              type: 'text',
              text: 'Lies aus diesem Fahrzeugschein-Foto alle Fahrzeugdaten aus. Antworte NUR mit einem JSON-Objekt ohne Backticks oder Erklaerungen: {"kennzeichen":"","hersteller":"","modell":"","fin":"","baujahr":"","farbe":"","kraftstoff":""}\nKraftstoff nur: Benzin, Diesel, Hybrid, Elektro oder LPG'
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const text = (data.content || []).find(c => c.type === 'text')?.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (e) {
      parsed = {};
    }

    res.json({ success: true, data: parsed });

  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Server-Fehler: ' + err.message });
  }
});

// Personalausweis scan endpoint
app.post('/scan-perso', async (req, res) => {
  try {
    const { imageData, mediaType } = req.body;
    if (!imageData) return res.status(400).json({ error: 'Kein Bild übermittelt' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType || 'image/jpeg',
                data: imageData
              }
            },
            {
              type: 'text',
              text: 'Lies aus diesem Foto eines Personalausweises die Daten der Person aus, die fuer eine Werkstatt-Kundenanlage benoetigt werden. Antworte NUR mit einem JSON-Objekt ohne Backticks oder Erklaerungen: {"vorname":"","nachname":"","strasse":"","plzort":"","geburtsdatum":""}\nFalls ein Feld nicht lesbar ist, lasse es leer.'
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const text = (data.content || []).find(c => c.type === 'text')?.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (e) {
      parsed = {};
    }

    res.json({ success: true, data: parsed });

  } catch (err) {
    console.error('Scan-Perso error:', err);
    res.status(500).json({ error: 'Server-Fehler: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Werkstatt Insider Proxy läuft auf Port ${PORT}`);
});

