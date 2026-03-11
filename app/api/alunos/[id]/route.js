import { sql } from '../../../../pages/api/_lib/db.js';

function serializeAluno(aluno) {
  if (!aluno) return null;
  
  return {
    id: String(aluno.id || ''),
    nome: String(aluno.nome || ''),
    email: String(aluno.email || ''),
    faixa: String(aluno.faixa || ''),
    grau: String(aluno.grau || ''),
    ultima: String(aluno.ultima || '-'),
    financeiro: String(aluno.financeiro || 'ok'),
    status: String(aluno.status || 'ativo'),
    numeroCertificado: String(aluno.numero_certificado || ''),
    observacoes: String(aluno.observacoes || ''),
    historico: Array.isArray(aluno.historico) ? aluno.historico : []
  };
}

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const r = await sql`SELECT * FROM alunos WHERE id = ${id}`;
    if (!r || !r[0]) {
      return Response.json({ error: 'Aluno não encontrado' }, { status: 404 });
    }
    return Response.json(serializeAluno(r[0]));
  } catch (e) {
    console.error('Erro GET:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { nome, email, faixa, grau, financeiro, status } = body;

    const r = await sql`
      UPDATE alunos 
      SET 
        nome = COALESCE(${nome}, nome),
        email = COALESCE(${email}, email),
        faixa = COALESCE(${faixa}, faixa),
        grau = COALESCE(${grau}, grau),
        financeiro = COALESCE(${financeiro}, financeiro),
        status = COALESCE(${status}, status),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!r || !r[0]) {
      return Response.json({ error: 'Aluno não encontrado' }, { status: 404 });
    }

    return Response.json(serializeAluno(r[0]));
  } catch (e) {
    console.error('Erro PUT:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await sql`DELETE FROM alunos WHERE id = ${id}`;
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error('Erro DELETE:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
