import { sql } from '../_lib/db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    // Buscar todas as contas ativas
    const contas = await sql`
      SELECT * FROM contas_a_pagar 
      WHERE status = 'ativo'
      ORDER BY primeira_parcela DESC
    `;

    // Para cada conta, buscar suas parcelas
    const contasComParcelas = await Promise.all(
      contas.map(async (conta) => {
        const parcelas = await sql`
          SELECT * FROM parcelas_a_pagar
          WHERE conta_id = ${conta.id}
          ORDER BY numero_parcela ASC
        `;

        // Calcular estatísticas
        const parcelasPagas = parcelas.filter(p => p.status === 'paga').length;
        const parcelasPendentes = parcelas.filter(p => p.status === 'pendente').length;
        const valorPago = parcelas
          .filter(p => p.status === 'paga')
          .reduce((sum, p) => sum + parseFloat(p.valor), 0);
        const valorRestante = parcelas
          .filter(p => p.status === 'pendente')
          .reduce((sum, p) => sum + parseFloat(p.valor), 0);

        return {
          ...conta,
          parcelas,
          estatisticas: {
            pagas: parcelasPagas,
            pendentes: parcelasPendentes,
            valor_pago: valorPago,
            valor_restante: valorRestante,
            progresso: ((parcelasPagas / parcelas.length) * 100).toFixed(1)
          }
        };
      })
    );

    res.status(200).json({ 
      ok: true, 
      contas: contasComParcelas,
      total_contas: contasComParcelas.length
    });

  } catch (error) {
    console.error('Erro ao listar contas:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Erro ao listar contas', 
      details: error.message 
    });
  }
}
