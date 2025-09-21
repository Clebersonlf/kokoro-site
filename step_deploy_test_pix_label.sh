#!/usr/bin/env bash
set -euo pipefail

# 1) Deploy
npx vercel@latest --prod

# 2) Carrega ADMIN_SECRET local (se existir)
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a

# 3) Testa o recibo e mostra apenas a prévia do texto
curl -s -X POST "https://www.planckkokoro.com/api/financeiro/recibo_email" \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: ${ADMIN_SECRET}" \
  -d '{
    "professor_id": "baed8b13-f510-4c37-bd1e-60e809af1d93",
    "valor_pago": 45.50,
    "metodo": "PIX",
    "pago_em": "2025-09-13T16:10:00-03:00",
    "para_email": "clebersonlf@gmail.com"
  }' | jq -r '.preview_texto'
