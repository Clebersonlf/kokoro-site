#!/usr/bin/env bash
set -euo pipefail

files=(
  "./api/financeiro/recibo.js"
  "./api/financeiro/recibo_email.js"
  "./api/financeiro/recibo_whatsapp.js"
)

echo ">> Backups e atualização da frase da Chave PIX..."
for f in "${files[@]}"; do
  [ -f "$f" ] || { echo "AVISO: não achei $f (ok)"; continue; }
  cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"
  sed -i 's/Chave PIX da Planck Kokoro/Chave PIX - Planck Kokoro/g' "$f"
  echo "   - atualizado: $f"
done

echo
echo ">> Conferindo ocorrências:"
grep -RIn "Chave PIX" ./api/financeiro | sed -n '1,200p' || true
