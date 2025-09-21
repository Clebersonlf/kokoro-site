#!/usr/bin/env bash
set -euo pipefail

# 1) ENVs
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a

BASE_URL="${BASE_URL:-https://www.planckkokoro.com}"
ADMIN_SECRET="${ADMIN_SECRET:-}"
[ -n "$ADMIN_SECRET" ] || { echo "ERRO: falta ADMIN_SECRET"; exit 1; }

MATR="7728c95b-db7b-42d3-a94c-311a965d17a5"
ALUNO="5cec23fd-3015-4f76-b066-7eb0f02f92a8"

echo "=== Deploy para produção ==="
npx vercel@latest --prod

echo
echo "=== Teste: POST /api/pagamentos (resposta crua) ==="
REQ_BODY=$(cat <<JSON
{"aluno_id":"$ALUNO","matricula_id":"$MATR","competencia":"2025-09-01","valor_pago":230}
JSON
)
echo "Request body: $REQ_BODY"
echo
curl -i -s -X POST "$BASE_URL/api/pagamentos" \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: $ADMIN_SECRET" \
  -d "$REQ_BODY" | sed -e 's/^/> /'

echo
echo "=== saldo-professor ==="
curl -s "$BASE_URL/api/financeiro/saldo-professor" -H "x-admin-secret: $ADMIN_SECRET" | jq .

echo
echo "=== extrato-professor (auxiliar) ==="
PROF_AUX="baed8b13-f510-4c37-bd1e-60e809af1d93"
curl -s "$BASE_URL/api/financeiro/extrato-professor?professor_id=$PROF_AUX" -H "x-admin-secret: $ADMIN_SECRET" | jq .
