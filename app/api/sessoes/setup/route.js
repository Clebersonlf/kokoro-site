import { sql } from '../../../../pages/api/_lib/db.js';

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS sessoes (
        id SERIAL PRIMARY KEY,
        aluno_id INTEGER,
        data_sessao DATE NOT NULL DEFAULT CURRENT_DATE,
        hora_inicio TEXT DEFAULT '',
        hora_fim TEXT DEFAULT '',
        tipo TEXT DEFAULT 'normal',
        horas_aula INTEGER DEFAULT 2,
        professor TEXT DEFAULT '',
        plano_aula TEXT DEFAULT '',
        aula_ministrada TEXT DEFAULT '',
        tipo_treino TEXT DEFAULT '',
        tecnica_ministrada TEXT DEFAULT '',
        observacoes TEXT DEFAULT '',
        status TEXT DEFAULT 'validada',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    const cnt = await sql`SELECT COUNT(*) as total FROM sessoes`;

    return Response.json({
      ok: true,
      msg: 'Tabela de sessoes pronta',
      total: cnt[0].total
    });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
