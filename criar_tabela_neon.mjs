import postgres from 'postgres';

const sql = postgres('postgres://neondb_owner:npg_IPqUW0t7pJgd@ep-tiny-dust-ac76e66g-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function criarTabela() {
  try {
    console.log('🔗 Conectando no Neon...');
    
    // Criar tabela
    await sql`
      CREATE TABLE IF NOT EXISTS financeiro_lancamentos (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        aluno_id      text NOT NULL,
        tipo          text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
        valor         numeric(10,2) NOT NULL,
        data          date,
        descricao     text,
        categoria     text,
        observacao    text,
        created_at    timestamptz NOT NULL DEFAULT now()
      )
    `;
    
    console.log('✅ Tabela financeiro_lancamentos criada!');
    
    // Criar índices
    await sql`CREATE INDEX IF NOT EXISTS idx_financeiro_lancamentos_data ON financeiro_lancamentos(data DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_financeiro_lancamentos_tipo ON financeiro_lancamentos(tipo)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_financeiro_lancamentos_aluno ON financeiro_lancamentos(aluno_id)`;
    
    console.log('✅ Índices criados!');
    
    // Verificar
    const result = await sql`SELECT COUNT(*) FROM financeiro_lancamentos`;
    console.log(`📊 Tabela tem ${result[0].count} registros`);
    
    await sql.end();
    console.log('✅ Concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

criarTabela();
