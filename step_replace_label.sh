#!/usr/bin/env bash
set -euo pipefail

files=(
  "./api/financeiro/recibo.js"
  "./api/financeiro/recibo_email.js"
  "./api/financeiro/recibo_whatsapp.js"
)

echo ">> Fazendo backup e trocando rótulo..."
for f in "${files[@]}"; do
  [ -f "$f" ] || { echo "AVISO: não achei $f (ok)"; continue; }
  cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"
  sed -i 's/PIX da Planck Kokoro/Chave PIX da Planck Kokoro/g' "$f"
  echo "   - atualizado: $f"
done

echo
echo ">> Mostrando trechos após a troca:"
grep -RIn --line-number "Chave PIX da Planck Kokoro" ./api/financeiro || true
