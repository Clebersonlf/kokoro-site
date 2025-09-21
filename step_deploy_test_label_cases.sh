#!/usr/bin/env bash
set -euo pipefail

# 1) Deploy
npx vercel@latest --prod

# 2) Carrega ADMIN_SECRET local (se existir)
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a

API="https://www.planckkokoro.com/api/financeiro/recibo_email"
HDRS=(-H "Content-Type: application/json" -H "x-admin-secret: ${ADMIN_SECRET}")

echo
echo "== Caso A: faixa PRETA + tipo AUXILIAR => Prof. Auxiliar =="
curl -s -X POST "$API" "${HDRS[@]}" -d '{
  "professor_id":"baed8b13-f510-4c37-bd1e-60e809af1d93",
  "valor_pago":45.50,
  "metodo":"PIX",
  "pago_em":"2025-09-13T16:10:00-03:00",
  "para_email":"clebersonlf@gmail.com",
  "faixa":"preta",
  "tipo":"AUXILIAR"
}' | jq -r '.preview_texto'

echo
echo "== Caso B: faixa MARROM + tipo AUXILIAR => Inst. Auxiliar =="
curl -s -X POST "$API" "${HDRS[@]}" -d '{
  "professor_id":"baed8b13-f510-4c37-bd1e-60e809af1d93",
  "valor_pago":45.50,
  "metodo":"PIX",
  "pago_em":"2025-09-13T16:10:00-03:00",
  "para_email":"clebersonlf@gmail.com",
  "faixa":"marrom",
  "tipo":"AUXILIAR"
}' | jq -r '.preview_texto'

echo
echo "== Caso C: titular => Prof. Titular (prioridade máxima) =="
curl -s -X POST "$API" "${HDRS[@]}" -d '{
  "professor_id":"baed8b13-f510-4c37-bd1e-60e809af1d93",
  "valor_pago":45.50,
  "metodo":"PIX",
  "pago_em":"2025-09-13T16:10:00-03:00",
  "para_email":"clebersonlf@gmail.com",
  "eh_titular": true
}' | jq -r '.preview_texto'

echo
echo "== Caso D: sem faixa/tipo/titular => Colaborador =="
curl -s -X POST "$API" "${HDRS[@]}" -d '{
  "professor_id":"baed8b13-f510-4c37-bd1e-60e809af1d93",
  "valor_pago":45.50,
  "metodo":"PIX",
  "pago_em":"2025-09-13T16:10:00-03:00",
  "para_email":"clebersonlf@gmail.com"
}' | jq -r '.preview_texto'
