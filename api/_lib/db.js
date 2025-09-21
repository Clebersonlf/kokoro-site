import { sql } from '@vercel/postgres';

// cria as tabelas se não existirem
export async function ensureSchema() {
  await sql`create table if not exists alunos (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    email text,
    cpf text,
    data_nasc date,
    created_at timestamptz default now()
  );`;

  await sql`create table if not exists graduacoes (
    id uuid primary key default gen_random_uuid(),
    aluno_id uuid references alunos(id) on delete cascade,
    modalidade text not null,      -- jiu-jitsu, etc.
    nivel text not null,           -- faixa/numeração
    numero integer,                -- seu "controle de numeração"
    data date,
    created_at timestamptz default now()
  );`;

  await sql`create table if not exists financeiro_lancamentos (
    id uuid primary key default gen_random_uuid(),
    aluno_id uuid references alunos(id) on delete set null,
    tipo text not null,            -- receita | despesa
    valor numeric(12,2) not null,
    descricao text,
    data date default current_date,
    created_at timestamptz default now()
  );`;
}

export { sql };
