#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://www.planckkokoro.com"
ADMIN_SECRET="Semprekokoro@#$"
MATRICULA_ID="7728c95b-db7b-42d3-a94c-311a965d17a5"
ALUNO_ID="5cec23fd-3015-4f76-b066-7eb0f02f92a8"
PREVIEW_PCT=85
PREVIEW_VALOR=230
COMPETENCIA="2025-09-01"

echo "==> Passo 0: checando utilitários"
command -v jq >/dev/null 2>&1 || { echo "ERRO: jq não instalado. sudo apt-get install -y jq"; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "ERRO: curl não instalado."; exit 1; }

echo "==> Passo 1: conferindo ADMIN_SECRET no runtime (/api/admin/check)"
TRY=0
while :; do
  ((TRY++))
  RESP=$(curl -s "${BASE_URL}/api/admin/check" -H "x-admin-secret: ${ADMIN_SECRET}" || true)
  echo "Resposta admin/check (tentativa ${TRY}): $RESP"
  MATCH=$(echo "$RESP" | jq -r '.match // false' 2>/dev/null || echo false)
  if [ "$MATCH" = "true" ]; then
    echo "OK: match=true. Segredo do header confere com o do servidor."
    break
  fi
  if [ $TRY -ge 6 ]; then
    echo "FALHA: match=false após $TRY tentativas."
    echo "Dicas:"
    echo "  1) vercel env ls (ADMIN_SECRET nos 3 ambientes)"
    echo "  2) npx vercel@latest --prod (redeploy p/ propagar)"
    exit 2
  fi
  echo "Aguardando 5s e tentando de novo..."
  sleep 5
done

echo "==> Passo 2: preview (não grava)"
curl -s "${BASE_URL}/api/financeiro/preview?matricula_id=${MATRICULA_ID}&percentual_professor=${PREVIEW_PCT}&valor=${PREVIEW_VALOR}" | jq .

echo "==> Passo 3: gravar rateio ${PREVIEW_PCT}/$((100-PREVIEW_PCT))"
RATEIO=$(curl -s -X POST "${BASE_URL}/api/rateio" \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: ${ADMIN_SECRET}" \
  -d '{"matricula_id":"'"${MATRICULA_ID}"'","percentual_professor":'"${PREVIEW_PCT}"',"inicio_vigencia":"'"${COMPETENCIA}"'"}')
echo "$RATEIO" | jq . || { echo "Corpo bruto rateio: $RATEIO"; exit 3; }
[ "$(echo "$RATEIO" | jq -r '.ok // false')" = "true" ] || { echo "FALHA /api/rateio"; exit 3; }

echo "==> Passo 4: lançar pagamento ${PREVIEW_VALOR} em ${COMPETENCIA}"
PAG=$(curl -s -X POST "${BASE_URL}/api/pagamentos" \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: ${ADMIN_SECRET}" \
  -d '{"aluno_id":"'"${ALUNO_ID}"'","matricula_id":"'"${MATRICULA_ID}"'","competencia":"'"${COMPETENCIA}"'","valor_pago":'"${PREVIEW_VALOR}"'}')
echo "$PAG" | jq . || { echo "Corpo bruto pagamento: $PAG"; exit 4; }
[ "$(echo "$PAG" | jq -r '.ok // false')" = "true" ] || { echo "FALHA /api/pagamentos"; exit 4; }

echo "==> Passo 5: resumo set-dez/2025"
curl -s "${BASE_URL}/api/financeiro/resumo?from=2025-09-01&to=2025-12-31" | jq .

echo
echo "==================== SUCESSO ===================="
echo "✔ ADMIN_SECRET conferido (match=true)"
echo "✔ Rateio gravado"
echo "✔ Pagamento lançado"
echo "✔ Resumo consultado"
echo "================================================"
