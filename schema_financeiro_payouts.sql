-- 0) Extensão de UUID (se já existir, ignora)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Dados bancários/PIX dos professores
ALTER TABLE professores
  ADD COLUMN IF NOT EXISTS pix_chave        text,
  ADD COLUMN IF NOT EXISTS banco_nome       text,
  ADD COLUMN IF NOT EXISTS agencia          text,
  ADD COLUMN IF NOT EXISTS conta            text,
  ADD COLUMN IF NOT EXISTS favorecido_nome  text,
  ADD COLUMN IF NOT EXISTS doc_favorecido   text;

-- 2) Tabela de pagamentos *ao professor* (payouts)
CREATE TABLE IF NOT EXISTS pagamentos_professor (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id      uuid NOT NULL REFERENCES professores(id),
  valor_pago        numeric(12,2) NOT NULL CHECK (valor_pago >= 0),
  metodo            text NOT NULL CHECK (metodo IN ('PIX','DINHEIRO','TRANSFERENCIA','TED','DOC','OUTRO')),
  pago_em           timestamptz NOT NULL DEFAULT now(),
  comprovante_url   text,             -- link do recibo/imagem/PDF (público)
  observacao        text,
  criado_em         timestamptz NOT NULL DEFAULT now()
);

-- 3) Tabela simples de configurações (ex.: PIX do Planck Kokoro)
CREATE TABLE IF NOT EXISTS settings (
  key   text PRIMARY KEY,
  value text
);
-- opcional: grava a chave PIX da escola, se ainda não houver
INSERT INTO settings(key,value)
SELECT 'org_pix_chave','chavepix@planckkokoro.com'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key='org_pix_chave');

-- 4) VIEW: total devido ao professor (a partir dos rateios), total já pago (payouts) e saldo
DROP VIEW IF EXISTS vw_saldo_professor;
CREATE VIEW vw_saldo_professor AS
WITH devido AS (
  SELECT
    p.professor_id,
    COALESCE(SUM(rp.valor_professor),0) AS total_devido
  FROM rateios_pagamento rp
  JOIN pagamentos pg ON pg.id = rp.pagamento_id
  JOIN matriculas m  ON m.id = pg.matricula_id
  JOIN professores p ON p.id = m.professor_id
  GROUP BY p.professor_id
),
pago AS (
  SELECT
    pp.professor_id,
    COALESCE(SUM(pp.valor_pago),0) AS total_pago
  FROM pagamentos_professor pp
  GROUP BY pp.professor_id
)
SELECT
  pr.id            AS professor_id,
  pr.nome          AS professor_nome,
  pr.tipo          AS professor_tipo,
  COALESCE(d.total_devido,0) AS total_devido,
  COALESCE(pg.total_pago,0)  AS total_pago,
  COALESCE(d.total_devido,0) - COALESCE(pg.total_pago,0) AS saldo
FROM professores pr
LEFT JOIN devido d ON d.professor_id = pr.id
LEFT JOIN pago   pg ON pg.professor_id = pr.id;
