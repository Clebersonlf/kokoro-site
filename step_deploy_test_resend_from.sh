#!/usr/bin/env bash
set -euo pipefail

# 1) deploy
npx vercel@latest --prod

# 2) carrega secrets
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a

# 3) testa envio de e-mail
curl -sS -X POST "https://www.planckkokoro.com/api/financeiro/recibo_email" \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: ${ADMIN_SECRET}" \
  -d '{
    "professor_id": "baed8b13-f510-4c37-bd1e-60e809af1d93",
    "valor_pago": 50.00,
    "metodo": "PIX",
    "pago_em": "2025-09-15T14:10:00-03:00",
    "para_email": "clebersonlf@gmail.com",
    "faixa": "preta",
    "tipo": "AUXILIAR"
  }' | jq .preview_texto
