#!/usr/bin/env bash
set -euo pipefail

echo "==> Procurando a frase exata no projeto..."
grep -RIn --line-number -n "PIX da Planck Kokoro" . || true
echo

echo "==> Procurando arquivos do recibo (palavras-chave)..."
grep -RIn --line-number -n "Recibo de Repasse" . || true
grep -RIn --line-number -n "Favorecido:" . || true
grep -RIn --line-number -n "PIX do colaborador" . || true
echo

echo "==> Mostrar um trecho (10 linhas) ao redor de cada ocorrência principal"
FILES=$(grep -RIl "PIX da Planck Kokoro" . || true)
for f in $FILES; do
  echo
  echo "----- $f -----"
  nl -ba "$f" | sed -n '1,300p' | grep -n "PIX da Planck Kokoro" | cut -d: -f1 | while read -r ln; do
    start=$((ln-5)); [ $start -lt 1 ] && start=1
    end=$((ln+5))
    echo "[contexto linhas $start..$end]"
    nl -ba "$f" | sed -n "${start},${end}p"
  done
done
