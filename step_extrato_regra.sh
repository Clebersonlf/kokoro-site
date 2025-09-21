#!/usr/bin/env bash
set -euo pipefail

# Carrega ENVs (se existir .env.local puxado da Vercel)
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a

BASE_URL="${BASE_URL:-https://www.planckkokoro.com}"
ADMIN_SECRET="${ADMIN_SECRET:-}"
CONN="${POSTGRES_URL_NON_POOLING:-${DATABASE_URL:-${POSTGRES_URL:-}}}"

echo "=== ENVs ==="
echo "BASE_URL=$BASE_URL"
echo "ADMIN_SECRET=${ADMIN_SECRET:+<presente>}"
echo "CONN=${CONN:+<presente>}"
[ -n "$ADMIN_SECRET" ] || { echo "ERRO: falta ADMIN_SECRET"; exit 1; }
[ -n "$CONN" ] || { echo "ERRO: falta string de conexão (CONN)"; exit 1; }
echo

echo "=== Tabela rateios_pagamento existe? ==="
psql "$CONN" -qtAc "SELECT to_regclass('rateios_pagamento') IS NOT NULL;" | grep -q t && echo "OK" || { echo "ERRO: tabela rateios_pagamento não existe"; exit 1; }
echo

echo "=== Colunas atuais de rateios_pagamento ==="
psql "$CONN" -qtAc "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='rateios_pagamento' ORDER BY ordinal_position;"
echo

echo "=== Adicionando coluna gerada regra_usada (se não existir) ==="
psql "$CONN" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rateios_pagamento' AND column_name = 'regra_usada'
  ) THEN
    ALTER TABLE rateios_pagamento
      ADD COLUMN regra_usada text
      GENERATED ALWAYS AS (
        CASE
          WHEN percentual_professor IS NOT NULL THEN 'percentual'
          WHEN valor_professor      IS NOT NULL THEN 'valor'
          ELSE NULL
        END
      ) STORED;
  END IF;
END$$;
SQL
echo "OK."
echo

echo "=== Conferindo regra_usada ==="
psql "$CONN" -qtAc "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='rateios_pagamento' AND column_name='regra_usada';"
echo

echo "=== Teste da rota /api/financeiro/extrato-professor ==="
PROF_AUX="baed8b13-f510-4c37-bd1e-60e809af1d93"
curl -s "$BASE_URL/api/financeiro/extrato-professor?professor_id=$PROF_AUX" -H "x-admin-secret: $ADMIN_SECRET" | jq .
