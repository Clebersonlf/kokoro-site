import crypto from 'node:crypto';
import { Client } from 'pg';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok:false, message:'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const { aluno_id, nome, email, telefone, via = 'email' } = body;

    const DOMAIN = 'https://www.planckkokoro.com';
    const linkFromToken = (t) => `${DOMAIN}/completar-cadastro.html?token=${encodeURIComponent(t)}`;

    // Conexão Postgres
    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!url) return res.status(500).json({ ok:false, message:'POSTGRES_URL não configurado' });
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    await client.connect();

    let aluno;
    if (aluno_id) {
      // Reaproveita um aluno já criado
      const r = await client.query('SELECT id, nome, email, telefone, token_cadastro FROM alunos WHERE id = $1', [aluno_id]);
      if (!r.rows.length) {
        await client.end();
        return res.status(404).json({ ok:false, message: 'Aluno não encontrado' });
      }
      aluno = r.rows[0];
      if (!aluno.token_cadastro) {
        const token = crypto.randomUUID();
        await client.query('UPDATE alunos SET token_cadastro = $1 WHERE id = $2', [token, aluno_id]);
        aluno.token_cadastro = token;
      }
    } else {
      // Cria cadastro mínimo
      if (!email) {
        await client.end();
        return res.status(400).json({ ok:false, message:'Informe ao menos email' });
      }
      const token = crypto.randomUUID();
      const r = await client.query(
        `INSERT INTO alunos (nome, email, telefone, status, token_cadastro, criado_em)
         VALUES ($1, $2, $3, 'pendente', $4, NOW())
         ON CONFLICT (email) DO UPDATE
            SET nome = COALESCE(EXCLUDED.nome, alunos.nome),
                telefone = COALESCE(EXCLUDED.telefone, alunos.telefone),
                status = 'pendente',
                token_cadastro = COALESCE(alunos.token_cadastro, EXCLUDED.token_cadastro)
         RETURNING id, nome, email, telefone, token_cadastro`,
        [nome || null, email, telefone || null, token]
      );
      aluno = r.rows[0];
      if (!aluno.token_cadastro) {
        // Em raras condições, garanta token
        const newTok = crypto.randomUUID();
        await client.query('UPDATE alunos SET token_cadastro = $1 WHERE id = $2', [newTok, aluno.id]);
        aluno.token_cadastro = newTok;
      }
    }

    const link = linkFromToken(aluno.token_cadastro);

    // Sugestões de disparo manual
    const texto = encodeURIComponent(
      `Olá${aluno.nome ? ' ' + aluno.nome : ''}! Seja bem-vindo(a) ao Kokoro.\n` +
      `Para completar seu cadastro, acesse: ${link}\n\n` +
      `Qualquer dúvida, responda esta mensagem.`
    );
    const whatsapp = aluno.telefone ? `https://wa.me/${aluno.telefone.replace(/\D/g,'')}?text=${texto}` : null;
    const sms      = aluno.telefone ? `sms:+${aluno.telefone.replace(/\D/g,'')}?&body=${texto}` : null;
    const mailto   = aluno.email    ? `mailto:${encodeURIComponent(aluno.email)}?subject=${encodeURIComponent('Complete seu cadastro no Kokoro')}&body=${texto}` : null;

    // Envio por e-mail automático (opcional, se existir RESEND_API_KEY)
    let emailSent = false;
    if (via === 'email' && process.env.RESEND_API_KEY && aluno.email) {
      try {
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Kokoro <no-reply@planckkokoro.com>',
            to: [aluno.email],
            subject: 'Complete seu cadastro no Kokoro',
            html: `<p>Olá${aluno.nome ? ' ' + aluno.nome : ''}!</p>
                   <p>Para completar seu cadastro, clique no link abaixo:</p>
                   <p><a href="${link}">${link}</a></p>
                   <p>Se você não reconhece esta mensagem, ignore.</p>`
          })
        });
        emailSent = resp.ok;
      } catch(_) { emailSent = false; }
    }

    await client.end();
    return res.status(200).json({
      ok: true,
      aluno,
      link,
      delivery: {
        viaRequested: via,
        emailSent,
        suggestions: { whatsapp, sms, mailto }
      }
    });
  } catch (e) {
    return res.status(500).json({ ok:false, message:'Erro no send-welcome', error: String(e) });
  }
}
