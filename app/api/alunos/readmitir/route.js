import { sql } from '../../../../pages/api/_lib/db.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, motivo_readmissao = '', readmitido_por = 'admin' } = body || {};

    if (!id) {
      return Response.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    const rows = await sql`
      SELECT * FROM alunos_excluidos_definitivos
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!rows || !rows[0]) {
      return Response.json({ error: 'Aluno excluído não encontrado' }, { status: 404 });
    }

    const reg = rows[0];
    const payload = reg.payload_completo || {};
    const payloadVazio = !payload || Object.keys(payload).length === 0;

    const alunoId = (payload && payload.id) || reg.id;

    const existente = await sql`
      SELECT id FROM alunos WHERE id = ${alunoId} LIMIT 1
    `;
    if (existente && existente[0]) {
      return Response.json({ error: 'Já existe aluno ativo com esse ID' }, { status: 409 });
    }

    await sql`
      INSERT INTO alunos (
        id, nome, email, faixa, grau, ultima, financeiro, status,
        numero_certificado, observacoes, historico, updated_at
      ) VALUES (
        ${alunoId},
        ${payload.nome || reg.nome || ''},
        ${(payload.email || reg.email) ? (payload.email || reg.email) : null},
        ${payload.faixa || reg.faixa || 'branca'},
        ${payload.grau || reg.grau || '0º Grau'},
        ${payload.ultima || '-'},
        ${payload.financeiro || reg.financeiro || 'ok'},
        ${'ativo'},
        ${payload.numero_certificado || reg.numero_certificado || ''},
        ${payload.observacoes || reg.observacoes || ''},
        ${JSON.stringify(Array.isArray(payload.historico) ? payload.historico : [])}::jsonb,
        NOW()
      )
    `;

    await sql`
      UPDATE alunos_excluidos_definitivos
      SET
        readmitido_em = NOW(),
        readmitido_por = ${readmitido_por},
        id_aluno_reativado = ${alunoId},
        motivo_readmissao = ${motivo_readmissao}
      WHERE id = ${id}
    `;

    return Response.json({ ok: true, id: alunoId });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
