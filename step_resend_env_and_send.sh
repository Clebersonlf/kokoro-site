#!/usr/bin/env bash
set -e

DEST_EMAIL="cesar.auxiliar@example.com"   # troque se quiser

echo ">> 1) Puxando envs do Vercel para .env.local"
vercel env pull .env.local || true
set -a; source ./.env.local 2>/dev/null || true; set +a

if [ -z "${RESEND_API_KEY:-}" ]; then
  echo "!! RESEND_API_KEY não está no shell após o pull."
  echo "Cole sua chave (formato re_...) só para esta execução:"
  read -r RESEND_API_KEY
  export RESEND_API_KEY
fi

if [ -z "${RESEND_API_KEY:-}" ]; then
  echo "ERRO: Ainda sem RESEND_API_KEY. Interrompendo."
  exit 1
fi

HTML_FILE="$(ls -1t recibo_cesar_*_final.html 2>/dev/null | head -n1 || true)"
if [ -z "$HTML_FILE" ]; then
  echo "ERRO: não encontrei 'recibo_cesar_*_final.html'. Gere antes com: ./step_recibo_final.sh"
  exit 1
fi

SUBJECT="Recibo de Repasse - César - R$ 45,50"
HTML_CONTENT="$(python3 - <<PY
import json, sys
print(json.dumps(open("$HTML_FILE","r",encoding="utf-8").read()))
PY
)"

echo ">> 2) Enviando via Resend (from: onboarding@resend.dev) para $DEST_EMAIL"
curl -sS https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"onboarding@resend.dev\",
    \"to\": [\"$DEST_EMAIL\"],
    \"subject\": \"$SUBJECT\",
    \"html\": $HTML_CONTENT
  }" | jq .

echo ">> Se aparecer 'id' e 'created_at', o envio foi aceito pela Resend."
