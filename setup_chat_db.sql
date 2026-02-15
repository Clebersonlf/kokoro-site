-- Tabela de usuários do chat (simplificada)
CREATE TABLE IF NOT EXISTS chat_usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    foto_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'offline',
    ultimo_acesso TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS chat_conversas (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) DEFAULT 'privada',
    nome_grupo VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de participantes das conversas
CREATE TABLE IF NOT EXISTS chat_participantes (
    id SERIAL PRIMARY KEY,
    conversa_id INTEGER REFERENCES chat_conversas(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES chat_usuarios(id) ON DELETE CASCADE,
    ultima_leitura TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(conversa_id, usuario_id)
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS chat_mensagens (
    id SERIAL PRIMARY KEY,
    conversa_id INTEGER REFERENCES chat_conversas(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES chat_usuarios(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON chat_mensagens(conversa_id, created_at);
CREATE INDEX IF NOT EXISTS idx_participantes_usuario ON chat_participantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_participantes_conversa ON chat_participantes(conversa_id);
