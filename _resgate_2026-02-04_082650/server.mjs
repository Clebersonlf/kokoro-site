// server.mjs
    import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config(); // lê o .env

const app = express();
app.use(cors());            // libera chamadas do seu site
app.use(express.json());    // JSON no body

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(__dirname));


// Cliente OpenAI usa a chave do .env (NÃO coloque chave aqui!)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Rota que gera UMA frase motivacional
app.post("/api/motivacao", async (req, res) => {
    const { lang = "pt", tema = "artes marciais" } = req.body || {};

const system = `
Você é um gerador de mensagens motivacionais CURTAS para artes marciais.

REGRAS OBRIGATÓRIAS:
- Escreva SOMENTE na língua alvo: ${lang}
- NÃO inclua tradução
- NÃO explique a frase
- Apenas UMA frase
- Máximo 120 caracteres
- Linguagem forte, direta e inspiradora
`.trim();

    try {
        const resp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.9,
            messages: [
                { role: "system", content: system },
                { role: "user", content: `Crie 1 frase motivacional sobre ${tema}.`}
            ]
        });

        const text = resp.choices?.[0]?.message?.content?.trim() || "";
        return res.json({ text });
    } catch (err) {
        console.error("Erro OpenAI:", err);
        return res.status(500).json({ error: "Falha ao gerar mensagem" });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`✅ Servidor no ar: http://localhost:${PORT}`);
});
