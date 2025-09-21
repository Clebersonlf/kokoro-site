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
PAGO_EM="2025-09-13T16:10:00-03:00"
OBS_ENC=$(python3 - <<PY
import urllib.parse; print(urllib.parse.quote("Complemento para fechar comp 09/2025"))
PY
)

# 1) Buscar JSON
JSON_FILE="_recibo_final.json"
curl -s "$BASE_URL/api/financeiro/recibo?professor_id=$PROF_AUX&valor_pago=$VALOR&metodo=$METODO&pago_em=$PAGO_EM&observacao=$OBS_ENC" \
  -H "x-admin-secret: $ADMIN_SECRET" > "$JSON_FILE"

TXT=$(jq -r '.texto' "$JSON_FILE")
HTML=$(jq -r '.html // empty' "$JSON_FILE")

# 2) Salvar arquivos (gera HTML fallback se vier nulo)
ARQ_BASE="recibo_cesar_${VALOR//./-}_$(date +%Y-%m-%d_%H-%M)_final"
TXT_OUT="${ARQ_BASE}.txt"
HTML_OUT="${ARQ_BASE}.html"

printf "%s\n" "$TXT" > "$TXT_OUT"

if [ -z "$HTML" ] || [ "$HTML" = "null" ]; then
  python3 - "$TXT" "$HTML_OUT" <<'PY'
import sys, html
texto = sys.argv[1]; dest = sys.argv[2]
body = "<br>".join(html.escape(texto).splitlines())
tpl = f"""<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"><title>Recibo de Repasse</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif;background:#f6f7f9;margin:0;padding:24px}}
.card{{max-width:720px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;box-shadow:0 10px 20px rgba(0,0,0,.04)}}
h1{{font-size:20px;margin:0 0 12px}} .muted{{color:#6b7280;font-size:13px;margin-bottom:16px}}
.content{{font-size:16px;line-height:1.6}} .footer{{margin-top:20px;font-size:12px;color:#6b7280}}
@media print{{body{{background:#fff}} .card{{box-shadow:none;border:0}}}}
</style></head><body>
<div class="card"><h1>Recibo de Repasse</h1>
<div class="muted">Gerado pelo sistema Kokoro</div>
<div class="content">{body}</div>
<div class="footer">Este recibo foi gerado automaticamente.</div>
</div></body></html>"""
open(dest, "w", encoding="utf-8").write(tpl)
PY
else
  printf "%s\n" "$HTML" > "$HTML_OUT"
fi

echo "Arquivos gerados:"
ls -lh "$HTML_OUT" "$TXT_OUT" || true
echo
echo "Abra no Windows: C:\\Users\\clebe\\Desktop\\kokoro-site\\$HTML_OUT"
