import { sql } from '../../../../pages/api/_lib/db.js';

export async function POST(req) {
  try {
    const body = await req.json();

    const aluno_id = Number(body.aluno_id || 0);
    const data_sessao = (body.data_sessao || '').toString().trim() || new Date().toISOString().slice(0,10);
    const hora_inicio = (body.hora_inicio || '').toString().trim();
    const hora_fim = (body.hora_fim || '').toString().trim();
    const tipo = (body.tipo || 'normal').toString().trim();
    const horas_aula = Number(body.horas_aula || 2);
    const professor = (body.professor || '').toString().trim();
    const plano_aula = (body.plano_aula || '').toString().trim();
    const aula_ministrada = (body.aula_ministrada || '').toString().trim();
    const tipo_treino = (body.tipo_treino || '').toString().trim();
    const tecnica_ministrada = (body.tecnica_ministrada || '').toString().trim();
    const observacoes = (body.observacoes || '').toString().trim();
    const status = (body.status || 'validada').toString().trim();

    if (!aluno_id) {
      return Response.json({ ok:false, message:'aluno_id é obrigatório' }, { status:400 });
    }

    const result = await sql`
      INSERT INTO sessoes (
        aluno_id, data_sessao, hora_inicio, hora_fim, tipo, horas_aula,
        professor, plano_aula, aula_ministrada, tipo_treino,
        tecnica_ministrada, observacoes, status
      )
      VALUES (
        ${aluno_id}, ${data_sessao}, ${hora_inicio}, ${hora_fim}, ${tipo}, ${horas_aula},
        ${professor}, ${plano_aula}, ${aula_ministrada}, ${tipo_treino},
        ${tecnica_ministrada}, ${observacoes}, ${status}
      )
      RETURNING *;
    `;

    return Response.json({ ok:true, item: result.rows?.[0] || result[0] || null });
  } catch (e) {
    return Response.json({ ok:false, message:'Erro ao criar sessão', error:String(e) }, { status:500 });
  }
}
