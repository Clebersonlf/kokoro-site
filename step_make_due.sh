#!/usr/bin/env bash
set -euo pipefail

# 1) ENVs
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a

BASE_URL="${BASE_URL:-https://www.planckkokoro.com}"
ADMIN_SECRET="${ADMIN_SECRET:-}"
CONN="${POSTGRES_URL_NON_POOLING:-${DATABASE_URL:-${POSTGRES_URL:-}}}"

MATR="7728c95b-db7b-42d3-a94c-311a965d17a5"
ALUNO="5cec23fd-3015-4f76-b066-7eb0f02f92a8"
PROF_AUX="baed8b13-f510-4c37-bd1e-60e809af1d93"
COMPET="2025-09-01"        # competência
VALOR="230.00"             # valor pago pelo aluno
PERC_PROF="85.00"          # 85%
PERC_TIT="15.00"

echo "=== ENVs ==="
echo "BASE_URL=$BASE_URL"
echo "ADMIN_SECRET=${ADMIN_SECRET:+<presente>}"
echo "CONN=${CONN:+<presente>}"
[ -n "$ADMIN_SECRET" ] || { echo "ERRO: falta ADMIN_SECRET"; exit 1; }
[ -n "$CONN" ] || { echo "ERRO: falta string de conexão (CONN)"; exit 1; }
echo

# 2) Cria pagamento (se não existir) e o devido no rateios_pagamento
echo "=== Inserindo pagamento e devido (85%) ==="
psql "$CONN" -v ON_ERROR_STOP=1 <<SQL
DO \$\$
DECLARE
  v_matricula uuid := '$MATR'::uuid;
  v_aluno     uuid := '$ALUNO'::uuid;
  v_prof      uuid := '$PROF_AUX'::uuid;
  v_data      date := '$COMPET'::date;
  v_valor     numeric := $VALOR::numeric;
  v_pagamento uuid;
  v_valor_prof numeric;
BEGIN
  -- pagamento
  SELECT id INTO v_pagamento
  FROM pagamentos
  WHERE matricula_id = v_matricula AND aluno_id = v_aluno AND competencia = v_data
  LIMIT 1;

  IF v_pagamento IS NULL THEN
    v_pagamento := gen_random_uuid();
    INSERT INTO pagamentos (id, matricula_id, aluno_id, competencia, valor_pago)
    VALUES (v_pagamento, v_matricula, v_aluno, v_data, v_valor);
  ELSE
    SELECT valor_pago INTO v_valor FROM pagamentos WHERE id = v_pagamento;
  END IF;

  -- devido 85% ao professor auxiliar
  v_valor_prof := round(v_valor * ($PERC_PROF/100.0), 2);

  IF NOT EXISTS (
    SELECT 1 FROM rateios_pagamento
    WHERE pagamento_id = v_pagamento AND professor_id = v_prof
  ) THEN
    INSERT INTO rateios_pagamento
      (id, pagamento_id, professor_id,
       percentual_professor, percentual_titular,
       valor_professor, parte_professor, parte_titular,
       regra_aplicada, criado_em)
    VALUES
      (gen_random_uuid(), v_pagamento, v_prof,
       $PERC_PROF, $PERC_TIT,
       v_valor_prof, v_valor_prof, round(v_valor - v_valor_prof, 2),
       'percentual', now());
  END IF;
END
\$\$;
SQL
echo "OK."
echo

# 3) Mostrar o que ficou no banco (1 amostra)
echo "=== rateios_pagamento (amostra) ==="
psql "$CONN" -qtAc "SELECT pagamento_id, professor_id, percentual_professor, valor_professor, parte_titular, regra_aplicada FROM rateios_pagamento ORDER BY criado_em DESC LIMIT 5;"
echo

# 4) Testes de API
echo "=== /api/financeiro/saldo-professor ==="
curl -s "$BASE_URL/api/financeiro/saldo-professor" -H "x-admin-secret: $ADMIN_SECRET" | jq .
echo
echo "=== /api/financeiro/extrato-professor (auxiliar) ==="
curl -s "$BASE_URL/api/financeiro/extrato-professor?professor_id=$PROF_AUX" -H "x-admin-secret: $ADMIN_SECRET" | jq .
