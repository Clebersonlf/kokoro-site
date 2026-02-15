-- TABELA SIMPLES para lançamentos gerais (enquanto não migra pro sistema completo)
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
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_financeiro_lancamentos_data ON financeiro_lancamentos(data DESC);
CREATE INDEX IF NOT EXISTS idx_financeiro_lancamentos_tipo ON financeiro_lancamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_financeiro_lancamentos_aluno ON financeiro_lancamentos(aluno_id);
