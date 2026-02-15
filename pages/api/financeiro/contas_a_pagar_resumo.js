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
    const hoje = new Date().toISOString().split('T')[0];
    const em30Dias = new Date();
    em30Dias.setDate(em30Dias.getDate() + 30);
    const em30DiasStr = em30Dias.toISOString().split('T')[0];

    const em90Dias = new Date();
    em90Dias.setDate(em90Dias.getDate() + 90);
    const em90DiasStr = em90Dias.toISOString().split('T')[0];

    // Próximos 30 dias
    const proximos30 = await sql`
      SELECT COALESCE(SUM(valor), 0) as total
      FROM parcelas_a_pagar
      WHERE status = 'pendente'
      AND data_vencimento BETWEEN ${hoje} AND ${em30DiasStr}
    `;

    // Próximos 90 dias
    const proximos90 = await sql`
      SELECT COALESCE(SUM(valor), 0) as total
      FROM parcelas_a_pagar
      WHERE status = 'pendente'
      AND data_vencimento BETWEEN ${hoje} AND ${em90DiasStr}
    `;

    // Total de parcelas ativas
    const totalParcelas = await sql`
      SELECT COUNT(*) as count
      FROM parcelas_a_pagar
      WHERE status = 'pendente'
    `;

    // Parcelas atrasadas
    const atrasadas = await sql`
      SELECT COALESCE(SUM(valor), 0) as total, COUNT(*) as count
      FROM parcelas_a_pagar
      WHERE status = 'pendente'
      AND data_vencimento < ${hoje}
    `;

    res.status(200).json({
      ok: true,
      resumo: {
        proximos_30_dias: parseFloat(proximos30[0].total),
        proximos_90_dias: parseFloat(proximos90[0].total),
        total_parcelas_ativas: parseInt(totalParcelas[0].count),
        atrasadas: {
          valor: parseFloat(atrasadas[0].total),
          quantidade: parseInt(atrasadas[0].count)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar resumo:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Erro ao buscar resumo', 
      details: error.message 
    });
  }
}
