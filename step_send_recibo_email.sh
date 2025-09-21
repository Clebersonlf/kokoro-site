#!/usr/bin/env bash
set -e

# 0) AJUSTE AQUI O E-MAIL DE DESTINO
DEST_EMAIL="cesar.auxiliar@example.com"   # <-- troque pelo e-mail do César

# 1) ENVs
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a

BASE_URL="${BASE_URL:-https://www.planckkokoro.com}"
ADMIN_SECRET="${ADMIN_SECRET:-}"
[ -n "$ADMIN_SECRET" ] || { echo "ERRO: falta ADMIN_SECRET"; exit 1; }

PROF_AUX="baed8b13-f510-4c37-bd1e-60e809af1d93"
VALOR="45.50"
METODO="PIX"
PAGO_EM="2025-09-13T16:10:00-03:00"
OBS="Complemento para fechar comp 09/2025"

echo "=== Enviando e-mail de recibo para: $DEST_EMAIL ==="
RESP=$(curl -s -X POST "$BASE_URL/api/financeiro/recibo_email" \
  -H "x-admin-secret: $ADMIN_SECRET" -H "Content-Type: application/json" \
  -d "{\"professor_id\":\"$PROF_AUX\",\"valor_pago\":$VALOR,\"metodo\":\"$METODO\",\"pago_em\":\"$PAGO_EM\",\"para_email\":\"$DEST_EMAIL\",\"observacao\":\"$OBS\"}")

echo "$RESP" | jq . || echo "$RESP"

# 2) Ajuda caso dê erro de API key inválida no Resend
if echo "$RESP" | grep -qi "validation_error"; then
  cat <<'TIP'
---
Parece que a RESEND_API_KEY está inválida.
Para atualizar:

vercel env rm RESEND_API_KEY production -y
vercel env add RESEND_API_KEY production    # cole a chave correta da Resend
npx vercel@latest --prod

Depois, rode novamente este comando:
./step_send_recibo_email.sh
---
TIP
fi
