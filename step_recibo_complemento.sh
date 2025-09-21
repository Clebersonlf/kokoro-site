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
# usa a data do payout que acabamos de inserir; pode ser "now" também
PAGO_EM="$(date -u +"%Y-%m-%dT%H:%M:%S%z")"   # ajuste se quiser outra data/hora
OBS="Complemento para fechar comp 09/2025"

echo "=== Gerando recibo (preview texto) ==="
curl -s "$BASE_URL/api/financeiro/recibo?professor_id=$PROF_AUX&valor_pago=$VALOR&metodo=$METODO&pago_em=$PAGO_EM&observacao=$(python3 - <<PY
import urllib.parse; print(urllib.parse.quote("Complemento para fechar comp 09/2025"))
PY
)" -H "x-admin-secret: $ADMIN_SECRET" | jq -r '.texto'

# salvar HTML e TXT
ARQ_BASE="recibo_cesar_${VALOR//./-}_$(date +%Y-%m-%d_%H-%M)"
echo
echo "=== Salvando HTML e TXT em arquivos ==="
curl -s "$BASE_URL/api/financeiro/recibo?professor_id=$PROF_AUX&valor_pago=$VALOR&metodo=$METODO&pago_em=$PAGO_EM&observacao=$(python3 - <<PY
import urllib.parse; print(urllib.parse.quote("Complemento para fechar comp 09/2025"))
PY
)" -H "x-admin-secret: $ADMIN_SECRET" | jq -r '.html' > "${ARQ_BASE}.html"

curl -s "$BASE_URL/api/financeiro/recibo?professor_id=$PROF_AUX&valor_pago=$VALOR&metodo=$METODO&pago_em=$PAGO_EM&observacao=$(python3 - <<PY
import urllib.parse; print(urllib.parse.quote("Complemento para fechar comp 09/2025"))
PY
)" -H "x-admin-secret: $ADMIN_SECRET" | jq -r '.texto' > "${ARQ_BASE}.txt"

echo "Arquivos criados:"
ls -l "${ARQ_BASE}.html" "${ARQ_BASE}.txt" || true
echo
echo "Para abrir no Windows: Explorer > vá até C:\\Users\\clebe\\Desktop\\kokoro-site e clique no arquivo ${ARQ_BASE}.html"
