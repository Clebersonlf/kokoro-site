import { sql } from '../_lib/db.js';

function toISODateBR(value) {
  const v = (value ?? '').toString().trim();
  if (!v) return null;

  // Aceita "DD/MM/AAAA"
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    if (yyyy < 1900 || yyyy > 2100) return null;
    if (mm < 1 || mm > 12) return null;
    if (dd < 1 || dd > 31) return null;
    return `${String(yyyy).padStart(4,'0')}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
  }

  // Se já vier "YYYY-MM-DD", aceita também
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  return null;
}

// Endpoint oficial: finaliza/preenche cadastro básico do aluno
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const {
      token,          // pode ser usado depois para validar convites
      nome,
      email,
      telefone,
      whatsapp,
      endereco,
      nascimento,     // preferencial: "DD/MM/AAAA"
      observacoes
    } = body;

    if (!token)  return res.status(400).json({ ok:false, error:'Falta token' });
    if (!nome)   return res.status(400).json({ ok:false, error:'Falta nome' });
    if (!email)  return res.status(400).json({ ok:false, error:'Falta email' });

    const nascimentoISO = toISODateBR(nascimento);
    if (nascimento && !nascimentoISO) {
      return res.status(400).json({ ok:false, error:'Nascimento inválido. Use DD/MM/AAAA' });
    }

    const { rows } = await sql`
      INSERT INTO alunos (nome, email, telefone, whatsapp, endereco, nascimento, observacoes)
      VALUES (
        ${String(nome).trim()},
        ${String(email).trim().toLowerCase()},
        ${telefone ? String(telefone).trim() : null},
        ${whatsapp ? String(whatsapp).trim() : null},
        ${endereco ? String(endereco).trim() : null},
        ${nascimentoISO},
        ${observacoes ? String(observacoes).trim() : null}
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

    return res.status(200).json({ ok:true, aluno: rows[0] || null, used:'_lib/db.js' });
  } catch (e) {
    console.error('[alunos/finalizar] erro:', e);
    return res.status(500).json({ ok:false, error: String(e) });
  }
}
