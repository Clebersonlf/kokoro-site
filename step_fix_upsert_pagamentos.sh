#!/usr/bin/env bash
set -euo pipefail

F="./api/pagamentos/index.js"

if [ ! -f "$F" ]; then
  echo "ERRO: não encontrei $F"
  exit 1
fi

echo ">> Backup do arquivo atual"
cp -f "$F" "${F}.bak.$(date +%Y%m%d%H%M%S)"

echo ">> Reescrevendo $F com lógica de UPSERT e de-duplicação de rateio"
cat > "$F" <<'JS'
import { getClient } from '../../lib/db.js';
import { calcularSplit } from '../../lib/rateio.js';

function isAdmin(req) {
  const auth = req.headers['x-admin-secret'];
  return auth && process.env.ADMIN_SECRET && auth === process.env.ADMIN_SECRET;
}

// Handler estilo Vercel/Next para /api/pagamentos (POST)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }
  if (!isAdmin(req)) return res.status(401).json({ ok:false, error:'unauthorized' });

  const { aluno_id, matricula_id, competencia, valor_pago } = req.body || {};
  if (!aluno_id || !matricula_id || !competencia || valor_pago == null) {
    return res.status(400).json({ ok:false, error:'aluno_id, matricula_id, competencia, valor_pago são obrigatórios' });
  }

  const client = getClient();
  await client.connect();

  try {
    // 1) Confere matrícula ativa e obtém professor
    const { rows: mRows } = await client.sql`
      SELECT professor_id
      FROM matriculas
      WHERE id = ${matricula_id} AND ativo = true
      LIMIT 1;
    `;
    if (!mRows.length) {
      return res.status(400).json({ ok:false, error:'Matrícula inválida/ativa' });
    }
    const professorId = mRows[0].professor_id;

    // 2) Busca regra de rateio vigente para a competência
    const { rows: rRows } = await client.sql`
      SELECT percentual_professor, percentual_titular
      FROM rateio_matricula
      WHERE matricula_id = ${matricula_id}
        AND inicio_vigencia <= ${competencia}::date
        AND (fim_vigencia IS NULL OR fim_vigencia >= ${competencia}::date)
      ORDER BY inicio_vigencia DESC
      LIMIT 1;
    `;
    let percProf = 0, percTit = 100;
    if (rRows.length) {
      percProf = Number(rRows[0].percentual_professor);
      percTit  = Number(rRows[0].percentual_titular);
    }

    // 3) Calcula split
    const split = calcularSplit(Number(valor_pago), percProf, percTit);
    const regraTxt = 'prof=' + percProf + '% | titular=' + percTit + '%';

    // 4) UPSERT no pagamentos: se (matricula_id, competencia) já existir, atualiza valor_pago
    const { rows: pRows } = await client.sql`
      INSERT INTO pagamentos (aluno_id, matricula_id, competencia, valor_pago)
      VALUES (${aluno_id}, ${matricula_id}, ${competencia}, ${valor_pago})
      ON CONFLICT (matricula_id, competencia)
      DO UPDATE SET valor_pago = EXCLUDED.valor_pago
      RETURNING id;
    `;
    const pagamentoId = pRows[0].id;

    // 5) Garante unicidade do rateio por (pagamento_id, professor_id):
    //    remove eventual registro anterior e insere o atual
    await client.sql`
      DELETE FROM rateios_pagamento
      WHERE pagamento_id = ${pagamentoId} AND professor_id = ${professorId};
    `;
    await client.sql`
      INSERT INTO rateios_pagamento
        (pagamento_id, professor_id, percentual_professor, percentual_titular,
         valor_professor, parte_professor, parte_titular, regra_aplicada, criado_em)
      VALUES
        (${pagamentoId}, ${professorId}, ${percProf}, ${percTit},
         ${split.parte_professor}, ${split.parte_professor}, ${split.parte_titular},
         ${regraTxt}, now());
    `;

    return res.json({
      ok: true,
      pagamento_id: pagamentoId,
      split,
      regra_aplicada: regraTxt
    });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e) });
  } finally {
    await client.end();
  }
}
JS

echo ">> Checando sintaxe com Node"
node --version || true
node --check "$F"

echo "OK: arquivo atualizado com upsert."
