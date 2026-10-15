-- KOKORO: contas individuais, sem alterar a tabela alunos.
-- MIGRACAO PREPARADA: NAO EXECUTAR AINDA.

CREATE TABLE IF NOT EXISTS contas_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  senha_hash TEXT,
  perfil TEXT NOT NULL
    CHECK (perfil IN ('aluno', 'professor')),
  aluno_id UUID REFERENCES alunos(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES professores(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT FALSE,
  tentativas_falhas INTEGER NOT NULL DEFAULT 0,
  bloqueado_ate TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT conta_perfil_vinculo CHECK (
    (perfil = 'aluno'
      AND aluno_id IS NOT NULL
      AND professor_id IS NULL)
    OR
    (perfil = 'professor'
      AND professor_id IS NOT NULL
      AND aluno_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS
  contas_acesso_email_unico
ON contas_acesso (LOWER(BTRIM(email)));

CREATE UNIQUE INDEX IF NOT EXISTS
  contas_acesso_aluno_unico
ON contas_acesso (aluno_id)
WHERE perfil = 'aluno';

CREATE UNIQUE INDEX IF NOT EXISTS
  contas_acesso_professor_unico
ON contas_acesso (professor_id)
WHERE perfil = 'professor';
