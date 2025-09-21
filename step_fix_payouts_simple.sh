#!/usr/bin/env bash
set -euo pipefail

# ENVs
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a

BASE_URL="${BASE_URL:-https://www.planckkokoro.com}"
ADMIN_SECRET="${ADMIN_SECRET:-}"
CONN="${POSTGRES_URL_NON_POOLING:-${DATABASE_URL:-${POSTGRES_URL:-}}}"

[ -n "$ADMIN_SECRET" ] || { echo "ERRO: falta ADMIN_SECRET"; exit 1; }
[ -n "$CONN" ] || { echo "ERRO: falta CONN"; exit 1; }

PROF_AUX="baed8b13-f510-4c37-bd1e-60e809af1d93"
DEL_ID="d9485b45-8d75-4a19-aa31-e97708c445d6"

echo "=== Antes (saldo-professor) ==="
curl -s "$BASE_URL/api/financeiro/saldo-professor" -H "x-admin-secret: $ADMIN_SECRET" | jq .
echo
echo "=== Antes (extrato - pagos) ==="
curl -s "$BASE_URL/api/financeiro/extrato-professor?professor_id=$PROF_AUX" \
  -H "x-admin-secret: $ADMIN_SECRET" | jq '.pagos'
echo

echo "=== Removendo payout duplicado ($DEL_ID) ==="
psql "$CONN" -v ON_ERROR_STOP=1 -c "DELETE FROM pagamentos_professor WHERE id = '$DEL_ID';"
echo "OK: payout removido."
echo

echo "=== Inserindo payout complementar de R$45,50 ==="
psql "$CONN" -v ON_ERROR_STOP=1 -c \
"INSERT INTO pagamentos_professor
 (id, professor_id, valor_pago, metodo, pago_em, comprovante_url, observacao, criado_em)
 VALUES (gen_random_uuid(), '$PROF_AUX', 45.50, 'PIX', now(), NULL, 'Complemento para fechar comp 09/2025', now());"
echo "OK: complemento inserido."
echo

echo "=== Depois (saldo-professor) ==="
curl -s "$BASE_URL/api/financeiro/saldo-professor" -H "x-admin-secret: $ADMIN_SECRET" | jq .
echo
echo "=== Depois (extrato - pagos) ==="
curl -s "$BASE_URL/api/financeiro/extrato-professor?professor_id=$PROF_AUX" \
  -H "x-admin-secret: $ADMIN_SECRET" | jq '.pagos'
