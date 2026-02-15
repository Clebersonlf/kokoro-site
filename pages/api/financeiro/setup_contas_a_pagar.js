import { sql } from '../_lib/db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    // Criar tabela contas_a_pagar
    await sql`
      CREATE TABLE IF NOT EXISTS contas_a_pagar (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        descricao TEXT NOT NULL,
        valor_total DECIMAL(10,2) NOT NULL,
        numero_parcelas INTEGER NOT NULL,
        valor_parcela DECIMAL(10,2) NOT NULL,
        primeira_parcela DATE NOT NULL,
        categoria TEXT,
        observacoes TEXT,
        status TEXT DEFAULT 'ativo',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Criar tabela parcelas_a_pagar
    await sql`
      CREATE TABLE IF NOT EXISTS parcelas_a_pagar (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conta_id UUID REFERENCES contas_a_pagar(id) ON DELETE CASCADE,
        numero_parcela INTEGER NOT NULL,
        data_vencimento DATE NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pendente',
        data_pagamento DATE,
        lancamento_id UUID,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Criar índices para performance
    await sql`CREATE INDEX IF NOT EXISTS idx_parcelas_conta ON parcelas_a_pagar(conta_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_parcelas_status ON parcelas_a_pagar(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_parcelas_vencimento ON parcelas_a_pagar(data_vencimento)`;

    res.status(200).json({ 
      ok: true, 
      message: 'Tabelas criadas com sucesso!',
      tables: ['contas_a_pagar', 'parcelas_a_pagar']
    });

  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Erro ao criar tabelas', 
      details: error.message 
    });
  }
}
