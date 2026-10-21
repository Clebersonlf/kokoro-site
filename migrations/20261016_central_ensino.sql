-- KOKORO: Central de Ensino e Avaliacao Tecnica.
-- RASCUNHO PARA REVISAO. NAO EXECUTAR NO BANCO.
-- Vinculos UUID; nenhum dado existente e alterado.

BEGIN;

CREATE TABLE kokoro_tecnicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  regiao_corpo TEXT,
  posicao_origem TEXT,
  descricao_curta TEXT,
  descricao_detalhada TEXT,
  palavras_chave TEXT[] NOT NULL DEFAULT '{}',
  imagem_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_por UUID REFERENCES professores(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE kokoro_planos_aula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES professores(id),
  plano_origem_id UUID REFERENCES kokoro_planos_aula(id),
  data_aula DATE NOT NULL,
  turma_descricao TEXT,
  titulo TEXT NOT NULL,
  objetivos TEXT NOT NULL DEFAULT '',
  conteudo_livre TEXT NOT NULL DEFAULT '',
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho'
    CHECK (status IN ('rascunho','ministrada','cancelada')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE kokoro_plano_tecnicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID NOT NULL
    REFERENCES kokoro_planos_aula(id) ON DELETE CASCADE,
  tecnica_id UUID REFERENCES kokoro_tecnicas(id),
  nome_tecnica_snapshot TEXT NOT NULL,
  descricao_ministrada TEXT NOT NULL DEFAULT '',
  ordem INTEGER NOT NULL DEFAULT 1,
  UNIQUE (plano_id, id),
  CHECK (LENGTH(BTRIM(nome_tecnica_snapshot)) > 0)
);

CREATE TABLE kokoro_plano_alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID NOT NULL
    REFERENCES kokoro_planos_aula(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id),
  presenca TEXT NOT NULL DEFAULT 'pendente'
    CHECK (presenca IN (
      'pendente','presente','ausente','justificada'
    )),
  confirmado_por UUID REFERENCES professores(id),
  confirmado_em TIMESTAMPTZ,
  UNIQUE (plano_id, aluno_id)
);

CREATE TABLE kokoro_avaliacoes_tecnicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID NOT NULL,
  plano_tecnica_id UUID NOT NULL,
  aluno_id UUID NOT NULL,
  avaliador_id UUID REFERENCES professores(id),
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','avaliada')),
  habilidade NUMERIC(3,1) CHECK (habilidade BETWEEN 0 AND 10),
  controle NUMERIC(3,1) CHECK (controle BETWEEN 0 AND 10),
  execucao_tecnica NUMERIC(3,1)
    CHECK (execucao_tecnica BETWEEN 0 AND 10),
  evolucao_tecnica NUMERIC(3,1)
    CHECK (evolucao_tecnica BETWEEN 0 AND 10),
  orientacoes TEXT,
  avaliada_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (plano_id, plano_tecnica_id, aluno_id),
  FOREIGN KEY (plano_id, plano_tecnica_id)
    REFERENCES kokoro_plano_tecnicas(plano_id, id),
  FOREIGN KEY (plano_id, aluno_id)
    REFERENCES kokoro_plano_alunos(plano_id, aluno_id),
  CHECK (
    status <> 'avaliada'
    OR (
      habilidade IS NOT NULL
      AND controle IS NOT NULL
      AND execucao_tecnica IS NOT NULL
    )
  )
);

CREATE INDEX kokoro_planos_prof_data
  ON kokoro_planos_aula(professor_id, data_aula);

CREATE INDEX kokoro_planos_status_data
  ON kokoro_planos_aula(status, data_aula);

CREATE INDEX kokoro_plano_alunos_aluno
  ON kokoro_plano_alunos(aluno_id);

CREATE INDEX kokoro_avaliacoes_aluno
  ON kokoro_avaliacoes_tecnicas(aluno_id);

CREATE INDEX kokoro_tecnicas_categoria
  ON kokoro_tecnicas(categoria);

COMMIT;
