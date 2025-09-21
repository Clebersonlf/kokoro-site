#!/usr/bin/env bash
set -euo pipefail

echo "==> Carregando ENVs da Vercel (.env.local)..."
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local || true; set +a

BASE_URL="${BASE_URL:-https://www.planckkokoro.com}"
ADMIN_SECRET="${ADMIN_SECRET:-}"
CONN="${POSTGRES_URL_NON_POOLING:-${DATABASE_URL:-${POSTGRES_URL:-}}}"

echo
echo "=== ENVs ==="
echo "BASE_URL=$BASE_URL"
echo "ADMIN_SECRET=${ADMIN_SECRET:+<presente>}"
echo "CONN=${CONN:+<presente>}"
echo

if [ -z "$CONN" ]; then
  echo "Sem string de conexão do Postgres (CONN)."
  exit 1
fi

echo "=== DB: tabelas relacionadas a 'rateio' (nome e schema) ==="
psql "$CONN" -qtAc "
SELECT schemaname, tablename
FROM pg_tables
WHERE tablename ILIKE '%rateio%'
ORDER BY schemaname, tablename;
" || true
echo

echo "=== DB: colunas das candidatas (rateios / rateio / regras_rateio / rateio_regras) ==="
for t in rateios rateio regras_rateio rateio_regras regra_rateio; do
  echo "-- $t"
  psql "$CONN" -qtAc "
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = '$t'
  ORDER BY ordinal_position;
  " || true
  echo
done

echo "=== DB: 5 linhas de exemplo (se existirem) ==="
for t in rateios rateio regras_rateio rateio_regras regra_rateio; do
  echo "-- $t (até 5 linhas)"
  psql "$CONN" -qtAc "SELECT * FROM $t LIMIT 5;" 2>/dev/null || echo "(tabela não existe)"
  echo
done

echo "=== DB: presença de tabelas essenciais ==="
for t in professores alunos matriculas pagamentos pagamentos_professor matriculas_professores settings; do
  printf " - %-24s : " "$t"
  psql "$CONN" -qtAc "SELECT to_regclass('$t') IS NOT NULL;" | grep -q t && echo OK || echo FALTA
done
echo

echo "=== DB: definição atual da view vw_extrato_professor (se existir) ==="
psql "$CONN" -qtAc "SELECT pg_get_viewdef('vw_extrato_professor'::regclass, true);" 2>/dev/null || echo "(view ausente)"
echo

echo "=== CÓDIGO: arquivos da rota do extrato (caminhos contendo 'extrato-professor') ==="
grep -RIn --line-number "extrato-professor" . || true
echo

echo "=== CÓDIGO: referências a 'regra_usada' (com contexto de 2 linhas) ==="
# tenta com grep comum
grep -RIn -n "regra_usada" . | sed -e 's/^/>> /' || true
echo

echo "=== CÓDIGO: uso de 'FROM rateios' (para ver se o código espera essa tabela) ==="
grep -RIn -n "FROM[[:space:]]\+rateios" . || true
echo

echo "=== TESTE RÁPIDO DA ROTA (deve falhar enquanto não corrigirmos) ==="
curl -s "$BASE_URL/api/financeiro/extrato-professor?professor_id=baed8b13-f510-4c37-bd1e-60e809af1d93" \
  -H "x-admin-secret: $ADMIN_SECRET" | jq .
