import sharp from 'sharp';
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

function xml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
      SELECT id, nome, email
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

    const logoPath = path.join(
      process.cwd(),
      'public',
      'img',
      'kokoro-recibo-logo.png'
    );

    let logoSvg = '';

    if (fs.existsSync(logoPath)) {
      const logoBase64 =
        fs.readFileSync(logoPath).toString('base64');

      logoSvg = `
        <image
          x="412"
          y="58"
          width="416"
          height="88"
          preserveAspectRatio="xMidYMid meet"
          href="data:image/png;base64,${logoBase64}"
        />
      `;
    } else {
      logoSvg = `
        <text
          x="620"
          y="125"
          text-anchor="middle"
          font-family="Arial,DejaVu Sans,sans-serif"
          font-size="54"
          font-weight="700"
          fill="#111111"
        >KOKORO</text>
      `;
    }

    const observacao = mensalidade.observacoes
      ? `
        <line x1="145" y1="1100" x2="1095" y2="1100" class="linhaDados"/>

        <text class="label" x="145" y="1150">Observações</text>
        <text class="valor" x="465" y="1150">${xml(mensalidade.observacoes)}</text>
        <line x1="145" y1="1180" x2="1095" y2="1180" class="linhaDados"/>
      `
      : '';

    const confirmacaoY =
      mensalidade.observacoes ? 1270 : 1180;

    const rodapeY =
      mensalidade.observacoes ? 1380 : 1290;

    const svg = `
    <svg
      width="1240"
      height="1754"
      viewBox="0 0 1240 1754"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1240" height="1754" fill="#ffffff"/>

      <style>
        .titulo {
          font-family: Arial, DejaVu Sans, sans-serif;
          font-size: 42px;
          font-weight: 700;
          fill: #111827;
        }

        .subtitulo {
          font-family: Arial, DejaVu Sans, sans-serif;
          font-size: 22px;
          fill: #64748b;
        }

        .texto {
          font-family: Arial, DejaVu Sans, sans-serif;
          font-size: 27px;
          fill: #111827;
        }

        .label {
          font-family: Arial, DejaVu Sans, sans-serif;
          font-size: 22px;
          font-weight: 700;
          fill: #475569;
        }

        .valor {
          font-family: Arial, DejaVu Sans, sans-serif;
          font-size: 23px;
          fill: #111827;
        }

        .linhaDados {
          stroke: #e2e8f0;
          stroke-width: 2;
        }
      </style>

      ${logoSvg}

      <!-- 1,43 cm abaixo da logo -->
      <line
        x1="112"
        y1="230"
        x2="1128"
        y2="230"
        stroke="#111111"
        stroke-width="6"
      />

      <!-- 1,43 cm abaixo da linha -->
      <text
        x="620"
        y="355"
        text-anchor="middle"
        class="titulo"
      >RECIBO DE PAGAMENTO</text>

      <text
        x="620"
        y="410"
        text-anchor="middle"
        class="subtitulo"
      >Recibo nº ${xml(numeroRecibo)}</text>

      <text x="145" y="505" class="texto">
        Recebemos de ${xml(aluno.nome || 'Aluno')}, a importância de
      </text>

      <text x="145" y="550" class="texto">
        ${xml(moeda(mensalidade.valor))}, referente ao pagamento descrito abaixo.
      </text>

      <text class="label" x="145" y="650">Aluno</text>
      <text class="valor" x="465" y="650">${xml(aluno.nome)}</text>
      <line x1="145" y1="680" x2="1095" y2="680" class="linhaDados"/>

      <text class="label" x="145" y="720">E-mail</text>
      <text class="valor" x="465" y="720">${xml(aluno.email || '—')}</text>
      <line x1="145" y1="750" x2="1095" y2="750" class="linhaDados"/>

      <text class="label" x="145" y="790">Descrição</text>
      <text class="valor" x="465" y="790">${xml(mensalidade.descricao || 'Mensalidade')}</text>
      <line x1="145" y1="820" x2="1095" y2="820" class="linhaDados"/>

      <text class="label" x="145" y="860">Competência</text>
      <text class="valor" x="465" y="860">${xml(referenciaBR(mensalidade.referencia))}</text>
      <line x1="145" y1="890" x2="1095" y2="890" class="linhaDados"/>

      <text class="label" x="145" y="930">Valor pago</text>
      <text class="valor" x="465" y="930">${xml(moeda(mensalidade.valor))}</text>
      <line x1="145" y1="960" x2="1095" y2="960" class="linhaDados"/>

      <text class="label" x="145" y="1000">Data do pagamento</text>
      <text class="valor" x="465" y="1000">${xml(dataBR(mensalidade.data_pagamento))}</text>
      <line x1="145" y1="1030" x2="1095" y2="1030" class="linhaDados"/>

      <text class="label" x="145" y="1070">Forma de pagamento</text>
      <text class="valor" x="465" y="1070">${xml(textoFormaPagamento(mensalidade.forma_pagamento))}</text>

      ${observacao}

      <text
        x="620"
        y="${confirmacaoY}"
        text-anchor="middle"
        font-family="Arial,DejaVu Sans,sans-serif"
        font-size="28"
        font-weight="700"
        fill="#166534"
      >PAGAMENTO CONFIRMADO</text>

      <text
        x="620"
        y="${rodapeY}"
        text-anchor="middle"
        font-family="Arial,DejaVu Sans,sans-serif"
        font-size="18"
        fill="#64748b"
      >Este recibo foi gerado eletronicamente pelo sistema KOKORO.</text>

      <text
        x="620"
        y="${rodapeY + 45}"
        text-anchor="middle"
        font-family="Arial,DejaVu Sans,sans-serif"
        font-size="16"
        fill="#94a3b8"
      >Identificação da mensalidade: ${xml(mensalidade.id)}</text>
    </svg>
    `;

    const jpg = await sharp(
      Buffer.from(svg)
    )
      .jpeg({
        quality: 92,
        chromaSubsampling: '4:4:4'
      })
      .toBuffer();

    const arquivo =
      `recibo-${nomeArquivo(aluno.nome)}-${referenciaBR(mensalidade.referencia)
        .replace('/', '-')}.jpg`;

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${arquivo}"`
    );
    res.setHeader('Content-Length', jpg.length);

    return res.status(200).send(jpg);

  } catch (e) {
    console.error('Erro ao gerar imagem do recibo:', e);

    if (!res.headersSent) {
      return res.status(500).json({
        ok: false,
        error: e.message
      });
    }
  }
}
