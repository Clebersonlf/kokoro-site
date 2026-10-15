import { exigirAdminApp } from '../../_lib/kokoro-auth-app.js';
import { sql } from '../../../../pages/api/_lib/db.js';

export async function POST(req) {
  const bloqueio = exigirAdminApp(req, { mutacao: true });
  if (bloqueio) return bloqueio;
  try {
    const body = await req.json();

    const id = Number(body.id || 0);
    const hora_inicio = (body.hora_inicio || '').toString().trim();
    const hora_fim = (body.hora_fim || '').toString().trim();
    const horas_aula = Number(body.horas_aula || 0);
    const professor = (body.professor || '').toString().trim();
    const plano_aula = (body.plano_aula || '').toString().trim();
    const aula_ministrada = (body.aula_ministrada || '').toString().trim();
    const tipo_treino = (body.tipo_treino || '').toString().trim();
    const tecnica_ministrada = (body.tecnica_ministrada || '').toString().trim();
    const observacoes = (body.observacoes || '').toString().trim();
    const status = (body.status || '').toString().trim();

    if (!id) {
      return Response.json({ ok:false, message:'id é obrigatório' }, { status:400 });
    }

    const result = await sql`
      UPDATE sessoes
      SET
        hora_inicio = COALESCE(NULLIF(${hora_inicio}, ''), hora_inicio),
        hora_fim = COALESCE(NULLIF(${hora_fim}, ''), hora_fim),
        horas_aula = CASE WHEN ${horas_aula} > 0 THEN ${horas_aula} ELSE horas_aula END,
        professor = COALESCE(NULLIF(${professor}, ''), professor),
        plano_aula = COALESCE(NULLIF(${plano_aula}, ''), plano_aula),
        aula_ministrada = COALESCE(NULLIF(${aula_ministrada}, ''), aula_ministrada),
        tipo_treino = COALESCE(NULLIF(${tipo_treino}, ''), tipo_treino),
        tecnica_ministrada = COALESCE(NULLIF(${tecnica_ministrada}, ''), tecnica_ministrada),
        observacoes = COALESCE(NULLIF(${observacoes}, ''), observacoes),
        status = COALESCE(NULLIF(${status}, ''), status),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    return Response.json({ ok:true, item: result.rows?.[0] || result[0] || null });
  } catch (e) {
    return Response.json({ ok:false, message:'Erro ao atualizar sessão', error:String(e) }, { status:500 });
  }
}
