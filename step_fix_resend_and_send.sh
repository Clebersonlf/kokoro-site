#!/usr/bin/env bash
set -e

# 0) AJUSTE O E-MAIL DE DESTINO
DEST_EMAIL="cesar.auxiliar@example.com"   # <-- troque pelo e-mail do César

# 1) Remover a RESEND_API_KEY antiga e pedir a nova
echo ">> Removendo RESEND_API_KEY antiga (production)..."
vercel env rm RESEND_API_KEY production -y || true

echo
echo ">> Adicionando NOVA RESEND_API_KEY (production)..."
echo "   * Quando o prompt aparecer, COLE a chave da Resend (formato 're_...') e tecle Enter."
vercel env add RESEND_API_KEY production

# 2) Deploy para produção (para aplicar a nova env)
echo
echo ">> Fazendo deploy para produção..."
npx vercel@latest --prod

# 3) Reenviar o recibo por e-mail
echo
echo ">> Reenviando recibo por e-mail via /api/financeiro/recibo_email"
# ENVs locais (podem já estar no shell, mas garantimos)
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a

BASE_URL="${BASE_URL:-https://www.planckkokoro.com}"
ADMIN_SECRET="${ADMIN_SECRET:-}"

PROF_AUX="baed8b13-f510-4c37-bd1e-60e809af1d93"
VALOR="45.50"
METODO="PIX"
PAGO_EM="2025-09-13T16:10:00-03:00"
OBS="Complemento para fechar comp 09/2025"

echo "=== Enviando para: $DEST_EMAIL ==="
RESP=$(curl -s -X POST "$BASE_URL/api/financeiro/recibo_email" \
  -H "x-admin-secret: $ADMIN_SECRET" -H "Content-Type: application/json" \
  -d "{\"professor_id\":\"$PROF_AUX\",\"valor_pago\":$VALOR,\"metodo\":\"$METODO\",\"pago_em\":\"$PAGO_EM\",\"para_email\":\"$DEST_EMAIL\",\"observacao\":\"$OBS\"}")

echo "$RESP" | jq . || echo "$RESP"
