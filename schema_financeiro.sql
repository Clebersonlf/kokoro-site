-- EXTENSÃO para UUID (Neon já costuma ter; se não tiver, ative)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) PLANOS (permite mensal/trimestral/semestral/anual, etc.)
CREATE TABLE IF NOT EXISTS planos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            text NOT NULL,
  periodicidade   text NOT NULL CHECK (periodicidade IN ('MENSAL','TRIMESTRAL','SEMESTRAL','ANUAL')),
  valor_padrao    numeric(10,2) NOT NULL,   -- ex.: 150.00 ou 230.00
  ativo           boolean NOT NULL DEFAULT true,
  criado_em       timestamptz NOT NULL DEFAULT now()
);

-- 2) PROFESSORES (inclui tipo)
CREATE TABLE IF NOT EXISTS professores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            text NOT NULL,
  tipo            text NOT NULL CHECK (tipo IN ('TITULAR','AUXILIAR','INSTRUTOR')),
  cpf             text,
  telefone        text,
  email           text,
  ativo           boolean NOT NULL DEFAULT true,
  criado_em       timestamptz NOT NULL DEFAULT now()
);

-- 3) ALUNOS
CREATE TABLE IF NOT EXISTS alunos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            text NOT NULL,
  telefone        text,
  email           text,
  ativo           boolean NOT NULL DEFAULT true,
  criado_em       timestamptz NOT NULL DEFAULT now()
);

-- 4) MATRÍCULAS
CREATE TABLE IF NOT EXISTS matriculas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id        uuid NOT NULL REFERENCES alunos(id),
  professor_id    uuid NOT NULL REFERENCES professores(id),  -- responsável pela turma
  plano_id        uuid NOT NULL REFERENCES planos(id),
  valor_personalizado numeric(10,2),     -- opcional: desconto/bolsa/preço único por aluno
  extra_admin     numeric(10,2) DEFAULT 0,  -- “todas as aulas” ou qualquer ajuste definido pelo TITULAR
  horario         text NOT NULL CHECK (horario IN ('MANHA','TARDE','NOITE')),
  principal       boolean NOT NULL DEFAULT false,  -- marque 1 principal por aluno
  ativo           boolean NOT NULL DEFAULT true,
  criado_em       timestamptz NOT NULL DEFAULT now()
);

-- 5) RATEIO por matrícula (vigente por período; flexível)
CREATE TABLE IF NOT EXISTS rateio_matricula (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id            uuid NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  percentual_professor    numeric(5,2) NOT NULL,
  percentual_titular      numeric(5,2) NOT NULL,
  CHECK (percentual_professor >= 0 AND percentual_titular >= 0),
  CHECK ((percentual_professor + percentual_titular) = 100),
  inicio_vigencia         date NOT NULL DEFAULT current_date,
  fim_vigencia            date,   -- null = vigente
  criado_em               timestamptz NOT NULL DEFAULT now()
);

-- 6) PAGAMENTOS (lançamento mensal – valor efetivo cobrado)
CREATE TABLE IF NOT EXISTS pagamentos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id        uuid NOT NULL REFERENCES alunos(id),
  matricula_id    uuid NOT NULL REFERENCES matriculas(id),
  competencia     date NOT NULL,                 -- use dia 1 do mês
  valor_pago      numeric(10,2) NOT NULL,        -- já com desconto/extra aplicado
  criado_em       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (matricula_id, competencia)             -- evita duplicidade do mesmo mês
);

-- 7) RATEIOS GERADOS (resultado do split, travado historicamente)
CREATE TABLE IF NOT EXISTS rateios_pagamento (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pagamento_id    uuid NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
  professor_id    uuid,                           -- null = titular
  parte_professor numeric(10,2) NOT NULL DEFAULT 0,
  parte_titular   numeric(10,2) NOT NULL DEFAULT 0,
  regra_aplicada  text NOT NULL,
  criado_em       timestamptz NOT NULL DEFAULT now()
);

-- 8) VIEW de resumo por professor/mês (para gráficos)
CREATE OR REPLACE VIEW vw_fin_professor_mes AS
SELECT
  p.id  AS professor_id,
  COALESCE(p.nome, 'TITULAR') AS professor_nome,
  date_trunc('month', pg.competencia)::date AS mes,
  SUM(rp.parte_professor) AS total_prof,
  SUM(rp.parte_titular)   AS total_titular,
  COUNT(DISTINCT pg.id)   AS qtd_pagamentos
FROM rateios_pagamento rp
JOIN pagamentos pg      ON pg.id = rp.pagamento_id
LEFT JOIN professores p ON p.id  = rp.professor_id
GROUP BY p.id, COALESCE(p.nome,'TITULAR'), date_trunc('month', pg.competencia)::date;
