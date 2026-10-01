import { neon } from '@neondatabase/serverless';

function getSql() {
  const url =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!url) {
    throw new Error('Banco de dados não configurado');
  }

  return neon(url);
}

export async function GET() {
  try {
    const sql = getSql();

    const alunos = await sql`
      SELECT
        codigo_interno,
        numero_vitalicio,
        nome,
        email,
        telefone,
        whatsapp,
        sexo,
        data_nascimento,
        idade,
        cpf,
        rg,
        nome_mae,
        nome_pai,
        endereco,
        complemento,
        bairro,
        cep,
        referencia,
        esporte,
        faixa,
        cor_faixa,
        grau,
        peso_kg,
        altura_m,
        imc,
        contato_emerg_nome,
        contato_emerg_parentesco,
        contato_emerg_endereco,
        contato_emerg_telefone,
        parq_q1,
        parq_q2,
        parq_q3,
        parq_q4,
        parq_q5,
        parq_q6,
        parq_q7,
        parq_q8,
        medicamentos,
        termos_aceitos,
        lgpd_aceite,
        status,
        numero_certificado,
        financeiro,
        observacoes,
        created_at,
        updated_at
      FROM alunos
      ORDER BY nome ASC
    `;

    return Response.json({
      ok: true,
      total: alunos.length,
      alunos
    });

  } catch (e) {
    console.error('Erro ao exportar dados dos alunos:', e);

    return Response.json(
      {
        ok: false,
        error: 'Erro ao buscar dados dos alunos'
      },
      { status: 500 }
    );
  }
}
