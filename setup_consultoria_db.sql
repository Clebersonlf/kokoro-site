-- Tabela de consultores
CREATE TABLE IF NOT EXISTS consultores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(50),
    foto_url VARCHAR(500),
    area_atuacao VARCHAR(100) NOT NULL,
    especializacoes TEXT,
    numero_registro VARCHAR(100),
    resumo TEXT,
    valor_consulta DECIMAL(10,2),
    duracao_consulta INTEGER DEFAULT 60,
    status VARCHAR(20) DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultor_disponibilidade (
    id SERIAL PRIMARY KEY,
    consultor_id INTEGER REFERENCES consultores(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solicitacoes_consulta (
    id SERIAL PRIMARY KEY,
    aluno_id INTEGER NOT NULL,
    consultor_id INTEGER REFERENCES consultores(id) ON DELETE CASCADE,
    data_solicitacao TIMESTAMP DEFAULT NOW(),
    data_agendada TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pendente',
    mensagem TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultores_area ON consultores(area_atuacao);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_aluno ON solicitacoes_consulta(aluno_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_consultor ON solicitacoes_consulta(consultor_id);
