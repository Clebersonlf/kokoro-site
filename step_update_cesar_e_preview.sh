#!/usr/bin/env bash
set -e

# ENVs
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a
BASE_URL="${BASE_URL:-https://www.planckkokoro.com}"
ADMIN_SECRET="${ADMIN_SECRET:-}"
CONN="${POSTGRES_URL_NON_POOLING:-${DATABASE_URL:-${POSTGRES_URL:-}}}"
[ -n "$ADMIN_SECRET" ] || { echo "ERRO: falta ADMIN_SECRET"; exit 1; }
[ -n "$CONN" ] || { echo "ERRO: falta CONN"; exit 1; }

# Professor auxiliar (César)
PROF_AUX="baed8b13-f510-4c37-bd1e-60e809af1d93"

# >>> DADOS ENVIADOS POR VOCÊ <<<
FAVORECIDO_NOME="Cezar Augusto De Souza"
DOC_FAVORECIDO="06355675639"   # CPF só com dígitos
PIX_CHAVE="4e5a0c58-a1c9-47e6-99d8-79b454290095"

echo "=== Atualizando dados do professor (PIX/CPF/nome) ==="
psql "$CONN" -v ON_ERROR_STOP=1 -c "
  UPDATE professores
     SET pix_chave='${PIX_CHAVE}',
         favorecido_nome='${FAVORECIDO_NOME}',
         doc_favorecido='${DOC_FAVORECIDO}'
   WHERE id='${PROF_AUX}';
"
echo "OK: dados atualizados."
echo

# Pré-visualiza o recibo do complemento já gerado (R$ 45,50)
VALOR="45.50"
METODO="PIX"
PAGO_EM="2025-09-13T16:10:00-03:00"
OBS_ENC=$(python3 - <<PY
import urllib.parse; print(urllib.parse.quote("Complemento para fechar comp 09/2025"))
PY
)

echo "=== Preview do recibo (texto) com dados bancários preenchidos ==="
curl -s "$BASE_URL/api/financeiro/recibo?professor_id=$PROF_AUX&valor_pago=$VALOR&metodo=$METODO&pago_em=$PAGO_EM&observacao=$OBS_ENC" \
  -H "x-admin-secret: $ADMIN_SECRET" | jq -r '.texto'
