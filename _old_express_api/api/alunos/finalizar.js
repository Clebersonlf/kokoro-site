import { createClient } from '@vercel/postgres';

// Endpoint oficial: finaliza/preenche cadastro básico do aluno
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    // ⚠️ usa sempre a conexão POOLING da Vercel/Neon
    const POOL = process.env.POSTGRES_URL;
    if (!POOL) {
      return res.status(500).json({ ok:false, error:'POSTGRES_URL não definido no ambiente' });
    }

    // conecta
    const client = createClient({ connectionString: POOL });
    await client.connect();

    // body
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const {
      token,          // pode ser usado depois para validar convites
      nome,
      email,
      telefone,
      whatsapp,
      endereco,
      nascimento,     // "YYYY-MM-DD" preferencialmente
      observacoes
    } = body;

    // validações mínimas
    if (!token)  return res.status(400).json({ ok:false, error:'Falta token' });
    if (!nome)   return res.status(400).json({ ok:false, error:'Falta nome' });
    if (!email)  return res.status(400).json({ ok:false, error:'Falta email' });

    // 🔐 NÃO criamos/alteramos schema aqui para evitar conflitos.
    // Supomos que a tabela "alunos" já existe com:
    // id (uuid com default), nome, email UNIQUE, telefone, whatsapp, endereco, nascimento (date), observacoes, criado_em (timestamp)
    // ▶ se for preciso ajustar o schema, fazemos por script separado.

    // UPSERT por email (sem tocar no id — deixamos o banco gerá-lo via default)
    const { rows } = await client.sql`
      INSERT INTO alunos (nome, email, telefone, whatsapp, endereco, nascimento, observacoes)
      VALUES (
        ${nome},
        ${email},
        ${telefone || null},
        ${whatsapp || null},
        ${endereco || null},
        ${nascimento || null},
        ${observacoes || null}
      )
      ON CONFLICT (email) DO UPDATE
      SET nome        = EXCLUDED.nome,
          telefone    = EXCLUDED.telefone,
          whatsapp    = EXCLUDED.whatsapp,
          endereco    = EXCLUDED.endereco,
          nascimento  = EXCLUDED.nascimento,
          observacoes = EXCLUDED.observacoes
      RETURNING id, nome, email, telefone, whatsapp, endereco, nascimento, observacoes, criado_em;
    `;

    await client.end();
    return res.status(200).json({ ok:true, aluno: rows[0] || null, used:'POSTGRES_URL' });
  } catch (e) {
    // log simples (Vercel mostra no painel/logs)
    console.error('[alunos/finalizar] erro:', e);
    return res.status(500).json({ ok:false, error: String(e) });
  }
}
