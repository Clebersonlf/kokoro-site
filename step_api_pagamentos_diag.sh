#!/usr/bin/env bash
set -euo pipefail

# 1) ENVs
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a

BASE_URL="${BASE_URL:-https://www.planckkokoro.com}"
ADMIN_SECRET="${ADMIN_SECRET:-}"
PROD_URL="${PROD_URL:-https://kokoro-site-d91qp39eq-kokoros-projects-7c3d7e09.vercel.app}"

MATR="7728c95b-db7b-42d3-a94c-311a965d17a5"
ALUNO="5cec23fd-3015-4f76-b066-7eb0f02f92a8"

echo "=== ENVs ==="
echo "BASE_URL=$BASE_URL"
echo "ADMIN_SECRET=${ADMIN_SECRET:+<presente>}"
echo "PROD_URL=$PROD_URL"
[ -n "$ADMIN_SECRET" ] || { echo "ERRO: falta ADMIN_SECRET"; exit 1; }
echo

# 2) Chamada crua ao endpoint (sem jq) pra ver exatamente o que volta
echo "=== CURL /api/pagamentos (resposta crua) ==="
REQ_BODY=$(cat <<JSON
{"aluno_id":"$ALUNO","matricula_id":"$MATR","competencia":"2025-09-01","valor_pago":230}
JSON
)
echo "Request body: $REQ_BODY"
echo
echo "---- resposta HTTP ----"
curl -i -s -X POST "$BASE_URL/api/pagamentos" \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: $ADMIN_SECRET" \
  -d "$REQ_BODY" | sed -e 's/^/> /'
echo "---- fim resposta ----"
echo

# 3) Logs da Vercel recentes (últimos 60 min) e filtro por 'pagamentos'
echo "=== LOGS VERCEL (últimos 60 min) ==="
vercel logs "$PROD_URL" --since 60m | sed -e 's/^/[LOG] /' || true
echo
echo "=== LOGS (filtro pagamentos) ==="
vercel logs "$PROD_URL" --since 60m | grep -i "pagamentos" -A2 -B2 | sed -e 's/^/[HIT] /' || true
