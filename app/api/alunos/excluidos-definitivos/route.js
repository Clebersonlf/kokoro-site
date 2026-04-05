import { sql } from '../../../../pages/api/_lib/db.js';

export async function GET() {
  try {
    const rows = await sql`
      SELECT
        id,
        nome,
        email,
        faixa,
        grau,
        financeiro,
        status,
        numero_certificado,
        observacoes,
        historico,
        motivo_exclusao,
        excluido_em,
        readmitido_em,
        readmitido_por,
        id_aluno_reativado,
        motivo_readmissao
      FROM alunos_excluidos_definitivos
      ORDER BY excluido_em DESC
    `;

    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
