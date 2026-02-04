// api/alunos.js (ESM)
import { neon } from '@neondatabase/serverless';

function getDbUrl() {
    return (
        process.env.NEON_DATABASE_URL ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.POSTGRES_PRISMA_URL ||
        process.env.POSTGRES_URL_NON_POOLING
    );
}

// leitura segura do corpo (Vercel Node não faz parse automático)
async function readBody(req) {
    if (req.body) return req.body; // em alguns ambientes já vem pronto
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

export default async function handler(req, res) {
    // CORS simples (ajuda quando chamar do navegador mais tarde)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();

    const url = getDbUrl();
    if (!url) {
        return res.status(500).json({
            ok: false,
            error: 'Sem variável de conexão (NEON_DATABASE_URL/DATABASE_URL/POSTGRES_*)'
        });
    }

    const sql = neon(url);

    try {
        if (req.method === 'GET') {
            const alunos = await sql`
        SELECT id, nome, email, telefone, numero_vitalicio, status, criado_em
        FROM alunos
        ORDER BY criado_em DESC
        LIMIT 50
      `;
            return res.status(200).json({ ok: true, alunos });
        }

        if (req.method === 'POST') {
            const body = await readBody(req);
            const { nome, email, telefone, numero_vitalicio, selfie_url } = body;

            if (!nome) {
                return res.status(400).json({ ok: false, error: 'Campo "nome" é obrigatório.' });
            }

            const inserted = await sql`
        INSERT INTO alunos (nome, email, telefone, numero_vitalicio, selfie_url)
        VALUES (${nome}, ${email ?? null}, ${telefone ?? null}, ${numero_vitalicio ?? null}, ${selfie_url ?? null})
        RETURNING id, nome, email, telefone, numero_vitalicio, status, criado_em
      `;
            return res.status(201).json({ ok: true, aluno: inserted[0] });
        }

        res.setHeader('Allow', 'GET, POST, OPTIONS');
        return res.status(405).json({ ok: false, error: 'Method not allowed' });

    } catch (err) {
        return res.status(500).json({ ok: false, error: String(err) });
    }
}