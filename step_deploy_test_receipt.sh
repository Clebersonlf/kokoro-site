#!/usr/bin/env bash
set -euo pipefail

# 1) Deploy
npx vercel@latest --prod

# 2) Enviar recibo por e-mail (mostra só a prévia de texto)
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a

curl -s -X POST "https://www.planckkokoro.com/api/financeiro/recibo_email" \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: ${ADMIN_SECRET}" \
  -d '{
    "professor_id": "baed8b13-f510-4c37-bd1e-60e809af1d93",
    "valor_pago": 45.50,
    "metodo": "PIX",
    "pago_em": "2025-09-13T16:10:00-03:00",
    "observacao": "Complemento para fechar comp 09/2025",
    "para_email": "clebersonlf@gmail.com"
  }' | jq -r '.preview_texto'
