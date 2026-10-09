import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { sql } from '../_lib/db.js';

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function dataBR(valor) {
  if (!valor) return '—';

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'UTC'
    }).format(valor);
  }

  const s = String(valor).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (iso) {
    return `${iso[3]}/${iso[2]}/${iso[1]}`;
  }

  const d = new Date(valor);

  if (!Number.isNaN(d.getTime())) {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'UTC'
    }).format(d);
  }

  return s;
}

function referenciaBR(valor) {
  const s = String(valor || '').trim();

  if (/^\d{4}-\d{2}$/.test(s)) {
    const [ano, mes] = s.split('-');
    return `${mes}/${ano}`;
  }

  return s || '—';
}

function textoFormaPagamento(valor) {
  const s = String(valor || '').trim();

  if (!s) return 'Não informada';

  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letra => letra.toUpperCase());
}

function nomeArquivo(valor) {
  return String(valor || 'aluno')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      error: 'Método não permitido'
    });
  }

  try {
    const id = String(req.query.id || '').trim();

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: 'id da mensalidade é obrigatório'
      });
    }

    const mensalidades = await sql`
      SELECT
        id,
        aluno_id,
        referencia,
        descricao,
        valor,
        vencimento,
        data_pagamento,
        status,
        forma_pagamento,
        observacoes
      FROM mensalidades_alunos
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!mensalidades.length) {
      return res.status(404).json({
        ok: false,
        error: 'Mensalidade não encontrada'
      });
    }

    const mensalidade = mensalidades[0];

    if (String(mensalidade.status || '').toLowerCase() !== 'pago') {
      return res.status(400).json({
        ok: false,
        error: 'O recibo somente pode ser gerado para mensalidade paga'
      });
    }

    const alunos = await sql`
      SELECT
        id,
        nome,
        email
      FROM alunos
      WHERE id = ${mensalidade.aluno_id}
      LIMIT 1
    `;

    if (!alunos.length) {
      return res.status(404).json({
        ok: false,
        error: 'Aluno não encontrado'
      });
    }

    const aluno = alunos[0];

    const numeroRecibo =
      'KOKORO-MEN-' +
      String(mensalidade.id)
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 12)
        .toUpperCase();

    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 48,
        bottom: 48,
        left: 54,
        right: 54
      },
      info: {
        Title: `Recibo ${numeroRecibo}`,
        Author: 'KOKORO',
        Subject: 'Recibo de pagamento de mensalidade'
      }
    });

    const partes = [];

    doc.on('data', chunk => partes.push(chunk));

    doc.on('end', () => {
      const pdf = Buffer.concat(partes);

      const arquivo =
        `recibo-${nomeArquivo(aluno.nome)}-${referenciaBR(mensalidade.referencia)
          .replace('/', '-')}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${arquivo}"`
      );
      res.setHeader('Content-Length', pdf.length);
      res.status(200).send(pdf);
    });

    // =====================================================
    // CABEÇALHO
    // =====================================================

    const logoPath = path.join(
      process.cwd(),
      'public',
      'img',
      'kokoro-recibo-logo.png'
    );

    // Medida definida para o cabeçalho:
    // 1,43 cm entre logo e linha
    // 1,43 cm entre linha e título
    const gapCabecalho = 1.43 * 72 / 2.54;

    let logoBottomY;

    if (fs.existsSync(logoPath)) {
      const logoW = 200;
      const logoY = 28;
      const logoX = (doc.page.width - logoW) / 2;

      const logoImagem = doc.openImage(logoPath);
      const logoH = logoImagem.height * logoW / logoImagem.width;

      doc.image(logoImagem, logoX, logoY, {
        width: logoW
      });

      logoBottomY = logoY + logoH;
    } else {
      doc
        .font('Helvetica-Bold')
        .fontSize(22)
        .fillColor('#111111')
        .text('KOKORO', 54, 40, {
          width: 487,
          align: 'center'
        });

      logoBottomY = doc.y;
    }

    const lineY = logoBottomY + gapCabecalho;

    doc
      .strokeColor('#111111')
      .lineWidth(3)
      .moveTo(54, lineY)
      .lineTo(541, lineY)
      .stroke();

    // Exatamente mais 1,43 cm até o início do título
    doc.y = lineY + gapCabecalho;

    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#111827')
      .text('RECIBO DE PAGAMENTO', {
        align: 'center'
      });

    doc
      .moveDown(0.4)
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#64748b')
      .text(`Recibo nº ${numeroRecibo}`, {
        align: 'center'
      });

    doc.moveDown(1.6);

    // =====================================================
    // TEXTO PRINCIPAL
    // =====================================================

    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor('#111827')
      .text(
        `Recebemos de ${aluno.nome || 'Aluno'}, a importância de ${moeda(mensalidade.valor)}, referente ao pagamento descrito abaixo.`,
        {
          align: 'justify',
          lineGap: 4
        }
      );

    doc.moveDown(1.4);

    // =====================================================
    // DADOS
    // =====================================================

    const inicioX = 70;
    const labelX = 70;
    const valorX = 220;
    const larguraValor = 310;

    function linha(label, valor) {
      const y = doc.y;

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#475569')
        .text(label, labelX, y, {
          width: 135
        });

      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#111827')
        .text(String(valor || '—'), valorX, y, {
          width: larguraValor
        });

      doc.moveDown(0.9);

      doc
        .strokeColor('#e2e8f0')
        .lineWidth(0.6)
        .moveTo(inicioX, doc.y)
        .lineTo(525, doc.y)
        .stroke();

      doc.moveDown(0.55);
    }

    linha('Aluno', aluno.nome);
    linha('E-mail', aluno.email || '—');
    linha('Descrição', mensalidade.descricao || 'Mensalidade');
    linha('Competência', referenciaBR(mensalidade.referencia));
    linha('Valor pago', moeda(mensalidade.valor));
    linha('Data do pagamento', dataBR(mensalidade.data_pagamento));
    linha(
      'Forma de pagamento',
      textoFormaPagamento(mensalidade.forma_pagamento)
    );

    if (mensalidade.observacoes) {
      linha('Observações', mensalidade.observacoes);
    }

    doc.moveDown(1.5);

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#166534')
      .text('PAGAMENTO CONFIRMADO', {
        align: 'center'
      });

    doc.moveDown(2);

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#64748b')
      .text(
        'Este recibo foi gerado eletronicamente pelo sistema KOKORO a partir do registro de pagamento da mensalidade.',
        {
          align: 'center'
        }
      );

    doc.moveDown(0.8);

    doc
      .fontSize(8)
      .fillColor('#94a3b8')
      .text(
        `Identificação da mensalidade: ${mensalidade.id}`,
        {
          align: 'center'
        }
      );

    doc.end();

  } catch (e) {
    console.error('Erro ao gerar recibo de mensalidade:', e);

    if (!res.headersSent) {
      return res.status(500).json({
        ok: false,
        error: e.message
      });
    }
  }
}
