#!/usr/bin/env bash
set -e

# ENVs
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a

BASE_URL="${BASE_URL:-https://www.planckkokoro.com}"
ADMIN_SECRET="${ADMIN_SECRET:-}"
PROF_AUX="baed8b13-f510-4c37-bd1e-60e809af1d93"

VALOR="45.50"
METODO="PIX"

# Use uma data fixa e válida com timezone (formato ISO 8601: YYYY-MM-DDTHH:MM:SS-03:00)
# Se preferir UTC, pode usar o sufixo Z, ex.: 2025-09-13T19:05:00Z
PAGO_EM="2025-09-13T16:10:00-03:00"
OBS_ENC=$(python3 - <<PY
import urllib.parse; print(urllib.parse.quote("Complemento para fechar comp 09/2025"))
PY
)

echo "=== Preview (texto) com data/hora válida ==="
curl -s "$BASE_URL/api/financeiro/recibo?professor_id=$PROF_AUX&valor_pago=$VALOR&metodo=$METODO&pago_em=$PAGO_EM&observacao=$OBS_ENC" \
  -H "x-admin-secret: $ADMIN_SECRET" | jq -r '.texto'

# salvar HTML e TXT (agora deve vir HTML completo, nada de arquivo 5 bytes)
ARQ_BASE="recibo_cesar_${VALOR//./-}_$(date +%Y-%m-%d_%H-%M)_ok"
echo
echo "=== Salvando HTML e TXT ==="
curl -s "$BASE_URL/api/financeiro/recibo?professor_id=$PROF_AUX&valor_pago=$VALOR&metodo=$METODO&pago_em=$PAGO_EM&observacao=$OBS_ENC" \
  -H "x-admin-secret: $ADMIN_SECRET" | jq -r '.html' > "${ARQ_BASE}.html"

curl -s "$BASE_URL/api/financeiro/recibo?professor_id=$PROF_AUX&valor_pago=$VALOR&metodo=$METODO&pago_em=$PAGO_EM&observacao=$OBS_ENC" \
  -H "x-admin-secret: $ADMIN_SECRET" | jq -r '.texto' > "${ARQ_BASE}.txt"

echo "Arquivos criados:"
ls -lh "${ARQ_BASE}.html" "${ARQ_BASE}.txt" || true
echo
echo "Abra no Windows: C:\\Users\\clebe\\Desktop\\kokoro-site\\${ARQ_BASE}.html"
