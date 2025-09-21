#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://www.planckkokoro.com"
ADMIN_SECRET_VALUE="Semprekokoro@#$"     # o mesmo que você já usa
PREVIEW_PCT=85
PREVIEW_VALOR=230
COMPETENCIA="2025-09-01"

echo "==> 1) Variáveis do Vercel -> .env.local"
vercel env pull .env.local >/dev/null
set -a; source ./.env.local || true; set +a
export DATABASE_URL="${DATABASE_URL:-${POSTGRES_URL:-}}"
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERRO: DATABASE_URL não encontrado." ; exit 1
fi

# só para garantir o segredo no shell
export ADMIN_SECRET="${ADMIN_SECRET_VALUE}"

echo "==> 2) Diagnóstico do ADMIN_SECRET no runtime"
CHECK_JSON=$(curl -s "${BASE_URL}/api/admin/check" -H "x-admin-secret: ${ADMIN_SECRET_VALUE}")
echo "$CHECK_JSON" | jq .
MATCH=$(echo "$CHECK_JSON" | jq -r '.match')
if [[ "$MATCH" != "true" ]]; then
  echo "FALHA: ADMIN_SECRET do header NÃO bate com o de produção."
  echo "Corrija com:"
  echo "  vercel env rm ADMIN_SECRET -y"
  echo "  vercel env add ADMIN_SECRET production     # cole: ${ADMIN_SECRET_VALUE}"
  echo "  vercel env add ADMIN_SECRET preview        # cole: ${ADMIN_SECRET_VALUE}"
  echo "  vercel env add ADMIN_SECRET development    # cole: ${ADMIN_SECRET_VALUE}"
  echo "  npx vercel@latest --prod"
  exit 1
fi
echo "OK: segredo confere."

echo "==> 3) Dados fictícios (idempotente)"
psql "$DATABASE_URL" >/dev/null <<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Professores
INSERT INTO professores (id,nome,tipo,ativo)
SELECT gen_random_uuid(),'Cleberson (Titular)','TITULAR',true
WHERE NOT EXISTS (SELECT 1 FROM professores WHERE nome='Cleberson (Titular)');

INSERT INTO professores (id,nome,tipo,ativo)
SELECT gen_random_uuid(),'César (Auxiliar)','AUXILIAR',true
WHERE NOT EXISTS (SELECT 1 FROM professores WHERE nome='César (Auxiliar)');

-- Planos
INSERT INTO planos (id,nome,periodicidade,valor_padrao,ativo)
SELECT gen_random_uuid(),'Base','MENSAL',150.00,true
WHERE NOT EXISTS (SELECT 1 FROM planos WHERE nome='Base');

INSERT INTO planos (id,nome,periodicidade,valor_padrao,ativo)
SELECT gen_random_uuid(),'Todas as aulas','MENSAL',230.00,true
WHERE NOT EXISTS (SELECT 1 FROM planos WHERE nome='Todas as aulas');

-- Aluno
INSERT INTO alunos (id,nome)
SELECT gen_random_uuid(),'Aluno Teste'
WHERE NOT EXISTS (SELECT 1 FROM alunos WHERE nome='Aluno Teste');
SQL

ALUNO_ID=$(psql "$DATABASE_URL" -t -A -c "SELECT id FROM alunos WHERE nome='Aluno Teste' LIMIT 1;")
PROF_AUX_ID=$(psql "$DATABASE_URL" -t -A -c "SELECT id FROM professores WHERE nome='César (Auxiliar)' LIMIT 1;")
PLANO_ID=$(psql "$DATABASE_URL" -t -A -c "SELECT id FROM planos WHERE nome='Base' LIMIT 1;")

echo "IDs:"
echo "  ALUNO_ID    = $ALUNO_ID"
echo "  PROF_AUX_ID = $PROF_AUX_ID"
echo "  PLANO_ID    = $PLANO_ID"

echo "==> 4) Matrícula (cria se faltar, exige HORARIO)"
MATRICULA_ID=$(psql "$DATABASE_URL" -t -A -c "
  WITH x AS (
    SELECT id FROM matriculas
     WHERE aluno_id='${ALUNO_ID}' AND professor_id='${PROF_AUX_ID}' AND plano_id='${PLANO_ID}' AND ativo=true
     LIMIT 1
  )
  SELECT COALESCE(
    (SELECT id FROM x),
    (WITH ins AS (
       INSERT INTO matriculas (id, aluno_id, professor_id, plano_id, horario, ativo)
       VALUES (gen_random_uuid(), '${ALUNO_ID}', '${PROF_AUX_ID}', '${PLANO_ID}', 'MANHA', true)
       RETURNING id
     ) SELECT id FROM ins)
  );
")
echo "  MATRICULA_ID = $MATRICULA_ID"

echo "==> 5) PREVIEW (sem gravar)"
curl -s "${BASE_URL}/api/financeiro/preview?matricula_id=${MATRICULA_ID}&percentual_professor=${PREVIEW_PCT}&valor=${PREVIEW_VALOR}" | jq .

echo "==> 6) RATEIO (gravar ${PREVIEW_PCT}/$((100-PREVIEW_PCT)))"
RATEIO_JSON=$(curl -s -X POST "${BASE_URL}/api/rateio" \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: ${ADMIN_SECRET_VALUE}" \
  -d '{"matricula_id":"'"${MATRICULA_ID}"'","percentual_professor":'"${PREVIEW_PCT}"'}')
echo "$RATEIO_JSON" | jq .
if [[ "$(echo "$RATEIO_JSON" | jq -r '.ok')" != "true" ]]; then
  echo "FALHA: /api/rateio" ; exit 1
fi

echo "==> 7) PAGAMENTO (R$ ${PREVIEW_VALOR} em ${COMPETENCIA})"
PAG_JSON=$(curl -s -X POST "${BASE_URL}/api/pagamentos" \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: ${ADMIN_SECRET_VALUE}" \
  -d '{
    "aluno_id":"'"${ALUNO_ID}"'",
    "matricula_id":"'"${MATRICULA_ID}"'",
    "competencia":"'"${COMPETENCIA}"'",
    "valor_pago":'"${PREVIEW_VALOR}"'
  }')
echo "$PAG_JSON" | jq .
if [[ "$(echo "$PAG_JSON" | jq -r '.ok')" != "true" ]]; then
  echo "FALHA: /api/pagamentos" ; exit 1
fi

echo "==> 8) RESUMO (set a dez/2025)"
curl -s "${BASE_URL}/api/financeiro/resumo?from=2025-09-01&to=2025-12-31" | jq .

echo
echo "==================== OK ===================="
echo "✔ Segredo no runtime confere"
echo "✔ Matrícula válida"
echo "✔ Preview OK"
echo "✔ Regra de rateio gravada"
echo "✔ Pagamento lançado com split"
echo "✔ Resumo consultado"
echo "==========================================="
