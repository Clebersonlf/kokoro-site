// server.js (ESM)
// Backend que gera a frase motivacional e serve seus arquivos estáticos

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

// ====== setup básico ======
const app = express();
app.use(express.json());

// CORS liberado para dev local (inclui "origin: null" de arquivo aberto do disco)
app.use(cors({ origin: true }));

// calcula __dirname com ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// servir arquivos estáticos (html, css, js, imagens)
app.use(express.static(__dirname));
app.get('/', (_req, res) => res.redirect('/home.html'));

// ====== OpenAI ======
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Endpoint para gerar 1 frase motivacional curta + tradução
// POST /api/motivacao  { lang: "ja", translateTo: "pt-BR" }
app.post('/api/motivacao', async (req, res) => {
  try {
    const { lang = 'ja', translateTo = 'pt-BR' } = req.body || {};

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
              'Você gera UMA frase motivacional curta, apropriada para artes marciais (respeitosa, positiva). Responda em JSON com as chaves: original_lang, original_text, translated_lang, translated_text.'
        },
        {
          role: 'user',
          // >>> as crases eram o erro
          content: `Gere 1 frase motivacional em ${lang}. Traduza para ${translateTo}. Mantenha curto (máx 80 caracteres cada).`
        }
      ]
    });

    const json = completion.choices[0]?.message?.content || '{}';
    const data = JSON.parse(json);

    return res.json({
      ok: true,
      original_lang: data.original_lang,
      original_text: data.original_text,
      translated_lang: data.translated_lang,
      translated_text: data.translated_text
    });
  } catch (err) {
    console.error('Erro /api/motivacao:', err);
    return res.status(500).json({ ok: false, error: 'Falha ao gerar frase.' });
  }
});

// sobe o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Kokoro backend rodando em http://localhost:${PORT}`);
});
