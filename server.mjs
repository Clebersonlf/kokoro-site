> Cleberson:
// server.mjs
    import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config(); // lê o .env

const app = express();
app.use(cors());            // libera chamadas do seu site
app.use(express.json());    // JSON no body

// Cliente OpenAI usa a chave do .env (NÃO coloque chave aqui!)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Rota que gera UMA frase motivacional
app.post("/api/motivacao", async (req, res) => {
    const { lang = "pt", tema = "artes marciais" } = req.body || {};

    const system = `
Você é um gerador de mensagens motivacionais CURTAS e não repetidas para artes marciais.
Regras:
- Escreva na língua alvo: ${lang}.
- Máximo 120 caracteres na frase principal.
- Se a língua alvo NÃO for pt, na linha de baixo traga a tradução em pt-br entre parênteses.
Formato exato:
linha 1: frase no idioma alvo
linha 2: (Português) tradução
  `.trim();

    try {
        const resp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.9,
            messages: [
                { role: "system", content: system },
                { role: "user", content: Crie 1 frase motivacional sobre ${tema}. }
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
