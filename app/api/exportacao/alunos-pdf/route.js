import { neon } from '@neondatabase/serverless';
import PDFDocument from 'pdfkit';

export const runtime = 'nodejs';

function getSql() {
  const url =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!url) throw new Error('Banco de dados não configurado');

  return neon(url);
}

function simNao(valor) {
  if (valor === true) return 'Sim';
  if (valor === false) return 'Não';
  return '-';
}

function valor(v) {
  if (v === null || v === undefined || v === '') return '-';
  return String(v);
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

    const chunks = [];

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: 'Kokoro - Dados dos Alunos',
        Author: 'Kokoro'
      }
    });

    doc.on('data', chunk => chunks.push(chunk));

    const pdfFinalizado = new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);
    });

    doc.fontSize(20).text('KOKORO', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).text('Relatório de Dados dos Alunos', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(9).text(`Total de alunos: ${alunos.length}`, { align: 'center' });
    doc.moveDown(1.5);

    alunos.forEach((a, index) => {
      if (index > 0) doc.addPage();

      doc.fontSize(15).text(valor(a.nome));
      doc.moveDown(0.5);

      doc.fontSize(10);

      const linha = (titulo, conteudo) => {
        doc.font('Helvetica-Bold').text(`${titulo}: `, { continued: true });
        doc.font('Helvetica').text(valor(conteudo));
      };

      doc.fontSize(12).font('Helvetica-Bold').text('Identificação');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');

      linha('Código interno', a.codigo_interno);
      linha('Número vitalício', a.numero_vitalicio);
      linha('E-mail', a.email);
      linha('Telefone', a.telefone);
      linha('WhatsApp', a.whatsapp);
      linha('Sexo', a.sexo);
      linha('Data de nascimento', a.data_nascimento);
      linha('Idade', a.idade);
      linha('CPF', a.cpf);
      linha('RG', a.rg);
      linha('Nome da mãe', a.nome_mae);
      linha('Nome do pai', a.nome_pai);

      doc.moveDown(0.7);
      doc.fontSize(12).font('Helvetica-Bold').text('Endereço');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');

      linha('Endereço', a.endereco);
      linha('Complemento', a.complemento);
      linha('Bairro', a.bairro);
      linha('CEP', a.cep);
      linha('Referência', a.referencia);

      doc.moveDown(0.7);
      doc.fontSize(12).font('Helvetica-Bold').text('Dados esportivos e físicos');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');

      linha('Esporte', a.esporte);
      linha('Faixa', a.faixa);
      linha('Cor da faixa', a.cor_faixa);
      linha('Grau', a.grau);
      linha('Peso (kg)', a.peso_kg);
      linha('Altura (m)', a.altura_m);
      linha('IMC', a.imc);

      doc.moveDown(0.7);
      doc.fontSize(12).font('Helvetica-Bold').text('Contato de emergência');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');

      linha('Nome', a.contato_emerg_nome);
      linha('Parentesco', a.contato_emerg_parentesco);
      linha('Endereço', a.contato_emerg_endereco);
      linha('Telefone', a.contato_emerg_telefone);

      doc.moveDown(0.7);
      doc.fontSize(12).font('Helvetica-Bold').text('PAR-Q e saúde');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');

      linha('PAR-Q 1', simNao(a.parq_q1));
      linha('PAR-Q 2', simNao(a.parq_q2));
      linha('PAR-Q 3', simNao(a.parq_q3));
      linha('PAR-Q 4', simNao(a.parq_q4));
      linha('PAR-Q 5', simNao(a.parq_q5));
      linha('PAR-Q 6', simNao(a.parq_q6));
      linha('PAR-Q 7', simNao(a.parq_q7));
      linha('PAR-Q 8', simNao(a.parq_q8));
      linha('Medicamentos', a.medicamentos);

      doc.moveDown(0.7);
      doc.fontSize(12).font('Helvetica-Bold').text('Cadastro');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');

      linha('Termos aceitos', simNao(a.termos_aceitos));
      linha('LGPD', simNao(a.lgpd_aceite));
      linha('Status', a.status);
      linha('Número certificado', a.numero_certificado);
      linha('Financeiro', a.financeiro);
      linha('Observações', a.observacoes);
      linha('Criado em', a.created_at);
      linha('Atualizado em', a.updated_at);
    });

    doc.end();
    await pdfFinalizado;

    const arquivo = Buffer.concat(chunks);

    return new Response(arquivo, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="kokoro_alunos.pdf"',
        'Content-Length': String(arquivo.length),
        'Cache-Control': 'no-store'
      }
    });

  } catch (e) {
    console.error('Erro ao gerar PDF:', e);

    return Response.json(
      {
        ok: false,
        error: 'Erro ao gerar arquivo PDF'
      },
      { status: 500 }
    );
  }
}
