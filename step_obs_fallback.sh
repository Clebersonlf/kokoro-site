#!/usr/bin/env bash
set -euo pipefail

files=( \
  "./api/financeiro/recibo.js" \
  "./api/financeiro/recibo_email.js" \
  "./api/financeiro/recibo_whatsapp.js" \
)

echo ">> Backups e patch..."
for f in "${files[@]}"; do
  [ -f "$f" ] || { echo "AVISO: não achei $f (ok)"; continue; }
  cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"
  # Substitui a linha da observação por um fallback automático baseado em pago_em
  sed -i \
    "s/observacao ? \`Obs\.: \${observacao}\` : null,/\\\`Obs.: \${ (observacao && observacao.trim()) || ('Repasse ' + new Date(pago_em || Date.now()).toLocaleDateString('pt-BR',{month:'2-digit',year:'numeric'})) }\\\`,/g" \
    "$f"
  echo "   - atualizado: $f"
done

echo
echo ">> Conferindo trechos alterados:"
grep -RIn --line-number "Obs\.\:" ./api/financeiro | sed -n '1,200p' || true
