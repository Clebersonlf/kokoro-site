#!/usr/bin/env bash
set -euo pipefail

echo "==> Procurando a string 'Obs.:' no código"
grep -RIn --line-number "Obs\.\:" ./api || true
echo

echo "==> Procurando referências a 'observacao' (em PT e 'observação')"
grep -RIn --line-number -E "\bobservacao\b|\bobservação\b" ./api || true
echo

echo "==> Mostrar 8 linhas de contexto ao redor das ocorrências principais"
FILES=$(grep -RIl "Obs\.\:" ./api || true)
for f in $FILES; do
  echo
  echo "--- $f ---"
  nl -ba "$f" | sed -n '1,400p' | grep -n "Obs\.\:" | cut -d: -f1 | while read -r ln; do
    start=$((ln-4)); [ $start -lt 1 ] && start=1
    end=$((ln+4))
    echo "[contexto $start..$end]"
    nl -ba "$f" | sed -n "${start},${end}p"
  done
done
