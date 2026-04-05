import { sql } from '../../../../pages/api/_lib/db.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const id = Number(body.id || 0);

    if (!id) {
      return Response.json({ ok:false, message:'id é obrigatório' }, { status:400 });
    }

    const result = await sql`
      DELETE FROM sessoes
      WHERE id = ${id}
      RETURNING *;
    `;

    return Response.json({ ok:true, item: result.rows?.[0] || result[0] || null });
  } catch (e) {
    return Response.json({ ok:false, message:'Erro ao excluir sessão', error:String(e) }, { status:500 });
  }
}
