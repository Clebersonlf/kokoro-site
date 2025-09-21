#!/usr/bin/env bash
set -euo pipefail

# 1) Carregar envs da Vercel (se existirem)
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local || true; set +a

BASE_URL="${BASE_URL:-https://www.planckkokoro.com}"
ADMIN_SECRET="${ADMIN_SECRET:-}"
CONN="${POSTGRES_URL_NON_POOLING:-${DATABASE_URL:-${POSTGRES_URL:-}}}"

echo "=== ENVs ==="
echo "BASE_URL=$BASE_URL"
echo "ADMIN_SECRET=${ADMIN_SECRET:+<presente>}"
echo "CONN=${CONN:+<presente>}"
echo

[ -n "$ADMIN_SECRET" ] || { echo "FALTA ADMIN_SECRET (defina na Vercel)."; exit 1; }
[ -n "$CONN" ] || { echo "Sem string de conexão do Postgres."; exit 1; }

# 2) Recriar a view SEM rp.regra_usada
echo "=== Recriando view vw_extrato_professor ==="
psql "$CONN" <<'SQL'
CREATE OR REPLACE VIEW vw_extrato_professor AS
WITH rateio AS (
  SELECT
    r.matricula_id,
    r.percentual_professor::numeric(5,2) AS perc_prof,
    r.inicio_vigencia::date AS inicio_vigencia,
    r.fim_vigencia::date   AS fim_vigencia
  FROM rateios r
),
pag AS (
  SELECT
    p.id AS pagamento_id,
    p.matricula_id,
    p.aluno_id,
    p.competencia::date AS competencia,
    p.valor_pago::numeric(12,2) AS valor_pago
  FROM pagamentos p
),
aplica AS (
  SELECT
    pag.pagamento_id,
    pag.matricula_id,
    pag.aluno_id,
    pag.competencia,
    pag.valor_pago,
    COALESCE(r.perc_prof, 0) AS perc_prof
  FROM pag
  LEFT JOIN rateio r
    ON r.matricula_id = pag.matricula_id
   AND (r.inicio_vigencia IS NULL OR pag.competencia >= r.inicio_vigencia)
   AND (r.fim_vigencia    IS NULL OR pag.competencia <  r.fim_vigencia)
),
debito AS (
  SELECT
    mp.professor_id,
    a.pagamento_id,
    a.matricula_id,
    a.competencia,
    ROUND(a.valor_pago * (a.perc_prof/100.0), 2) AS valor_devido
  FROM aplica a
  JOIN matriculas_professores mp ON mp.matricula_id = a.matricula_id
),
payouts AS (
  SELECT
    pp.professor_id,
    pp.id AS payout_id,
    pp.valor_pago::numeric(12,2) AS valor_pago,
    pp.pago_em::timestamptz AS pago_em
  FROM pagamentos_professor pp
)
SELECT
  pr.id AS professor_id,
  pr.nome AS professor_nome,
  d.pagamento_id,
  d.matricula_id,
  d.competencia,
  d.valor_devido,
  NULL::uuid AS payout_id,
  NULL::numeric AS valor_pago,
  NULL::timestamptz AS pago_em,
  'DEBITO'::text AS tipo
FROM debito d
JOIN professores pr ON pr.id = d.professor_id

UNION ALL

SELECT
  pr.id AS professor_id,
  pr.nome AS professor_nome,
  NULL::uuid AS pagamento_id,
  NULL::uuid AS matricula_id,
  NULL::date AS competencia,
  NULL::numeric AS valor_devido,
  po.payout_id,
  po.valor_pago,
  po.pago_em,
  'PAYOUT'::text AS tipo
FROM payouts po
JOIN professores pr ON pr.id = po.professor_id;
SQL

# 3) Testar a rota do extrato (usa o professor auxiliar que você já vem usando)
PROF_AUX="baed8b13-f510-4c37-bd1e-60e809af1d93"

echo
echo "=== Teste: /api/financeiro/extrato-professor ==="
curl -s "$BASE_URL/api/financeiro/extrato-professor?professor_id=$PROF_AUX" \
  -H "x-admin-secret: $ADMIN_SECRET" | jq .

