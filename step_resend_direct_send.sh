#!/usr/bin/env bash
set -e

# 0) Ajuste o e-mail do destinatário aqui:
DEST_EMAIL="cesar.auxiliar@example.com"   # troque pelo e-mail do César

# 1) Carrega as ENVs (puxa a RESEND_API_KEY da Vercel p/ .env.local)
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a

if [ -z "${RESEND_API_KEY:-}" ]; then
  echo "ERRO: RESEND_API_KEY não encontrada no ambiente local. Confirme que você adicionou no Vercel e rode 'vercel env pull'."
  exit 1
fi

# 2) Escolhe o HTML do recibo (pega o mais recente gerado)
HTML_FILE="$(ls -1t recibo_cesar_*_final.html 2>/dev/null | head -n1 || true)"
if [ -z "$HTML_FILE" ]; then
  echo "ERRO: não encontrei um arquivo 'recibo_cesar_*_final.html' nesta pasta."
  echo "Gere antes com: ./step_recibo_final.sh"
  exit 1
fi

# 3) Monta assunto e corpo
SUBJECT="Recibo de Repasse - César - R$ 45,50"
HTML_CONTENT="$(python3 - <<PY
import sys, json
html = open("$HTML_FILE", "r", encoding="utf-8").read()
print(json.dumps(html))
PY
)"

echo "=== Enviando via Resend direto (from: onboarding@resend.dev) ==="
curl -sS https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"onboarding@resend.dev\",
    \"to\": [\"$DEST_EMAIL\"],
    \"subject\": \"$SUBJECT\",
    \"html\": $HTML_CONTENT
  }" | jq .

echo "Pronto. Se aparecer \"id\" e \"created_at\" no JSON, o envio foi aceito."
